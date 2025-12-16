import React, { useState } from 'react';
import { Clipboard, ArrowRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface ParsedData {
    fresh?: number;
    promoter?: number;
    gmp?: number;
    sub?: number;
    qib?: number;
    nii?: number;
    retail?: number;
}

interface PasteParserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onParse: (data: ParsedData) => void;
}

const PasteParserModal: React.FC<PasteParserModalProps> = ({ isOpen, onClose, onParse }) => {
    const [text, setText] = useState('');
    const [isParsing, setIsParsing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const parseText = () => {
        setIsParsing(true);
        setError(null);

        setTimeout(() => {
            try {
                const data: ParsedData = {};
                const lower = text.toLowerCase();

                // Regex Patterns
                const freshMatch = lower.match(/fresh.*?(\d+(\.\d+)?)/);
                if (freshMatch) data.fresh = parseFloat(freshMatch[1]);

                const promoterMatch = lower.match(/promoter.*?(\d+(\.\d+)?)/);
                if (promoterMatch) data.promoter = parseFloat(promoterMatch[1]);

                const gmpMatch = lower.match(/gmp.*?(\d+(\.\d+)?)/);
                if (gmpMatch) data.gmp = parseFloat(gmpMatch[1]);

                const subMatch = lower.match(/sub.*?(\d+(\.\d+)?)/);
                if (subMatch) data.sub = parseFloat(subMatch[1]);

                const qibMatch = lower.match(/qib.*?(\d+(\.\d+)?)/);
                if (qibMatch) data.qib = parseFloat(qibMatch[1]);

                const niiMatch = lower.match(/nii.*?(\d+(\.\d+)?)/);
                if (niiMatch) data.nii = parseFloat(niiMatch[1]);

                const retailMatch = lower.match(/retail.*?(\d+(\.\d+)?)/);
                if (retailMatch) data.retail = parseFloat(retailMatch[1]);

                if (Object.keys(data).length === 0) {
                    throw new Error("No recognizable data found. Try pasting 'GMP: 50, Sub: 10x'");
                }

                onParse(data);
                onClose();
                setText('');
            } catch (err: any) {
                setError(err.message || "Failed to parse data");
            } finally {
                setIsParsing(false);
            }
        }, 800); // Fake delay for effect
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Clipboard className="text-indigo-500" size={20} /> Paste Parser
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        Close
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Paste text from Chittorgarh, GMP sites, or WhatsApp messages. We'll extract the numbers.
                    </p>

                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Example: NTPC Green IPO. GMP 8. Subscription 2.5x. QIB 3.2x..."
                        className="w-full h-32 p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-500 text-sm font-mono resize-none"
                    />

                    {error && (
                        <div className="flex items-center gap-2 text-rose-500 text-xs font-bold bg-rose-50 dark:bg-rose-900/20 p-3 rounded-lg">
                            <AlertCircle size={14} /> {error}
                        </div>
                    )}

                    <button
                        onClick={parseText}
                        disabled={!text.trim() || isParsing}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                        {isParsing ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
                        {isParsing ? 'Analyzing...' : 'Extract Data'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PasteParserModal;
