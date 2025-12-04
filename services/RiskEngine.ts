import { Investment, InvestmentType } from '../types';

export interface RiskProfile {
  bullionCap: number;       // Max % allocation for Gold/Silver
  profitThreshold: number;  // % Gain to trigger "Book Profit" alert
  silverBubbleLimit: number;// % Gain to trigger "Bubble" warning
}

const DEFAULT_PROFILE: RiskProfile = {
  bullionCap: 40,
  profitThreshold: 20,
  silverBubbleLimit: 90
};

export class RiskEngine {
  private rules: RiskProfile;

  constructor(customRules?: Partial<RiskProfile>) {
    this.rules = { ...DEFAULT_PROFILE, ...customRules };
  }

  /**
   * Adjusts risk parameters based on Market Volatility (VIX).
   * @param vix Current Volatility Index
   */
  public adaptToMarket(vix: number) {
    if (vix > 30) {
      // HIGH VOLATILITY PROTOCOL
      // 1. Allow higher allocation to safe havens (Gold/Silver)
      this.rules.bullionCap = 50; 
      // 2. Tighten profit booking to secure cash faster
      this.rules.profitThreshold = 15; 
    } else {
      // NORMAL MARKET PROTOCOL
      this.rules = { ...DEFAULT_PROFILE };
    }
  }

  /**
   * Analyzes the entire portfolio for allocation risks.
   */
  public analyzePortfolio(investments: Investment[], totalNetWorth: number) {
    const bullionValue = investments
      .filter(i => 
        i.type === InvestmentType.DIGITAL_GOLD || 
        i.type === InvestmentType.DIGITAL_SILVER
      )
      .reduce((acc, curr) => acc + curr.currentValue, 0);
    
    const exposure = totalNetWorth > 0 ? (bullionValue / totalNetWorth) * 100 : 0;
    
    return {
      isBullionOverweight: exposure > this.rules.bullionCap,
      bullionExposure: exposure,
      limit: this.rules.bullionCap
    };
  }

  /**
   * Analyzes a single asset for specific risk signals (Greed/Bubble).
   */
  public analyzeAsset(inv: Investment) {
    const profit = inv.currentValue - inv.investedAmount;
    const roi = inv.investedAmount > 0 ? (profit / inv.investedAmount) * 100 : 0;

    // 1. The "Greed Killer"
    // Suggest booking profit if ROI exceeds threshold (for volatile assets)
    const shouldBookProfit = (
      (inv.type === InvestmentType.STOCKS || inv.type === InvestmentType.CRYPTO) && 
      roi >= this.rules.profitThreshold
    );

    // 2. The "Silver Trap" / Bubble Risk
    const isBubbleRisk = (
      inv.type === InvestmentType.DIGITAL_SILVER && 
      roi > this.rules.silverBubbleLimit
    );

    return { shouldBookProfit, isBubbleRisk, roi };
  }
}