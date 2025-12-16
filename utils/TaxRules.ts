
import { Investment } from '../types';

export interface TaxOpportunity {
    investmentId: number;
    name: string;
    ticker: string;
    unrealizedLoss: number;
    potentialTaxSaving: number;
    lossPercentage: number;
}

const TAX_RATE = 0.125; // 12.5% LTCG (India 2024 New Regime)

export const findHarvestingOpportunities = (investments: Investment[]): TaxOpportunity[] => {
    const opportunities: TaxOpportunity[] = [];

    investments.forEach(inv => {
        // Only consider currently held assets (quantity > 0 implies active, though schema varies)
        if (inv.currentValue < inv.investedAmount) {
            const loss = inv.investedAmount - inv.currentValue;
            if (loss > 100) { // Ignore micro-losses < ₹100
                opportunities.push({
                    investmentId: inv.id!,
                    name: inv.name,
                    ticker: inv.ticker || inv.name,
                    unrealizedLoss: loss,
                    potentialTaxSaving: loss * TAX_RATE, // Alpha generated
                    lossPercentage: (loss / inv.investedAmount) * 100
                });
            }
        }
    });

    // Sort by Highest Tax Saving Potential
    return opportunities.sort((a, b) => b.potentialTaxSaving - a.potentialTaxSaving);
};
