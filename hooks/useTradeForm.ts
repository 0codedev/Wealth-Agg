import { useState, useEffect, useRef } from 'react';
import { db, Trade, Strategy } from '../database';
import { useSettingsStore } from '../store/settingsStore';
import { compressImage } from '../utils/helpers';
import { useToast } from '../components/shared/ToastProvider';

export const useTradeForm = (isOpen: boolean, onSave: () => void, onClose: () => void) => {
    const { toast } = useToast();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState<Partial<Trade>>({
        direction: 'Long',
        date: new Date().toISOString().split('T')[0],
        entryTime: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        mistakes: [],
        quantity: 1,
        grade: 'B',
        fees: 0,
        mae: 0,
        mfe: 0,
        complianceScore: 0
    });

    // Strategy State
    const [strategies, setStrategies] = useState<Strategy[]>([]);
    const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
    const [checkedRules, setCheckedRules] = useState<boolean[]>([]);

    // Risk Management State
    const [totalCapital, setTotalCapital] = useState<string>('100000');
    const [riskData, setRiskData] = useState({ riskAmount: 0, percentRisk: 0, isViolation: false, rMultiple: 0 });
    const [isCompressing, setIsCompressing] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [newMistake, setNewMistake] = useState('');

    const riskPerTrade = useSettingsStore(state => state.riskPerTrade);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Load Strategies on Open
    useEffect(() => {
        if (isOpen) {
            db.strategies.toArray().then(setStrategies);
        }
    }, [isOpen]);

    // Handle Strategy Selection & Reset Checklist
    useEffect(() => {
        if (formData.setup) {
            const strat = strategies.find(s => s.name === formData.setup);
            if (strat) {
                setSelectedStrategy(strat);
                if (checkedRules.length !== strat.rules.length) {
                    setCheckedRules(new Array(strat.rules.length).fill(false));
                }
            } else {
                setSelectedStrategy(null);
                setCheckedRules([]);
            }
        }
    }, [formData.setup, strategies]);

    // Calculate Compliance Score
    useEffect(() => {
        if (selectedStrategy && selectedStrategy.rules.length > 0) {
            const checkedCount = checkedRules.filter(Boolean).length;
            const score = Math.round((checkedCount / selectedStrategy.rules.length) * 100);
            setFormData(prev => ({ ...prev, complianceScore: score }));
        } else {
            setFormData(prev => ({ ...prev, complianceScore: 0 }));
        }
    }, [checkedRules, selectedStrategy]);

    // Preview URL
    useEffect(() => {
        if (formData.screenshot instanceof Blob) {
            const url = URL.createObjectURL(formData.screenshot);
            setPreviewUrl(url);
            return () => URL.revokeObjectURL(url);
        } else if (typeof formData.screenshot === 'string') {
            setPreviewUrl(formData.screenshot);
        } else {
            setPreviewUrl(null);
        }
    }, [formData.screenshot]);

    // Risk Calculation
    useEffect(() => {
        if (formData.entryPrice && formData.stopLoss && formData.quantity && totalCapital) {
            const entry = formData.entryPrice;
            const sl = formData.stopLoss;
            const qty = formData.quantity;
            const exit = formData.exitPrice || entry;
            const cap = parseFloat(totalCapital);

            const riskPerShare = Math.abs(entry - sl);
            const totalRisk = riskPerShare * qty;
            const percentRisk = cap > 0 ? (totalRisk / cap) * 100 : 0;
            const isViolation = percentRisk > riskPerTrade;

            let rMultiple = 0;
            if (riskPerShare > 0) {
                if (formData.direction === 'Long') {
                    rMultiple = (exit - entry) / riskPerShare;
                } else {
                    rMultiple = (entry - exit) / riskPerShare;
                }
            }

            setRiskData({ riskAmount: totalRisk, percentRisk, isViolation, rMultiple });
        } else {
            setRiskData({ riskAmount: 0, percentRisk: 0, isViolation: false, rMultiple: 0 });
        }
    }, [formData.entryPrice, formData.stopLoss, formData.quantity, formData.exitPrice, formData.direction, totalCapital, riskPerTrade]);

    const updateField = (field: keyof Trade, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const toggleMistake = (tag: string) => {
        const current = formData.mistakes || [];
        const updated = current.includes(tag)
            ? current.filter(t => t !== tag)
            : [...current, tag];
        updateField('mistakes', updated);
    };

    const handleAddMistake = () => {
        if (newMistake.trim()) {
            const tag = newMistake.trim();
            toggleMistake(tag);
            setNewMistake('');
        }
    };

    const handleRuleToggle = (index: number) => {
        const updated = [...checkedRules];
        updated[index] = !updated[index];
        setCheckedRules(updated);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsCompressing(true);
            try {
                const compressedBlob = await compressImage(file);
                updateField('screenshot', compressedBlob);
            } catch (err) {
                toast.error('Failed to process image. Please try a different file.');
            } finally {
                setIsCompressing(false);
            }
        }
    };

    const handleSubmit = async () => {
        if (!formData.ticker || !formData.entryPrice || !formData.exitPrice) return;
        if (riskData.isViolation) return;

        try {
            const tradeToSave = { ...formData, riskRewardRatio: riskData.rMultiple } as Trade;
            await db.trades.add(tradeToSave);
            onSave();
            onClose();
        } catch (error) {
            console.error("Failed to save trade", error);
            toast.error('Error saving trade. Please try again.');
        }
    };

    const nextStep = () => setStep(s => Math.min(s + 1, 4));
    const prevStep = () => setStep(s => Math.max(s - 1, 1));

    return {
        step,
        formData,
        strategies,
        selectedStrategy,
        checkedRules,
        totalCapital,
        riskData,
        isCompressing,
        previewUrl,
        newMistake,
        setNewMistake,
        setTotalCapital,
        updateField,
        toggleMistake,
        handleAddMistake,
        handleRuleToggle,
        handleFileChange,
        handleSubmit,
        nextStep,
        prevStep,
        fileInputRef
    };
};
