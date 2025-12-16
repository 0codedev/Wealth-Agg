/**
 * Monte Carlo Simulation Web Worker
 * Offloads heavy computation from main thread to prevent UI freezes
 */

// Message types
type SimulationType = 'RETIREMENT' | 'GOAL_GPS';

interface RetirementParams {
    currentAge: number;
    retirementAge: number;
    currentCorpus: number;
    monthlyContribution: number;
    monthlyExpenses: number;
    expectedReturn: number;
    inflation: number;
    volatility: number;
    numSimulations?: number;
    forecastYears?: number;
}

interface GoalGPSParams {
    currentWealth: number;
    monthlySip: number;
    years: number;
    inflationRate: number;
    isInflationAdjusted: boolean;
    riskProfile: 'conservative' | 'balanced' | 'aggressive';
    scenario: 'bear' | 'base' | 'bull';
    targetAmount: number;
    numSimulations?: number;
}

// Risk profile parameters
const RISK_PARAMS = {
    conservative: { mean: 0.07, stdDev: 0.10 },
    balanced: { mean: 0.10, stdDev: 0.15 },
    aggressive: { mean: 0.14, stdDev: 0.22 }
};

// Box-Muller transform for generating normal distribution random numbers
function generateGaussian(): number {
    const u1 = Math.random();
    const u2 = Math.random();
    return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
}

// Retirement simulation
function runRetirementSimulation(params: RetirementParams) {
    const {
        currentAge,
        retirementAge,
        currentCorpus,
        monthlyContribution,
        monthlyExpenses,
        expectedReturn,
        inflation,
        volatility,
        numSimulations = 500,
        forecastYears = 40
    } = params;

    const yearsToRetirement = retirementAge - currentAge;
    const expenseAtRetirement = monthlyExpenses * Math.pow(1 + inflation / 100, yearsToRetirement);

    const allPaths: { year: number; corpus: number }[][] = [];
    let successfulPaths = 0;

    for (let sim = 0; sim < numSimulations; sim++) {
        let corpus = currentCorpus;
        const path = [{ year: currentAge, corpus: corpus }];
        let failed = false;

        for (let year = 1; year <= forecastYears; year++) {
            const age = currentAge + year;

            // Market Return with Random Volatility (Box-Muller Transform)
            const z = generateGaussian();
            const marketReturn = (expectedReturn / 100) + (volatility / 100 * z);

            // Apply Return
            corpus = corpus * (1 + marketReturn);

            // Cashflows
            if (age < retirementAge) {
                corpus += (monthlyContribution * 12) * Math.pow(1 + 0.05, year); // 5% income growth
            } else {
                const expense = (expenseAtRetirement * 12) * Math.pow(1 + inflation / 100, age - retirementAge);
                corpus -= expense;
            }

            if (corpus < 0) {
                corpus = 0;
                failed = true;
            }

            path.push({ year: age, corpus: Math.round(corpus) });
        }

        if (!failed) successfulPaths++;
        // Only save first 50 paths for rendering to save memory
        if (sim < 50) allPaths.push(path);

        // Send progress updates every 50 simulations
        if (sim % 50 === 0) {
            self.postMessage({
                type: 'PROGRESS',
                progress: Math.round((sim / numSimulations) * 100)
            });
        }
    }

    return {
        simulations: allPaths,
        successRate: (successfulPaths / numSimulations) * 100
    };
}

// Goal GPS simulation
function runGoalGPSSimulation(params: GoalGPSParams) {
    const {
        currentWealth,
        monthlySip,
        years,
        inflationRate,
        isInflationAdjusted,
        riskProfile,
        scenario,
        targetAmount,
        numSimulations = 1000
    } = params;

    const results: number[][] = [];
    let { mean, stdDev } = RISK_PARAMS[riskProfile];

    // Adjust for scenario
    if (scenario === 'bear') { mean -= 0.04; stdDev += 0.05; }
    if (scenario === 'bull') { mean += 0.04; stdDev -= 0.02; }

    // Run Simulations
    for (let s = 0; s < numSimulations; s++) {
        let wealth = currentWealth;
        const path = [wealth];

        for (let m = 1; m <= years * 12; m++) {
            // Geometric Brownian Motion for Monthly Returns
            // Central limit theorem approximation for Gaussian
            const randomShock = (Math.random() + Math.random() + Math.random() +
                Math.random() + Math.random() + Math.random() - 3) / Math.sqrt(0.5);
            const monthlyReturn = (mean / 12) + (stdDev / Math.sqrt(12)) * randomShock;

            wealth = wealth * (1 + monthlyReturn) + monthlySip;

            if (m % 12 === 0) {
                const realWealth = isInflationAdjusted
                    ? wealth / Math.pow(1 + inflationRate / 100, m / 12)
                    : wealth;
                path.push(realWealth);
            }
        }
        results.push(path);

        // Progress updates
        if (s % 100 === 0) {
            self.postMessage({
                type: 'PROGRESS',
                progress: Math.round((s / numSimulations) * 100)
            });
        }
    }

    // Calculate Percentiles
    const chartData = [];
    const finalValues: number[] = [];

    for (let y = 0; y <= years; y++) {
        const yearValues = results.map(r => r[y]).sort((a, b) => a - b);
        const p10 = yearValues[Math.floor(numSimulations * 0.1)];
        const p50 = yearValues[Math.floor(numSimulations * 0.5)];
        const p90 = yearValues[Math.floor(numSimulations * 0.9)];

        const targetVal = isInflationAdjusted
            ? targetAmount / Math.pow(1 + inflationRate / 100, y)
            : targetAmount;

        chartData.push({ year: new Date().getFullYear() + y, p10, p50, p90, target: targetVal });

        if (y === years) {
            finalValues.push(...yearValues);
        }
    }

    // Success Probability
    const targetVal = isInflationAdjusted
        ? targetAmount / Math.pow(1 + inflationRate / 100, years)
        : targetAmount;
    const successCount = finalValues.filter(v => v >= targetVal).length;
    const successProbability = (successCount / numSimulations) * 100;

    return {
        chartData,
        successProbability,
        p50Final: chartData[chartData.length - 1]?.p50 || 0
    };
}

// Worker message handler
self.onmessage = (e: MessageEvent) => {
    const { type, params } = e.data;

    try {
        let result;

        if (type === 'RETIREMENT') {
            result = runRetirementSimulation(params);
        } else if (type === 'GOAL_GPS') {
            result = runGoalGPSSimulation(params);
        }

        self.postMessage({ type: 'COMPLETE', result });
    } catch (error: any) {
        self.postMessage({ type: 'ERROR', error: error.message });
    }
};

export { }; // Make this a module
