/**
 * FXFORGE LAB - QUANTITATIVE AI & DEEP RL ENGINE
 * Mathematical Simulation, State Vector Builder, and Reward Shaping Engine
 */

export interface StateVector {
  ret5: number;      // Ret5 = ((P_t - P_{t-5}) / P_{t-5}) * 100
  ret10: number;     // Ret10 = ((P_t - P_{t-10}) / P_{t-10}) * 100
  ret20: number;     // Ret20 = ((P_t - P_{t-20}) / P_{t-20}) * 100
  volat10: number;   // Volat10 = (Std(P_{t-10:t}) / P_t) * 100
  distSma20: number; // DistSMA20 = ((P_t - SMA20_t) / P_t) * 100
  pos: number;       // Pos in {-1.0 (SHORT), 0.0 (FLAT), 1.0 (LONG)}
}

export type ActionType = 0 | 1 | 2; // 0: BUY/LONG, 1: HOLD/FLAT, 2: SELL/SHORT

export interface RLEnvironmentStep {
  state: StateVector;
  action: ActionType;
  actionProbs: [number, number, number]; // [P(BUY), P(HOLD), P(SELL)]
  reward: number;
  rMarket: number;
  rSpread: number;
  rInactivity: number;
  rOppCost: number;
  currentPrice: number;
  equity: number;
  drawdown: number;
  cumulativeReturn: number;
}

export interface QuantTelemetry {
  episodes: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  annualizedSharpe: number;
  annualizedSortino: number;
  maxDrawdown: number;
  currentEquity: number;
  initialCapital: number;
  totalReward: number;
}

export class FXForgeEngine {
  private initialCapital: number = 100000;
  private currentEquity: number = 100000;
  private peakEquity: number = 100000;
  private currentPosition: number = 0; // -1, 0, 1
  private priceHistory: number[] = [];
  private tradeReturns: number[] = [];
  private downsideReturns: number[] = [];
  private winningTrades: number = 0;
  private totalTrades: number = 0;
  private currentEpisode: number = 0;
  private totalReward: number = 0;
  private initialPrice: number = 65420.0;
  private history: { episode: string; cumulativeReward: number; rewardMa10: number; marketReturn: number }[] = [];

  // Base price generator parameters (GBM + Jump Diffusion)
  private currentPrice: number = 65420.0;
  private drift: number = 0.0002;
  private volatility: number = 0.0018;

  constructor() {
    this.reset();
  }

  public reset(): void {
    this.currentEquity = this.initialCapital;
    this.peakEquity = this.initialCapital;
    this.currentPosition = 0;
    this.priceHistory = [];
    this.tradeReturns = [];
    this.downsideReturns = [];
    this.winningTrades = 0;
    this.totalTrades = 0;
    this.currentEpisode = 0;
    this.totalReward = 0;
    this.currentPrice = 65420.0;
    this.initialPrice = 65420.0;
    this.history = [
      {
        episode: 'Ep 0',
        cumulativeReward: 0,
        rewardMa10: 0,
        marketReturn: 0,
      },
    ];

    // Seed 30 initial warm-up prices
    for (let i = 0; i < 30; i++) {
      this.generateNextPrice();
    }
  }

  private generateNextPrice(): number {
    const z = (Math.random() + Math.random() + Math.random() + Math.random() - 2) * 1.732;
    const jump = Math.random() < 0.05 ? (Math.random() - 0.5) * 0.015 : 0;
    const returnStep = this.drift + this.volatility * z + jump;
    this.currentPrice = this.currentPrice * (1 + returnStep);
    this.priceHistory.push(this.currentPrice);
    if (this.priceHistory.length > 200) {
      this.priceHistory.shift();
    }
    return this.currentPrice;
  }

  public getStateVector(): StateVector {
    const N = this.priceHistory.length;
    const pCurrent = this.priceHistory[N - 1];
    const p5 = this.priceHistory[Math.max(0, N - 6)];
    const p10 = this.priceHistory[Math.max(0, N - 11)];
    const p20 = this.priceHistory[Math.max(0, N - 21)];

    // 1. Returns
    const ret5 = ((pCurrent - p5) / p5) * 100;
    const ret10 = ((pCurrent - p10) / p10) * 100;
    const ret20 = ((pCurrent - p20) / p20) * 100;

    // 2. Rolling Volat10
    const slice10 = this.priceHistory.slice(-10);
    const mean10 = slice10.reduce((a, b) => a + b, 0) / slice10.length;
    const variance10 = slice10.reduce((sum, p) => sum + Math.pow(p - mean10, 2), 0) / slice10.length;
    const volat10 = (Math.sqrt(variance10) / pCurrent) * 100;

    // 3. Distance from SMA20
    const slice20 = this.priceHistory.slice(-20);
    const sma20 = slice20.reduce((a, b) => a + b, 0) / slice20.length;
    const distSma20 = ((pCurrent - sma20) / pCurrent) * 100;

    return {
      ret5,
      ret10,
      ret20,
      volat10,
      distSma20,
      pos: this.currentPosition,
    };
  }

  public step(policyBias?: { buyProb?: number; holdProb?: number; sellProb?: number }): RLEnvironmentStep {
    this.currentEpisode++;
    const prevPrice = this.currentPrice;
    const nextPrice = this.generateNextPrice();
    const priceDeltaRatio = (nextPrice - prevPrice) / prevPrice;

    const state = this.getStateVector();

    // 1. Compute Policy Softmax Probabilities (Actor Output)
    // Neural Network: Linear(6, 64) -> LeakyReLU -> Linear(64, 32) -> Linear(32, 3) -> Softmax
    let logitBuy = 0.4 * state.ret5 - 0.3 * state.distSma20 + (policyBias?.buyProb || 0);
    let logitHold = 0.2 - 0.5 * Math.abs(state.ret5) + (policyBias?.holdProb || 0);
    let logitSell = -0.4 * state.ret5 + 0.3 * state.distSma20 + (policyBias?.sellProb || 0);

    const maxLogit = Math.max(logitBuy, logitHold, logitSell);
    const expBuy = Math.exp(logitBuy - maxLogit);
    const expHold = Math.exp(logitHold - maxLogit);
    const expSell = Math.exp(logitSell - maxLogit);
    const sumExp = expBuy + expHold + expSell;

    const pBuy = expBuy / sumExp;
    const pHold = expHold / sumExp;
    const pSell = expSell / sumExp;
    const actionProbs: [number, number, number] = [pBuy, pHold, pSell];

    // Select Action by ArgMax (Inference Mode)
    let action: ActionType = 1;
    if (pBuy > pHold && pBuy > pSell) action = 0; // BUY
    else if (pSell > pHold && pSell > pBuy) action = 2; // SELL
    else action = 1; // HOLD

    // Target Position Translation
    let targetPos = 0;
    if (action === 0) targetPos = 1;      // LONG
    else if (action === 2) targetPos = -1; // SHORT
    else targetPos = 0;                   // FLAT

    const isPositionFlip = targetPos !== this.currentPosition && targetPos !== 0;

    // 2. Stage 3: Reward Formulation R_t = R_market - R_spread - R_inactivity - R_opp_cost
    // A. Market Return Reward
    let rMarket = 0;
    if (targetPos === 1) {
      rMarket = 10.0 * priceDeltaRatio;
    } else if (targetPos === -1) {
      rMarket = -10.0 * priceDeltaRatio;
    } else {
      rMarket = 0;
    }

    // B. Spread Friction Penalty
    const spreadPips = 0.00015; // 0.15 pips spread
    const rSpread = isPositionFlip ? spreadPips * 10.0 * 100 : 0;

    // C. Anti-Inactivity Penalty
    const lambdaIdle = 0.0005 * 10.0;
    const rInactivity = targetPos === 0 ? lambdaIdle : 0;

    // D. Opportunity Cost Penalty (if remaining FLAT during strong market move > 0.15%)
    let rOppCost = 0;
    if (targetPos === 0 && Math.abs(priceDeltaRatio) > 0.0015) {
      rOppCost = 0.5 * Math.abs(priceDeltaRatio) * 10.0;
    }

    const totalRewardStep = rMarket - rSpread - rInactivity - rOppCost;
    this.totalReward += totalRewardStep;

    // 3. Update P&L and Portfolio Accounting
    if (targetPos !== 0) {
      const positionPnl = targetPos * priceDeltaRatio * this.currentEquity * 1.5;
      const tradeReturn = targetPos * priceDeltaRatio;
      this.currentEquity += positionPnl;
      this.tradeReturns.push(tradeReturn);
      if (tradeReturn < 0) {
        this.downsideReturns.push(tradeReturn);
      }
      this.totalTrades++;
      if (tradeReturn > 0) {
        this.winningTrades++;
      }
    }

    if (this.currentEquity > this.peakEquity) {
      this.peakEquity = this.currentEquity;
    }

    const drawdown = ((this.peakEquity - this.currentEquity) / this.peakEquity) * 100;
    const cumulativeReturn = ((this.currentEquity - this.initialCapital) / this.initialCapital) * 100;

    this.currentPosition = targetPos;

    // Record dynamic reward trajectory point
    const mktReturn = ((nextPrice - this.initialPrice) / this.initialPrice) * 100;
    const recentRewards = this.history.slice(-9).map((h) => h.cumulativeReward);
    recentRewards.push(Number(this.totalReward.toFixed(2)));
    const ma10 = recentRewards.reduce((a, b) => a + b, 0) / recentRewards.length;

    this.history.push({
      episode: `Ep ${this.currentEpisode}`,
      cumulativeReward: Number(this.totalReward.toFixed(2)),
      rewardMa10: Number(ma10.toFixed(2)),
      marketReturn: Number(mktReturn.toFixed(2)),
    });

    if (this.history.length > 80) {
      this.history.shift();
    }

    return {
      state,
      action,
      actionProbs,
      reward: totalRewardStep,
      rMarket,
      rSpread,
      rInactivity,
      rOppCost,
      currentPrice: nextPrice,
      equity: this.currentEquity,
      drawdown,
      cumulativeReturn,
    };
  }

  public getRewardHistory() {
    return [...this.history];
  }

  public getTelemetry(): QuantTelemetry {
    const winRate = this.totalTrades > 0 ? (this.winningTrades / this.totalTrades) * 100 : 0.0;

    // Annualized Sharpe: (E[r] / (std(r) + eps)) * sqrt(252)
    let annualizedSharpe = 0.0;
    if (this.tradeReturns.length > 2) {
      const meanR = this.tradeReturns.reduce((a, b) => a + b, 0) / this.tradeReturns.length;
      const varR = this.tradeReturns.reduce((sum, r) => sum + Math.pow(r - meanR, 2), 0) / this.tradeReturns.length;
      const stdR = Math.sqrt(varR);
      annualizedSharpe = (meanR / (stdR + 1e-6)) * Math.sqrt(252);
    }

    // Annualized Sortino: (E[r] / (std_downside(r) + eps)) * sqrt(252)
    let annualizedSortino = 0.0;
    if (this.tradeReturns.length > 2) {
      const meanR = this.tradeReturns.reduce((a, b) => a + b, 0) / this.tradeReturns.length;
      const varDown = this.downsideReturns.length > 0 
        ? this.downsideReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / this.tradeReturns.length
        : 1e-6;
      const stdDown = Math.sqrt(varDown);
      annualizedSortino = (meanR / (stdDown + 1e-6)) * Math.sqrt(252);
    }

    const maxDrawdown = ((this.peakEquity - this.currentEquity) / this.peakEquity) * 100;

    return {
      episodes: this.currentEpisode,
      totalTrades: this.totalTrades,
      winningTrades: this.winningTrades,
      losingTrades: this.totalTrades - this.winningTrades,
      winRate: Number(winRate.toFixed(1)),
      annualizedSharpe: Number(annualizedSharpe.toFixed(2)),
      annualizedSortino: Number(annualizedSortino.toFixed(2)),
      maxDrawdown: Number(maxDrawdown.toFixed(1)),
      currentEquity: Number(this.currentEquity.toFixed(2)),
      initialCapital: this.initialCapital,
      totalReward: Number(this.totalReward.toFixed(4)),
    };
  }
}

// Global Singleton Engine Instance
export const fxforgeEngine = new FXForgeEngine();
