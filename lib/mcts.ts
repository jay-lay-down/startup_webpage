// lib/mcts.ts
export type Stats = {
  product: number;
  team: number;
  strategy: number;
  marketing: number;
  consumer_needs: number;
};

const STAGES = ["Seed", "MVP", "PMF", "Scale-up", "Unicorn"];

export class StartupMCTS {
  private iterations: number;
  private stageWeights: Record<string, Stats>;
  private stageDifficulty: Record<string, number>;

  constructor(iterations: number = 1000) {
    this.iterations = iterations;
    this.stageWeights = {
      Seed: { product: 0.1, team: 0.35, strategy: 0.1, marketing: 0.1, consumer_needs: 0.35 },
      MVP: { product: 0.2, team: 0.25, strategy: 0.1, marketing: 0.1, consumer_needs: 0.35 },
      PMF: { product: 0.2, team: 0.1, strategy: 0.2, marketing: 0.2, consumer_needs: 0.3 },
      "Scale-up": { product: 0.2, team: 0.2, strategy: 0.3, marketing: 0.25, consumer_needs: 0.05 },
      Unicorn: { product: 0.2, team: 0.1, strategy: 0.3, marketing: 0.35, consumer_needs: 0.05 },
    };
    this.stageDifficulty = { Seed: 0.7, MVP: 0.6, PMF: 0.5, "Scale-up": 0.4, Unicorn: 0.3 };
  }

  private getSurvivalProb(stats: Stats, stage: string): number {
    const weights = this.stageWeights[stage];
    let score = 0;
    let weightSum = 0;
    
    for (const key of Object.keys(weights) as (keyof Stats)[]) {
      score += (stats[key] || 0) * weights[key];
      weightSum += weights[key]; // 실제 가중치 합
    }
    
    // 100으로 나누어 0~1 사이로 정규화 후 난이도 반영
    const base = score / 100.0;
    return Math.max(0.0, Math.min(1.0, base * this.stageDifficulty[stage]));
  }

  public run(stats: Stats) {
    const deathCounts: Record<string, number> = { Seed: 0, MVP: 0, PMF: 0, "Scale-up": 0, Unicorn: 0 };
    let survivors = 0;

    for (let i = 0; i < this.iterations; i++) {
      let diedAt: string | null = null;
      for (const stage of STAGES) {
        // 생존 확률보다 랜덤값이 크면 사망 (랜덤 > 확률) -> 즉 확률이 높을수록 생존
        // 기존 코드 로직: random > prob -> return stage (사망)
        if (Math.random() > this.getSurvivalProb(stats, stage)) {
          diedAt = stage;
          break;
        }
      }

      if (diedAt) {
        deathCounts[diedAt]++;
      } else {
        survivors++;
      }
    }

    // 가장 많이 죽은 구간 찾기
    const bottleneck = Object.keys(deathCounts).reduce((a, b) => 
      deathCounts[a] > deathCounts[b] ? a : b
    );

    return {
      survivalRate: (survivors / this.iterations) * 100,
      deathCounts,
      bottleneck,
    };
  }
}