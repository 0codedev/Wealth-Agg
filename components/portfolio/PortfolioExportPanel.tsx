import React, { useState } from 'react';
import { Download, FileText, FileSpreadsheet, Printer, Check, Loader2 } from 'lucide-react';
import { portfolioExportService } from '../../services/PortfolioExportService';
import { Investment } from '../../types';

interface PortfolioExportPanelProps {
    investments: Investment[];
}

export const PortfolioExportPanel: React.FC<PortfolioExportPanelProps> = ({ investments }) => {
    const [isExporting, setIsExporting] = useState<string | null>(null);
    const [lastExported, setLastExported] = useState<string | null>(null);

    const handleExport = async (format: 'csv' | 'json' | 'html') => {
        setIsExporting(format);

        // Small delay for UX
        await new Promise(resolve => setTimeout(resolve, 500));

        const summary = portfolioExportService.generateSummary(investments);

        switch (format) {
            case 'csv':
                portfolioExportService.exportToCSV(investments);
                break;
            case 'json':
                portfolioExportService.exportToJSON(investments, summary);
                break;
            case 'html':
                portfolioExportService.exportToHTML(investments, summary);
                break;
        }

        setIsExporting(null);
        setLastExported(format);

        // Clear success indicator after 3 seconds
        setTimeout(() => setLastExported(null), 3000);
    };

    const exportOptions = [
        {
            id: 'csv',
            label: 'CSV (Excel)',
            description: 'For spreadsheet analysis',
            icon: FileSpreadsheet,
            color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30'
        },
        {
            id: 'json',
            label: 'JSON Report',
            description: 'For CA/Tax filing',
            icon: FileText,
            color: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30'
        },
        {
            id: 'html',
            label: 'Print Report',
            description: 'Professional PDF',
            icon: Printer,
            color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30'
        },
    ];

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-indigo-500/20 rounded-xl">
                        <Download className="text-indigo-600 dark:text-indigo-400" size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 dark:text-white">Export Portfolio</h3>
                        <p className="text-[10px] text-slate-500">{investments.length} holdings ready</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
                {exportOptions.map(option => {
                    const isLoading = isExporting === option.id;
                    const isSuccess = lastExported === option.id;

                    return (
                        <button
                            key={option.id}
                            onClick={() => handleExport(option.id as any)}
                            disabled={isLoading || investments.length === 0}
                            className={`p-4 rounded-xl border-2 border-dashed transition-all hover:border-solid hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${isSuccess
                                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                                    : 'border-slate-200 dark:border-slate-700 hover:border-indigo-500'
                                }`}
                        >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${option.color}`}>
                                {isLoading ? (
                                    <Loader2 size={20} className="animate-spin" />
                                ) : isSuccess ? (
                                    <Check size={20} className="text-emerald-600" />
                                ) : (
                                    <option.icon size={20} />
                                )}
                            </div>
                            <p className="font-bold text-sm text-slate-800 dark:text-white">{option.label}</p>
                            <p className="text-[10px] text-slate-500">{option.description}</p>
                        </button>
                    );
                })}
            </div>

            {investments.length === 0 && (
                <p className="text-center text-xs text-slate-400 mt-4">
                    Add investments to enable export
                </p>
            )}
        </div>
    );
};

export default PortfolioExportPanel;
