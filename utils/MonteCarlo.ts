
/**
 * Monte Carlo Simulation Engine for Wealth Projection
 */

export interface SimulationResult {
    percentiles: {
        p10: number; // Pessimistic
        p50: number; // Median
        p90: number; // Optimistic
    };
    successProbability: number; // % of runs meeting the target
    simulations: number[][]; // (Optional) Can return full paths if we want to chart lines
}

// Box-Muller transform for standard normal distribution
function randn_bm() {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

export const runMonteCarlo = (
    currentPrincipal: number,
    monthlyContribution: number,
    years: number,
    targetWealth: number,
    expectedMeanReturn: number = 0.12, // 12% Nifty Avg
    volatility: number = 0.15 // 15% Standard Deviation
): SimulationResult => {
    const ITERATIONS = 1000;
    const finalWealths: number[] = [];
    const monthlyReturnMean = expectedMeanReturn / 12;
    const monthlyVolatility = volatility / Math.sqrt(12);
    const months = years * 12;

    let successes = 0;

    for (let i = 0; i < ITERATIONS; i++) {
        let wealth = currentPrincipal;
        // Optimization: We could simulate month-by-month, or approximate annual.
        // Month-by-month gives accurate SIP sequence risk.
        for (let m = 0; m < months; m++) {
            const shock = randn_bm();
            const periodReturn = monthlyReturnMean + (monthlyVolatility * shock);
            wealth = wealth * (1 + periodReturn) + monthlyContribution;
        }

        finalWealths.push(wealth);
        if (wealth >= targetWealth) successes++;
    }

    finalWealths.sort((a, b) => a - b);

    return {
        percentiles: {
            p10: finalWealths[Math.floor(ITERATIONS * 0.1)],
            p50: finalWealths[Math.floor(ITERATIONS * 0.5)],
            p90: finalWealths[Math.floor(ITERATIONS * 0.9)],
        },
        successProbability: (successes / ITERATIONS) * 100,
        simulations: [] // Not returning full paths yet to save memory
    };
};
