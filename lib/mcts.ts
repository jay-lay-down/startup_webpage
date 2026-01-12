// lib/mcts.ts

export type Stats = {
  product: number;
  founder: number; // ✅ team -> founder
  strategy: number;
  marketing: number;
  consumer_needs: number;
};

export const STAGES = ["Seed", "MVP", "PMF", "Scale-up", "Unicorn"] as const;
export type Stage = (typeof STAGES)[number];

export class StartupMCTS {
  private iterations: number;
  private stageWeights: Record<Stage, Stats>;
  private stageDifficulty: Record<Stage, number>;

  constructor(iterations: number = 1000) {
    this.iterations = iterations;

    // ✅ team 가중치 -> founder 가중치로 치환 (숫자는 기존과 동일하게 유지)
    this.stageWeights = {
      Seed:      { product: 0.1, founder: 0.35, strategy: 0.1, marketing: 0.1, consumer_needs: 0.35 },
      MVP:       { product: 0.2, founder: 0.25, strategy: 0.1, marketing: 0.1, consumer_needs: 0.35 },
      PMF:       { product: 0.2, founder: 0.1,  strategy: 0.2, marketing: 0.2, consumer_needs: 0.3  },
      "Scale-up":{ product: 0.2, founder: 0.2,  strategy: 0.3, marketing: 0.25, consumer_needs: 0.05 },
      Unicorn:   { product: 0.2, founder: 0.1,  strategy: 0.3, marketing: 0.35, consumer_needs: 0.05 },
    };

    this.stageDifficulty = {
      Seed: 0.7,
      MVP: 0.6,
      PMF: 0.5,
      "Scale-up": 0.4,
      Unicorn: 0.3,
    };
  }

  private getSurvivalProb(stats: Stats, stage: Stage): number {
    const weights = this.stageWeights[stage];

    let score = 0;
    let weightSum = 0;

    for (const key of Object.keys(weights) as (keyof Stats)[]) {
      const w = weights[key] ?? 0;
      score += (stats[key] ?? 0) * w;
      weightSum += w;
    }

    // weightSum은 지금 항상 1.0이지만, 혹시 바뀌어도 안전하게
    const normalized = weightSum > 0 ? score / weightSum : 0;

    // 0~100 -> 0~1 스케일 + stage 난이도 반영
    const base = normalized / 100.0;
    return Math.max(0.0, Math.min(1.0, base * this.stageDifficulty[stage]));
  }

  public run(stats: Stats) {
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
        // random > survivalProb 이면 사망
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

    // ✅ 프론트에서 쓰던 형태로 키를 맞춰줌
    return {
      survival_rate: (survivors / this.iterations) * 100,
      death_counts: deathCounts,
      bottleneck_stage: bottleneckStage,
      // (옵션) 기존 키도 같이 주면 호환성↑
      survivalRate: (survivors / this.iterations) * 100,
      deathCounts,
      bottleneck: bottleneckStage,
    };
  }
}
