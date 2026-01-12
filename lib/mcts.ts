// lib/mcts.ts

export type Stats = {
  product: number;
  founder: number; // team -> founder
  strategy: number;
  marketing: number;
  consumer_needs: number;

  // ✅ 설문 추가 항목을 반영하기 위한 스탯(0~100)
  concept_fit: number;        // 컨셉 명확도/차별성/포지셔닝 적합
  monetization: number;       // BM(돈 버는 법) + 가격/마진/단위경제성 가능성
  distribution: number;       // 판매채널 적합/운영 난이도/획득 난이도
  market_scope: number;       // 판매국가/카테고리의 규제/경쟁/확장성
  potential_customers: number; // 잠재고객 규모/도달가능성(“지갑 있는 사람”)
};

export const STAGES = ["Seed", "MVP", "PMF", "Scale-up", "Unicorn"] as const;
export type Stage = (typeof STAGES)[number];

type WeightMap = Partial<Record<keyof Stats, number>>;

function clamp0to100(v: any, fallback = 50): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function audienceBand(score: number) {
  if (score >= 80) return "Mass";
  if (score >= 60) return "Broad";
  if (score >= 45) return "Mid";
  if (score >= 30) return "Niche";
  return "Tiny";
}

export class StartupMCTS {
  private iterations: number;
  private stageWeights: Record<Stage, WeightMap>;
  private stageDifficulty: Record<Stage, number>;

  constructor(iterations: number = 1000) {
    this.iterations = iterations;

    /**
     * ✅ Stage별 중요도(합 1.0 권장)
     * - Seed/MVP: founder, concept_fit, monetization, consumer_needs 중심
     * - PMF: consumer_needs, product, distribution, marketing 중심
     * - Scale/Unicorn: strategy, marketing, market_scope, distribution 중심
     * - potential_customers는 전구간에 “바닥”으로 반영 (시장 자체가 너무 작으면 답 없음)
     */
    this.stageWeights = {
      Seed: {
        founder: 0.20,
        concept_fit: 0.16,
        monetization: 0.16,
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
        monetization: 0.14,
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
        monetization: 0.14,
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
        monetization: 0.10,
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
        monetization: 0.08,
        product: 0.04,
        concept_fit: 0.02,
        consumer_needs: 0.02,
        founder: 0.00,
      },
    };

    this.stageDifficulty = {
      Seed: 0.70,
      MVP: 0.60,
      PMF: 0.50,
      "Scale-up": 0.42,
      Unicorn: 0.34,
    };
  }

  private getSurvivalProb(stats: Partial<Stats>, stage: Stage): number {
    const weights = this.stageWeights[stage];

    let score = 0;
    let weightSum = 0;

    for (const key of Object.keys(weights) as (keyof Stats)[]) {
      const w = weights[key] ?? 0;
      if (w <= 0) continue;

      // ✅ route/front가 아직 새 스탯을 안 보내도 기본 50으로 보정해서 안 깨지게
      const s = clamp0to100((stats as any)?.[key], 50);

      score += s * w;
      weightSum += w;
    }

    const normalized = weightSum > 0 ? score / weightSum : 0; // 0~100
    const base = normalized / 100.0; // 0~1
    const p = base * this.stageDifficulty[stage];

    return Math.max(0.0, Math.min(1.0, p));
  }

  public run(stats: Partial<Stats>) {
    const deathCounts: Record<Stage, number> = {
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
        if (Math.random() > this.getSurvivalProb(stats, stage)) {
          diedAt = stage;
          break;
        }
      }

      if (diedAt) deathCounts[diedAt]++;
      else survivors++;
    }

    const bottleneckStage = (Object.keys(deathCounts) as Stage[]).reduce((a, b) =>
      deathCounts[a] > deathCounts[b] ? a : b
    );

    const audienceScore = clamp0to100((stats as any)?.potential_customers, 50);
    const band = audienceBand(audienceScore);

    const survivalRate = (survivors / this.iterations) * 100;

    // ✅ 프론트 호환: snake_case + camelCase 둘 다 제공
    return {
      survival_rate: survivalRate,
      death_counts: deathCounts,
      bottleneck_stage: bottleneckStage,

      // 잠재고객(지수)도 결과로 같이 반환
      potential_customers_score: audienceScore,
      potential_customers_band: band,

      // (옵션) 기존 키도 같이
      survivalRate,
      deathCounts,
      bottleneck: bottleneckStage,
      potentialCustomersScore: audienceScore,
      potentialCustomersBand: band,
    };
  }
}
