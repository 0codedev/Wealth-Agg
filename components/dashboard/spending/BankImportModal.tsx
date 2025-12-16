import React, { useState } from 'react';
import { useTransactions } from '../../../contexts/TransactionContext';
import { Upload, X, FileText, Brain, Check, FileUp } from 'lucide-react';

interface BankImportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const BankImportModal: React.FC<BankImportModalProps> = ({ isOpen, onClose }) => {
    const [parsing, setParsing] = useState(false);
    const [parsed, setParsed] = useState(false);
    const [parsedCount, setParsedCount] = useState(0);
    const { spendingByCategory, parseAndAddFromFile, clearTransactions, lastImportResult } = useTransactions();

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setParsing(true);

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            const fileType = file.name.endsWith('.csv') ? 'csv' : 'text';

            // Simulate AI delay for effect
            setTimeout(() => {
                const count = parseAndAddFromFile(content, fileType);
                setParsing(false);
                setParsed(true);
                setParsedCount(count);
            }, 1500);
        };

        reader.onerror = () => {
            setParsing(false);
            alert('Failed to read file');
        };

        reader.readAsText(file);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <FileText className="text-blue-500" /> Import Bank Statement
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>
                <div className="p-6">
                    {!parsed ? (
                        <div className="text-center">
                            <label className="block relative border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all cursor-pointer group">
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <Upload className="text-indigo-600 dark:text-indigo-400" size={32} />
                                    </div>
                                    <p className="text-slate-900 dark:text-white font-bold mb-1">
                                        Click to Upload Statement
                                    </p>
                                    <p className="text-sm text-slate-500 group-hover:text-indigo-500 transition-colors">
                                        Supports CSV, PDF, XLS
                                    </p>
                                </div>
                                <input
                                    type="file"
                                    accept=".csv,.txt,.xls,.xlsx"
                                    onChange={handleFileUpload}
                                    className="opacity-0 w-full h-40 cursor-pointer"
                                />
                            </label>

                            {parsing && (
                                <div className="mt-6 flex items-center justify-center gap-3 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl">
                                    <Brain className="animate-spin" size={24} />
                                    <span className="font-medium animate-pulse">AI is analyzing your spending patterns...</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Check size={32} className="text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Import Complete!</h3>
                                <div className="flex justify-center gap-4 mt-3 text-sm">
                                    <span className="px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-lg font-bold">
                                        ✅ {lastImportResult?.added || parsedCount} new
                                    </span>
                                    <span className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg font-bold">
                                        🔄 {lastImportResult?.updated || 0} updated
                                    </span>
                                    <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg font-bold">
                                        ⏭️ {lastImportResult?.skipped || 0} skipped
                                    </span>
                                </div>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 mb-6 max-h-48 overflow-y-auto space-y-2">
                                {spendingByCategory.slice(0, 5).map((t, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm">
                                        <span className="font-medium text-slate-700 dark:text-slate-200">{t.category}</span>
                                        <span className="font-mono font-bold text-slate-900 dark:text-white">₹{t.amount.toLocaleString()}</span>
                                    </div>
                                ))}
                                {spendingByCategory.length > 5 && (
                                    <p className="text-xs text-center text-slate-400 pt-2">and {spendingByCategory.length - 5} more categories...</p>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => { setParsed(false); setParsedCount(0); }}
                                    className="flex-1 py-3 px-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    <FileUp size={18} /> Upload Another
                                </button>
                                <button
                                    onClick={onClose}
                                    className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all"
                                >
                                    View Dashboard
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
