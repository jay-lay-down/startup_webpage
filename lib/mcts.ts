// lib/mcts.ts

export type Stats = {
  product: number;
  founder: number; // ✅ 정식 키: founder
  strategy: number;
  marketing: number;
  consumer_needs: number;

  concept_fit: number;
  monetization: number;
  distribution: number;
  market_scope: number;
  potential_customers: number;
};

export const STAGES = ["Seed", "MVP", "PMF", "Scale-up", "Unicorn"] as const;
export type Stage = (typeof STAGES)[number];

type WeightMap = Partial<Record<keyof Stats, number>>;

// ✅ 이전 버전 호환: route/front가 team으로 보내도 founder로 취급
type StatsInput = Partial<Stats> & { team?: number };

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

// ✅ founder는 founder 우선, 없으면 team을 alias로 사용
function getStat(stats: StatsInput, key: keyof Stats): number {
  if (key === "founder") {
    const v = (stats as any).founder ?? (stats as any).team;
    return clamp0to100(v, 50);
  }
  return clamp0to100((stats as any)?.[key], 50);
}

export class StartupMCTS {
  private iterations: number;
  private stageWeights: Record<Stage, WeightMap>;
  private stageDifficulty: Record<Stage, number>;

  constructor(iterations: number = 1000) {
    this.iterations = iterations;

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
    const base = normalized / 100.0; // 0~1
    const p = base * this.stageDifficulty[stage];

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

    return {
      survival_rate: survivalRate,
      death_counts: deathCounts,
      bottleneck_stage: bottleneckStage,

      potential_customers_score: audienceScore,
      potential_customers_band: band,

      // legacy
      survivalRate,
      deathCounts,
      bottleneck: bottleneckStage,
      potentialCustomersScore: audienceScore,
      potentialCustomersBand: band,
    };
  }
}
