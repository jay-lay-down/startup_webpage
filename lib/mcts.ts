// lib/mcts.ts

export type Stats = {
  product: number;
  founder: number; // ✅ 정식 키: founder
  strategy: number;
  marketing: number;
  consumer_needs: number;

  concept_fit: number;
  price_fit: number;
  business_model_fit: number;
  distribution: number;
  market_scope: number;
  potential_customers: number;
};

export const STAGES = ["Seed", "MVP", "PMF", "Scale-up", "Unicorn"] as const;
export type Stage = (typeof STAGES)[number];

type WeightMap = Partial<Record<keyof Stats, number>>;

// ✅ 이전 버전 호환: route/front가 team으로 보내도 founder로 취급
export type StatsInput = Partial<Stats> & { team?: number };

function clamp0to100(v: any, fallback = 35): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function clamp01(v: any, fallback = 0): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(1, n));
}

function audienceBand(score: number) {
  if (score >= 80) return "Mass";
  if (score >= 60) return "Broad";
  if (score >= 45) return "Mid";
  if (score >= 30) return "Niche";
  return "Tiny";
}

// ✅ founder는 founder 우선, 없으면 team을 alias로 사용
function getStat(stats: StatsInput, key: keyof Stats): number {
  if (key === "founder") {
    const v = (stats as any).founder ?? (stats as any).team;
    return clamp0to100(v, 50);
  }
  return clamp0to100((stats as any)?.[key], 50);
}

/* =========================
   Market share simulation
   ========================= */

export type Tri = { min: number; mode: number; max: number };

export type MarketAssumptionsInput = {
  /**
   * 전체 시장 고객수(예: 연간 구매자 수). number(고정) 또는 Tri(분포).
   * - market_revenue가 있으면 없어도 됨
   */
  market_customers?: number | Tri;

  /**
   * 전체 시장 매출(분모를 매출로 사용). number 또는 Tri.
   * - 있으면 market_customers 없이도 가능
   */
  market_revenue?: number | Tri;

  /** 가격(ARPU/ASP) */
  price?: number | Tri;

  /** 고객 1명당 연간 구매(결제) 횟수 */
  purchase_freq_per_year?: number | Tri;

  /**
   * 침투율 상한(0~1). 없으면 보수적 기본 prior로 처리(※시장조사로는 잘 안 나오는 값이라)
   * - 그래도 원하시면 route에서 추정해 넣으면 됨
   */
  max_penetration?: number | Tri;

  /**
   * stage 도달 시 매출 스케일(선택)
   * - 없으면 1로 두고 계산
   */
  stage_revenue_factor?: Partial<Record<Stage, number | Tri>>;

  /** route가 Tavily/LLM으로 채운 경우 표시용 메타(선택) */
  source?: "user" | "tavily" | "synthetic";
};

export type RunWithMarketOptions = {
  /**
   * ✅ 기본 false:
   * - 시장 가정이 부족하면 "임의(default)"로 돌리지 않고 market_needed=true 반환
   * true로 하면, 부족한 항목을 내부 prior로 채워서 강제로 돌릴 수 있음
   */
  allow_synthetic_fallback?: boolean;
};

export type MarketAssumptionsResolved = {
  ready: boolean;
  missing_fields: string[];

  // resolved (when ready)
  market_customers?: Tri;
  market_revenue?: Tri;
  price?: Tri;
  purchase_freq_per_year?: Tri;
  max_penetration?: Tri;
  stage_revenue_factor?: Partial<Record<Stage, Tri>>;

  // meta
  used_synthetic_fallback: boolean;
  source: "user" | "tavily" | "synthetic" | "unknown";
  notes?: string;
};

function toTri(v: number | Tri | undefined): Tri | undefined {
  if (typeof v === "number" && Number.isFinite(v)) {
    return { min: v, mode: v, max: v };
  }
  if (v && typeof v === "object") {
    const min = Number((v as any).min);
    const mode = Number((v as any).mode);
    const max = Number((v as any).max);
    const ok = [min, mode, max].every(Number.isFinite) && min <= mode && mode <= max;
    if (ok) return { min, mode, max };
  }
  return undefined;
}

// 삼각분포 샘플링
function sampleTri(t: Tri) {
  const min = Number(t.min);
  const mode = Number(t.mode);
  const max = Number(t.max);
  if (![min, mode, max].every(Number.isFinite)) return 0;
  if (max <= min) return min;

  const u = Math.random();
  const c = (mode - min) / (max - min);

  if (u < c) return min + Math.sqrt(u * (max - min) * (mode - min));
  return max - Math.sqrt((1 - u) * (max - min) * (max - mode));
}

function sigmoid(x: number) {
  return 1 / (1 + Math.exp(-x));
}

// 0~100 점수 → 0~1 비율 (커브 튜닝 가능)
function scoreToFrac(score0to100: number, center = 55, steep = 10) {
  return sigmoid((score0to100 - center) / steep);
}

function mean(arr: number[]) {
  if (!arr.length) return 0;
  return arr.reduce((s, x) => s + x, 0) / arr.length;
}

function quantile(sorted: number[], p: number) {
  if (!sorted.length) return 0;
  const idx = Math.floor((sorted.length - 1) * p);
  return sorted[Math.max(0, Math.min(sorted.length - 1, idx))] ?? 0;
}

function resolveMarketAssumptions(
  input?: MarketAssumptionsInput,
  opts?: RunWithMarketOptions
): MarketAssumptionsResolved {
  const allowFallback = !!opts?.allow_synthetic_fallback;

  // 내부 prior(“임의”라기보다 모델 기본 가정) — fallback 허용할 때만 사용
  const prior = {
    market_customers: { min: 200_000, mode: 1_000_000, max: 5_000_000 } as Tri,
    price: { min: 15, mode: 35, max: 90 } as Tri,
    purchase_freq_per_year: { min: 1, mode: 2, max: 6 } as Tri,
    max_penetration: { min: 0.0005, mode: 0.003, max: 0.02 } as Tri, // 0.05%~0.3%~2%
  };

  const market_customers = toTri(input?.market_customers);
  const market_revenue = toTri(input?.market_revenue);
  const price = toTri(input?.price);
  const freq = toTri(input?.purchase_freq_per_year);
  const maxPen = toTri(input?.max_penetration);

  const missing: string[] = [];

  // 분모는 market_revenue or market_customers 중 하나는 필요
  if (!market_revenue && !market_customers) missing.push("market_revenue or market_customers");
  if (!price) missing.push("price");
  if (!freq) missing.push("purchase_freq_per_year");
  // max_penetration은 “없어도” 굴릴 수 있게(기본 prior) 처리: 다만 fallback 금지면 missing 처리
  if (!maxPen && !allowFallback) missing.push("max_penetration");

  // stage factor (optional)
  let stageFactors: Partial<Record<Stage, Tri>> | undefined = undefined;
  if (input?.stage_revenue_factor) {
    stageFactors = {};
    for (const st of STAGES) {
      const v = (input.stage_revenue_factor as any)[st];
      const t = toTri(v);
      if (t) stageFactors[st] = t;
    }
  }

  if (missing.length > 0 && !allowFallback) {
    return {
      ready: false,
      missing_fields: missing,
      used_synthetic_fallback: false,
      source: input?.source ?? "unknown",
      notes: "Market assumptions missing. Provide values or fill them via Tavily/LLM in the route.",
    };
  }

  // fallback 채우기
  const resolved: MarketAssumptionsResolved = {
    ready: true,
    missing_fields: [],
    market_customers: market_customers ?? (market_revenue ? undefined : prior.market_customers),
    market_revenue,
    price: price ?? prior.price,
    purchase_freq_per_year: freq ?? prior.purchase_freq_per_year,
    max_penetration: maxPen ?? prior.max_penetration,
    stage_revenue_factor: stageFactors,
    used_synthetic_fallback: missing.length > 0,
    source: (input?.source ?? (missing.length > 0 ? "synthetic" : "user")) as any,
  };

  return resolved;
}

/* =========================
   MCTS
   ========================= */

export class StartupMCTS {
  private iterations: number;
  private stageWeights: Record<Stage, WeightMap>;
  private stageHurdle: Record<Stage, number>;
  private stageScale: Record<Stage, number>;

  constructor(iterations: number = 1000) {
    this.iterations = iterations;

    this.stageWeights = {
      Seed: {
        founder: 0.20,
        concept_fit: 0.16,
        price_fit: 0.08,
        business_model_fit: 0.08,
        consumer_needs: 0.18,
        product: 0.12,
        potential_customers: 0.10,
        strategy: 0.05,
        distribution: 0.02,
        marketing: 0.01,
        market_scope: 0.00,
      },
      MVP: {
        founder: 0.14,
        concept_fit: 0.14,
        price_fit: 0.07,
        business_model_fit: 0.07,
        consumer_needs: 0.18,
        product: 0.14,
        distribution: 0.10,
        potential_customers: 0.08,
        marketing: 0.06,
        strategy: 0.02,
        market_scope: 0.00,
      },
      PMF: {
        consumer_needs: 0.18,
        product: 0.16,
        distribution: 0.16,
        marketing: 0.14,
        price_fit: 0.07,
        business_model_fit: 0.07,
        concept_fit: 0.10,
        potential_customers: 0.08,
        strategy: 0.04,
        founder: 0.00,
        market_scope: 0.00,
      },
      "Scale-up": {
        strategy: 0.20,
        marketing: 0.20,
        market_scope: 0.14,
        distribution: 0.14,
        price_fit: 0.05,
        business_model_fit: 0.05,
        potential_customers: 0.10,
        product: 0.06,
        concept_fit: 0.04,
        consumer_needs: 0.02,
        founder: 0.00,
      },
      Unicorn: {
        marketing: 0.22,
        strategy: 0.20,
        market_scope: 0.18,
        distribution: 0.12,
        potential_customers: 0.12,
        price_fit: 0.04,
        business_model_fit: 0.04,
        product: 0.04,
        concept_fit: 0.02,
        consumer_needs: 0.02,
        founder: 0.00,
      },
    };

    this.stageHurdle = {
      Seed: 55,
      MVP: 60,
      PMF: 65,
      "Scale-up": 70,
      Unicorn: 75,
    };

    this.stageScale = {
      Seed: 10,
      MVP: 10,
      PMF: 11,
      "Scale-up": 12,
      Unicorn: 12,
    };
  }

  private getSurvivalProb(stats: StatsInput, stage: Stage): number {
    const weights = this.stageWeights[stage];

    let score = 0;
    let weightSum = 0;

    for (const key of Object.keys(weights) as (keyof Stats)[]) {
      const w = weights[key] ?? 0;
      if (w <= 0) continue;

      const s = getStat(stats, key);
      score += s * w;
      weightSum += w;
    }

    const normalized = weightSum > 0 ? score / weightSum : 0; // 0~100
    const hurdle = this.stageHurdle[stage];
    const scale = this.stageScale[stage];
    const p = scoreToFrac(normalized, hurdle, scale);

    return Math.max(0.0, Math.min(1.0, p));
  }

  public run(stats: StatsInput) {
    const deathCounts: Record<Stage, number> = {
      Seed: 0,
      MVP: 0,
      PMF: 0,
      "Scale-up": 0,
      Unicorn: 0,
    };
    const stageEntries: Record<Stage, number> = {
      Seed: 0,
      MVP: 0,
      PMF: 0,
      "Scale-up": 0,
      Unicorn: 0,
    };

    let survivors = 0;

    for (let i = 0; i < this.iterations; i++) {
      let diedAt: Stage | null = null;

      for (const stage of STAGES) {
        stageEntries[stage]++;
        if (Math.random() > this.getSurvivalProb(stats, stage)) {
          diedAt = stage;
          break;
        }
      }

      if (diedAt) deathCounts[diedAt]++;
      else survivors++;
    }

    const stagePassProbabilities = (Object.keys(stageEntries) as Stage[]).reduce(
      (acc, stage) => {
        acc[stage] = this.getSurvivalProb(stats, stage);
        return acc;
      },
      {} as Record<Stage, number>
    );

    const deathRates = (Object.keys(stageEntries) as Stage[]).reduce(
      (acc, stage) => {
        acc[stage] = stageEntries[stage] > 0 ? deathCounts[stage] / stageEntries[stage] : 0;
        return acc;
      },
      {} as Record<Stage, number>
    );

    const stageSurvivalRates = (Object.keys(stageEntries) as Stage[]).reduce(
      (acc, stage) => {
        acc[stage] = stageEntries[stage] > 0 ? 1 - deathRates[stage] : 0;
        return acc;
      },
      {} as Record<Stage, number>
    );

    const stageReachRates = (Object.keys(stageEntries) as Stage[]).reduce(
      (acc, stage) => {
        acc[stage] = stageEntries[stage] / this.iterations;
        return acc;
      },
      {} as Record<Stage, number>
    );

    const bottleneckStage = (Object.keys(deathRates) as Stage[]).reduce((a, b) =>
      deathRates[a] > deathRates[b] ? a : b
    );

    const audienceScore = clamp0to100((stats as any)?.potential_customers, 50);
    const band = audienceBand(audienceScore);

    const survivalRate = (survivors / this.iterations) * 100;

    return {
      survival_rate: survivalRate,
      death_counts: deathCounts,
      stage_entries: stageEntries,
      stage_pass_probabilities: stagePassProbabilities,
      death_rates: deathRates,
      stage_survival_rates: stageSurvivalRates,
      stage_reach_rates: stageReachRates,
      bottleneck_stage: bottleneckStage,

      potential_customers_score: audienceScore,
      potential_customers_band: band,

      // legacy
      survivalRate,
      deathCounts,
      stageEntries,
      stagePassProbabilities,
      deathRates,
      stageSurvivalRates,
      stageReachRates,
      bottleneck: bottleneckStage,
      potentialCustomersScore: audienceScore,
      potentialCustomersBand: band,
    };
  }

  /**
   * ✅ 시장점유율/매출 시뮬레이션까지 포함
   * - 기본: market 입력이 부족하면 "임의"로 돌리지 않고 market_needed=true
   * - allow_synthetic_fallback=true면 prior로 채워서 강제로 돌릴 수 있음
   */
  public runWithMarket(stats: StatsInput, market?: MarketAssumptionsInput, opts?: RunWithMarketOptions) {
    const base = this.run(stats);
    const resolved = resolveMarketAssumptions(market, opts);

    if (!resolved.ready) {
      return {
        ...base,
        market_needed: true,
        market_required_fields: resolved.missing_fields,
        market_assumptions: resolved,

        market_share: null,
        market_layers: null,
      };
    }

    const shares: number[] = [];
    const myRev: number[] = [];
    const mktRev: number[] = [];
    const samRev: number[] = [];

    const mktCust: number[] = [];
    const samCust: number[] = [];
    const acqCust: number[] = [];

    for (let i = 0; i < this.iterations; i++) {
      // 1) 샘플링 (시장규모는 생존 여부와 무관하게 계산)
      const price = Math.max(0, sampleTri(resolved.price!));
      const freq = Math.max(0, sampleTri(resolved.purchase_freq_per_year!));
      const maxPen = clamp01(sampleTri(resolved.max_penetration!));

      const marketCustomers = resolved.market_customers ? Math.max(0, sampleTri(resolved.market_customers)) : 0;

      // 2) addressable (SAM) 비율: market_scope + potential_customers
      const scopeScore = clamp0to100((stats as any)?.market_scope, 50);
      const audienceScore = clamp0to100((stats as any)?.potential_customers, 50);

      const addressableFrac =
        0.5 * scoreToFrac(scopeScore, 55, 12) + 0.5 * scoreToFrac(audienceScore, 55, 12);

      const samCustomers = marketCustomers * clamp01(addressableFrac);

      // 3) penetration(침투) 비율: executionScore → 0~maxPen
      const p = clamp0to100((stats as any)?.product, 50);
      const mk = clamp0to100((stats as any)?.marketing, 50);
      const d = clamp0to100((stats as any)?.distribution, 50);
      const st = clamp0to100((stats as any)?.strategy, 50);
      const pr = clamp0to100((stats as any)?.price_fit, 50);
      const bm = clamp0to100((stats as any)?.business_model_fit, 50);

      const executionScore = 0.25 * p + 0.25 * mk + 0.2 * d + 0.2 * st + 0.05 * pr + 0.05 * bm;
      const penFrac = clamp01(scoreToFrac(executionScore, 58, 10) * maxPen);

      // 4) 어디 stage까지 도달?
      let reachedIndex = -1;

      for (let s = 0; s < STAGES.length; s++) {
        const stage = STAGES[s];
        if (Math.random() > this.getSurvivalProb(stats, stage)) break;
        reachedIndex = s;
      }

      const reachedStage = reachedIndex >= 0 ? STAGES[reachedIndex] : null;
      const acquiredCustomers = Math.max(0, samCustomers * penFrac);

      // 5) stage factor (optional, default 1)
      const stageTri = reachedStage ? resolved.stage_revenue_factor?.[reachedStage] : undefined;
      const stageFactor = stageTri ? Math.max(0, sampleTri(stageTri)) : 1;

      // 6) 매출
      const myRevenue = reachedStage ? acquiredCustomers * price * freq * stageFactor : 0;

      // 분모(시장 매출)
      let marketRevenue = 0;
      if (resolved.market_revenue) {
        marketRevenue = Math.max(1e-9, sampleTri(resolved.market_revenue));
      } else {
        marketRevenue = Math.max(1e-9, marketCustomers * price * freq);
      }

      const samRevenue = Math.max(0, samCustomers * price * freq);

      const share = reachedStage ? clamp01(myRevenue / marketRevenue) : 0;

      shares.push(share);
      myRev.push(myRevenue);
      mktRev.push(marketRevenue);
      samRev.push(samRevenue);

      mktCust.push(marketCustomers);
      samCust.push(samCustomers);
      acqCust.push(acquiredCustomers);
    }

    const sharesSorted = [...shares].sort((a, b) => a - b);
    const myRevSorted = [...myRev].sort((a, b) => a - b);
    const mktRevSorted = [...mktRev].sort((a, b) => a - b);
    const samRevSorted = [...samRev].sort((a, b) => a - b);

    const mktCustSorted = [...mktCust].sort((a, b) => a - b);
    const samCustSorted = [...samCust].sort((a, b) => a - b);
    const acqCustSorted = [...acqCust].sort((a, b) => a - b);

    const market_share = {
      share_mean_pct: mean(shares) * 100,
      share_p10_pct: quantile(sharesSorted, 0.1) * 100,
      share_p50_pct: quantile(sharesSorted, 0.5) * 100,
      share_p90_pct: quantile(sharesSorted, 0.9) * 100,

      my_revenue_p10: quantile(myRevSorted, 0.1),
      my_revenue_p50: quantile(myRevSorted, 0.5),
      my_revenue_p90: quantile(myRevSorted, 0.9),

      market_revenue_p10: quantile(mktRevSorted, 0.1),
      market_revenue_p50: quantile(mktRevSorted, 0.5),
      market_revenue_p90: quantile(mktRevSorted, 0.9),

      sam_revenue_p10: quantile(samRevSorted, 0.1),
      sam_revenue_p50: quantile(samRevSorted, 0.5),
      sam_revenue_p90: quantile(samRevSorted, 0.9),

      market_customers_p50: quantile(mktCustSorted, 0.5),
      sam_customers_p50: quantile(samCustSorted, 0.5),
      acquired_customers_p50: quantile(acqCustSorted, 0.5),
    };

    // ✅ “면적그래프/파이 체크”에 바로 쓰기 좋은 레이어(매출/고객)
    const market_layers = {
      revenue: {
        total_market_p50: market_share.market_revenue_p50,
        addressable_sam_p50: market_share.sam_revenue_p50,
        your_revenue_p50: market_share.my_revenue_p50,
      },
      customers: {
        total_market_p50: market_share.market_customers_p50,
        addressable_sam_p50: market_share.sam_customers_p50,
        your_customers_p50: market_share.acquired_customers_p50,
      },
    };

    return {
      ...base,

      market_needed: false,
      market_required_fields: [],
      market_assumptions: resolved,

      market_share,
      market_layers,
    };
  }
}
