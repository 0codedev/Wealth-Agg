import React from 'react';
import { LayoutList, GripVertical, ChevronDown, ChevronRight } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';
import { StatusBadge } from './StatusBadge';
import { ActionButtons } from './ActionButtons';
import { IPOApplication } from '../../database'; // Adjust import

interface SyndicateTableProps {
    viewMode: 'LIST' | 'GROUPED';
    setViewMode: (mode: 'LIST' | 'GROUPED') => void;
    displayApplications: IPOApplication[];
    groupedApps: Record<string, IPOApplication[]>;
    expandedGroups: string[];
    toggleGroup: (ipoName: string) => void;
    updateStatus: (id: number, status: IPOApplication['status']) => void;
    deleteApp: (id: number) => void;
}

export const SyndicateTable = React.memo(({
    viewMode, setViewMode, displayApplications, groupedApps, expandedGroups, toggleGroup, updateStatus, deleteApp
}: SyndicateTableProps) => {
    return (
        <div className="min-h-[200px]">
            <div className="flex justify-between items-center mb-2 px-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase">Active Applications</h4>
                <button
                    onClick={() => setViewMode(viewMode === 'LIST' ? 'GROUPED' : 'LIST')}
                    className="text-xs font-bold text-indigo-500 hover:text-indigo-600 flex items-center gap-1"
                >
                    {viewMode === 'LIST' ? <LayoutList size={14} /> : <GripVertical size={14} />}
                    {viewMode === 'LIST' ? 'Show Grouped' : 'Show All'}
                </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-100 dark:bg-slate-800/50">
                        <tr>
                            <th className="px-4 py-3">Applicant / IPO</th>
                            <th className="px-4 py-3">UPI</th>
                            <th className="px-4 py-3 text-right">Amount</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {displayApplications.length === 0 && (
                            <tr><td colSpan={5} className="text-center py-6 text-slate-400 text-xs">No active syndicate applications.</td></tr>
                        )}

                        {viewMode === 'LIST' ? (
                            displayApplications.map(app => (
                                <tr key={app.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-slate-800 dark:text-white">{app.applicantName}</div>
                                        <div className="text-xs text-slate-500">{app.ipoName}</div>
                                    </td>
                                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{app.upiHandle}</td>
                                    <td className="px-4 py-3 font-mono text-xs text-slate-900 dark:text-white font-bold text-right">{formatCurrency(app.amount)}</td>
                                    <td className="px-4 py-3">
                                        <StatusBadge status={app.status} />
                                    </td>
                                    <td className="px-4 py-3 text-right flex items-center justify-end gap-2">
                                        <ActionButtons app={app} updateStatus={updateStatus} deleteApp={deleteApp} />
                                    </td>
                                </tr>
                            ))
                        ) : (
                            Object.entries(groupedApps).map(([ipoName, apps]) => {
                                const isExpanded = expandedGroups.includes(ipoName);
                                const totalAmount = apps.reduce((sum, a) => sum + a.amount, 0);
                                const allottedCount = apps.filter(a => a.status === 'ALLOTTED' || a.status === 'LISTED').length;

                                return (
                                    <React.Fragment key={ipoName}>
                                        {/* Parent Row */}
                                        <tr
                                            onClick={() => toggleGroup(ipoName)}
                                            className="bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                                        >
                                            <td className="px-4 py-3 font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                                {isExpanded ? <ChevronDown size={14} className="text-indigo-500" /> : <ChevronRight size={14} className="text-slate-400" />}
                                                {ipoName}
                                                <span className="text-xs font-normal text-slate-500 ml-1">({apps.length} Apps)</span>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-slate-500">
                                                {allottedCount > 0 ? <span className="text-emerald-500 font-bold">{allottedCount} Allotted</span> : 'Pending'}
                                            </td>
                                            <td className="px-4 py-3 font-mono text-xs font-black text-right">{formatCurrency(totalAmount)}</td>
                                            <td className="px-4 py-3"></td>
                                            <td className="px-4 py-3 text-right text-xs font-bold text-indigo-500">
                                                {isExpanded ? 'Hide' : 'View'}
                                            </td>
                                        </tr>

                                        {/* Child Rows */}
                                        {isExpanded && apps.map(app => (
                                            <tr key={app.id} className="bg-white dark:bg-slate-950/50 animate-in fade-in">
                                                <td className="px-4 py-2 pl-10 text-xs text-slate-600 dark:text-slate-300 border-l-4 border-indigo-500/10">
                                                    {app.applicantName}
                                                </td>
                                                <td className="px-4 py-2 font-mono text-xs text-slate-500">{app.upiHandle}</td>
                                                <td className="px-4 py-2 font-mono text-xs text-slate-900 dark:text-white text-right">{formatCurrency(app.amount)}</td>
                                                <td className="px-4 py-2">
                                                    <StatusBadge status={app.status} />
                                                </td>
                                                <td className="px-4 py-2 text-right flex items-center justify-end gap-2">
                                                    <ActionButtons app={app} updateStatus={updateStatus} deleteApp={deleteApp} />
                                                </td>
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
});
