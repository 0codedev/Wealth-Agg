import React from 'react';
import { formatCurrency } from '../../utils/helpers';
import { IPOApplication } from '../../database';

interface ArchivedListProps {
    listedApps: IPOApplication[];
    realizedGains: number;
}

export const ArchivedList = React.memo(({ listedApps, realizedGains }: ArchivedListProps) => {
    if (listedApps.length === 0) return null;

    return (
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-slate-500 uppercase">Recent Listings (Archived)</h4>
                </div>
                {realizedGains > 0 && (
                    <span className="text-xs font-mono text-emerald-500 font-bold">
                        Total Realized: {formatCurrency(realizedGains)}
                    </span>
                )}
            </div>
            <div className="space-y-2 opacity-60">
                {listedApps.map(app => (
                    <div key={app.id} className="flex justify-between items-center text-xs text-slate-400">
                        <span>{app.ipoName} ({app.applicantName})</span>
                        <span>{formatCurrency(app.amount)} - <span className="text-emerald-500">Realized</span></span>
                    </div>
                ))}
            </div>
        </div>
    );
});
