import React, { useMemo } from 'react';
import { AlertTriangle, PieChart, TrendingUp, Shield, ChevronRight } from 'lucide-react';
import { Investment } from '../../types';
import { formatCurrency } from '../../utils/helpers';

interface ConcentrationAlertsProps {
    investments: Investment[];
    threshold?: number; // Default 20%
}

interface ConcentrationRisk {
    investment: Investment;
    percentage: number;
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
}

export const ConcentrationAlerts: React.FC<ConcentrationAlertsProps> = ({
    investments,
    threshold = 20
}) => {
    const totalValue = useMemo(() =>
        investments.reduce((acc, inv) => acc + (inv.currentValue || 0), 0),
        [investments]);

    const concentrationRisks = useMemo<ConcentrationRisk[]>(() => {
        if (totalValue <= 0) return [];

        return investments
            .map(inv => {
                const percentage = ((inv.currentValue || 0) / totalValue) * 100;
                let severity: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';

                if (percentage >= threshold * 1.5) severity = 'HIGH';
                else if (percentage >= threshold) severity = 'MEDIUM';
                else if (percentage >= threshold * 0.8) severity = 'LOW';
                else return null;

                return { investment: inv, percentage, severity };
            })
            .filter((r): r is ConcentrationRisk => r !== null && r.percentage >= threshold * 0.8)
            .sort((a, b) => b.percentage - a.percentage);
    }, [investments, totalValue, threshold]);

    const getSeverityStyles = (severity: 'HIGH' | 'MEDIUM' | 'LOW') => {
        switch (severity) {
            case 'HIGH':
                return {
                    bg: 'bg-rose-500/20',
                    border: 'border-rose-500/50',
                    text: 'text-rose-500',
                    label: 'CRITICAL'
                };
            case 'MEDIUM':
                return {
                    bg: 'bg-amber-500/20',
                    border: 'border-amber-500/50',
                    text: 'text-amber-500',
                    label: 'WARNING'
                };
            case 'LOW':
                return {
                    bg: 'bg-blue-500/20',
                    border: 'border-blue-500/50',
                    text: 'text-blue-500',
                    label: 'WATCH'
                };
        }
    };

    if (concentrationRisks.length === 0) {
        return (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 rounded-full">
                    <Shield className="text-emerald-500" size={20} />
                </div>
                <div>
                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        Portfolio Well Diversified
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        No single holding exceeds {threshold}% of your portfolio
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <AlertTriangle className="text-amber-500" size={18} />
                    <h4 className="text-sm font-bold text-slate-700 dark:text-white">
                        Concentration Risk ({concentrationRisks.length})
                    </h4>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Threshold: {threshold}%
                </span>
            </div>

            {/* Risk Cards */}
            <div className="space-y-2">
                {concentrationRisks.map((risk, idx) => {
                    const styles = getSeverityStyles(risk.severity);
                    return (
                        <div
                            key={risk.investment.id || idx}
                            className={`p-3 rounded-xl border ${styles.bg} ${styles.border} transition-all hover:scale-[1.01]`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {/* Percentage Badge */}
                                    <div className={`w-12 h-12 rounded-xl ${styles.bg} flex items-center justify-center`}>
                                        <span className={`text-lg font-black ${styles.text}`}>
                                            {risk.percentage.toFixed(0)}%
                                        </span>
                                    </div>

                                    {/* Details */}
                                    <div>
                                        <p className="text-sm font-bold text-slate-800 dark:text-white line-clamp-1">
                                            {risk.investment.name}
                                        </p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                                {formatCurrency(risk.investment.currentValue || 0)}
                                            </span>
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${styles.bg} ${styles.text}`}>
                                                {styles.label}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Action */}
                                <div className="flex items-center gap-1 text-slate-400 hover:text-indigo-500 cursor-pointer">
                                    <span className="text-[10px] font-bold uppercase">Rebalance</span>
                                    <ChevronRight size={14} />
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="mt-3 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div
                                    className={`h-full ${risk.severity === 'HIGH' ? 'bg-rose-500' : risk.severity === 'MEDIUM' ? 'bg-amber-500' : 'bg-blue-500'} transition-all duration-500`}
                                    style={{ width: `${Math.min(risk.percentage, 100)}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Recommendation */}
            <div className="p-3 bg-slate-100 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-600 dark:text-slate-400">
                    <span className="font-bold text-indigo-500">💡 Tip:</span> Consider trimming positions above {threshold}% to reduce single-stock risk.
                    Diversification reduces volatility and protects against unexpected events.
                </p>
            </div>
        </div>
    );
};

export default ConcentrationAlerts;
