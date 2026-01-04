import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, Send, Sparkles, TrendingUp, PiggyBank, Target, Lightbulb } from 'lucide-react';

interface AICopilotWidgetProps {
    formatCurrency?: (val: number) => string;
}

// Simple pre-defined suggestions based on common queries
const QUICK_ACTIONS = [
    { id: 1, label: 'Portfolio summary', icon: <TrendingUp size={14} /> },
    { id: 2, label: 'Saving tips', icon: <PiggyBank size={14} /> },
    { id: 3, label: 'Goal progress', icon: <Target size={14} /> },
    { id: 4, label: 'Investment ideas', icon: <Lightbulb size={14} /> },
];

const AI_RESPONSES: Record<string, string> = {
    'portfolio': "Your portfolio is up 12.5% this year. Top performers: HDFC Bank (+24%), TCS (+18%). Consider reviewing your IT sector exposure.",
    'saving': "Based on your spending, you could save ₹8,000 more monthly by reducing dining out and reviewing subscriptions.",
    'goal': "You're 68% toward your ₹10L goal. At current pace, you'll reach it in 14 months.",
    'investment': "Consider adding more debt funds for stability. Your equity allocation (75%) is higher than recommended for your risk profile.",
    'default': "I can help with portfolio insights, saving tips, goal tracking, and investment suggestions. What would you like to know?"
};

const AICopilotWidget: React.FC<AICopilotWidgetProps> = ({ formatCurrency = (v) => `₹${v.toLocaleString()}` }) => {
    const [query, setQuery] = useState('');
    const [response, setResponse] = useState<string | null>(null);
    const [isThinking, setIsThinking] = useState(false);

    const handleQuery = async (text: string) => {
        setIsThinking(true);
        setQuery('');

        // Simulate AI thinking
        await new Promise(r => setTimeout(r, 800));

        const lowerText = text.toLowerCase();
        let answer = AI_RESPONSES['default'];

        if (lowerText.includes('portfolio') || lowerText.includes('summary')) {
            answer = AI_RESPONSES['portfolio'];
        } else if (lowerText.includes('save') || lowerText.includes('saving') || lowerText.includes('tip')) {
            answer = AI_RESPONSES['saving'];
        } else if (lowerText.includes('goal') || lowerText.includes('progress')) {
            answer = AI_RESPONSES['goal'];
        } else if (lowerText.includes('invest') || lowerText.includes('idea')) {
            answer = AI_RESPONSES['investment'];
        }

        setResponse(answer);
        setIsThinking(false);
    };

    return (
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950/20 to-slate-900 rounded-2xl border border-indigo-500/20 p-4 h-full">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Bot size={16} className="text-white" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-1">
                        AI Copilot <Sparkles size={10} className="text-amber-400" />
                    </h3>
                    <p className="text-[9px] text-slate-500">Your financial assistant</p>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-1.5 mb-3">
                {QUICK_ACTIONS.map(action => (
                    <button
                        key={action.id}
                        onClick={() => handleQuery(action.label)}
                        className="flex items-center gap-1 px-2 py-1 text-[10px] bg-slate-800 text-slate-300 rounded-lg hover:bg-indigo-500/20 hover:text-indigo-400 border border-slate-700 transition-colors"
                    >
                        {action.icon}
                        {action.label}
                    </button>
                ))}
            </div>

            {/* Response Area */}
            <div className="bg-slate-800/50 rounded-xl p-3 min-h-[80px] mb-3 border border-slate-700/50">
                {isThinking ? (
                    <div className="flex items-center gap-2 text-slate-400">
                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
                        <span className="text-xs">Thinking...</span>
                    </div>
                ) : response ? (
                    <p className="text-xs text-slate-300 leading-relaxed">{response}</p>
                ) : (
                    <p className="text-xs text-slate-500 italic">Ask me anything about your finances...</p>
                )}
            </div>

            {/* Input */}
            <div className="flex gap-2">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && query.trim() && handleQuery(query)}
                    placeholder="Ask a question..."
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-indigo-500 outline-none"
                />
                <button
                    onClick={() => query.trim() && handleQuery(query)}
                    disabled={!query.trim()}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white rounded-lg transition-colors"
                >
                    <Send size={14} />
                </button>
            </div>
        </div>
    );
};

export default AICopilotWidget;
