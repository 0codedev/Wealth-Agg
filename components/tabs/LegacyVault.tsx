import React, { useState, useEffect } from 'react';
import {
    Shield, Users, FileText, Lock, Plus, Trash2,
    Printer, Heart, AlertTriangle, CheckCircle, Loader2
} from 'lucide-react';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend
} from 'recharts';
import { Investment } from '../../types';
import { db, Beneficiary } from '../../database';
import { useLiveQuery } from 'dexie-react-hooks';
import { useToast } from '../shared/ToastProvider';

interface LegacyVaultProps {
    investments: Investment[];
    totalNetWorth: string; // formatted string
}

const COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6'];

const LegacyVault: React.FC<LegacyVaultProps> = ({ investments, totalNetWorth }) => {
    const { toast } = useToast();
    const [newBeneficiaryName, setNewBeneficiaryName] = useState('');
    const [isICEView, setIsICEView] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);

    // --- Persistent State via IndexedDB ---
    const beneficiaries = useLiveQuery(
        () => db.beneficiaries.toArray(),
        []
    ) ?? [];

    // Initialize with default beneficiaries if table is empty
    useEffect(() => {
        const initBeneficiaries = async () => {
            const count = await db.beneficiaries.count();
            if (count === 0) {
                await db.beneficiaries.bulkAdd([
                    { name: 'Spouse', relation: 'Spouse', allocation: 50, color: COLORS[0] },
                    { name: 'Children', relation: 'Child', allocation: 50, color: COLORS[1] }
                ]);
            }
            setIsInitializing(false);
        };
        initBeneficiaries();
    }, []);

    // --- Derived ---
    const totalAllocation = Array.isArray(beneficiaries)
        ? beneficiaries.reduce((sum, b) => sum + b.allocation, 0)
        : 0;
    const isAllocationValid = totalAllocation === 100;

    // --- Handlers ---
    const addBeneficiary = async () => {
        if (!newBeneficiaryName) return;
        const color = COLORS[(beneficiaries?.length || 0) % COLORS.length];
        await db.beneficiaries.add({
            name: newBeneficiaryName,
            relation: 'Other',
            allocation: 0,
            color
        });
        setNewBeneficiaryName('');
        toast.success(`Added ${newBeneficiaryName} as beneficiary`);
    };

    const updateAllocation = async (id: number, val: number) => {
        await db.beneficiaries.update(id, { allocation: val });
    };

    const deleteBeneficiary = async (id: number) => {
        await db.beneficiaries.delete(id);
        toast.info('Beneficiary removed');
    };

    const handlePrintICE = () => {
        window.print();
    };

    // --- Loading State ---
    if (isInitializing) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="animate-spin text-indigo-500" size={48} />
            </div>
        );
    }

    // --- ICE Render ---
    if (isICEView) {
        return (
            <div className="fixed inset-0 z-50 bg-white text-slate-900 p-8 overflow-auto animate-in fade-in duration-300">
                <div className="max-w-3xl mx-auto border border-slate-300 p-8 shadow-2xl print:shadow-none print:border-none">
                    <div className="flex justify-between items-start mb-8 border-b border-slate-900 pb-4">
                        <div>
                            <h1 className="text-3xl font-black uppercase tracking-widest text-slate-900">ICES Report</h1>
                            <p className="text-sm font-bold text-slate-500">In Case of Emergency Sheet • Confidential</p>
                        </div>
                        <div className="text-right print:hidden">
                            <button onClick={() => window.print()} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold mr-2">Print / Save PDF</button>
                            <button onClick={() => setIsICEView(false)} className="bg-slate-200 text-slate-900 px-4 py-2 rounded-lg text-sm font-bold">Close</button>
                        </div>
                    </div>

                    <div className="bg-rose-50 border border-rose-200 p-4 rounded-lg mb-8 text-sm text-rose-800 font-medium">
                        <AlertTriangle className="inline-block mr-2 mb-1" size={16} />
                        To the Reader: This document contains sensitive financial information intended solely for the beneficiaries listed below.
                    </div>

                    <div className="grid grid-cols-2 gap-8 mb-8">
                        <div>
                            <h3 className="text-xs font-black uppercase text-slate-400 mb-2">Total Asset Value</h3>
                            <p className="text-2xl font-mono font-bold">{totalNetWorth}</p>
                        </div>
                        <div>
                            <h3 className="text-xs font-black uppercase text-slate-400 mb-2">Asset Count</h3>
                            <p className="text-2xl font-mono font-bold">{investments.length} Holdings</p>
                        </div>
                    </div>

                    <h3 className="text-lg font-bold border-b border-slate-200 pb-2 mb-4">1. Key Beneficiaries</h3>
                    <ul className="mb-8 space-y-2">
                        {beneficiaries.map(b => (
                            <li key={b.id} className="flex justify-between font-mono text-sm border-b border-dotted border-slate-300 pb-1">
                                <span>{b.name} ({b.relation})</span>
                                <span className="font-bold">{b.allocation}% Allocation</span>
                            </li>
                        ))}
                    </ul>

                    <h3 className="text-lg font-bold border-b border-slate-200 pb-2 mb-4">2. Asset Ledger</h3>
                    <table className="w-full text-left text-sm mb-8">
                        <thead>
                            <tr className="bg-slate-100 uppercase text-xs">
                                <th className="p-2">Asset Name</th>
                                <th className="p-2">Type</th>
                                <th className="p-2">Platform / Location</th>
                            </tr>
                        </thead>
                        <tbody>
                            {investments.map(inv => (
                                <tr key={inv.id} className="border-b border-slate-100">
                                    <td className="p-2 font-bold">{inv.name}</td>
                                    <td className="p-2 text-slate-500">{inv.type}</td>
                                    <td className="p-2 text-slate-500">{inv.platform}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="mt-12 pt-8 border-t border-slate-900 text-center text-xs text-slate-400">
                        Generated by WealthAggregator • Local Secure Vault
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20 animate-in fade-in duration-500">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                        <Lock className="text-rose-500" />
                        LEGACY VAULT
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400">Estate Planning & Emergency Access Protocols</p>
                </div>
                <button
                    onClick={() => setIsICEView(true)}
                    className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-transform"
                >
                    <Printer size={16} /> Generate I.C.E. Report
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* 1. BENEFICIARY MAPPER */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-6">
                        <Users size={18} className="text-indigo-500" /> Beneficiary Mapper
                    </h3>

                    <div className="flex gap-4 mb-6">
                        <input
                            type="text"
                            placeholder="New Beneficiary Name..."
                            value={newBeneficiaryName}
                            onChange={e => setNewBeneficiaryName(e.target.value)}
                            className="flex-1 bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 font-medium"
                        />
                        <button
                            onClick={addBeneficiary}
                            className="bg-indigo-500 text-white p-3 rounded-xl hover:bg-indigo-600 transition-colors"
                        >
                            <Plus size={20} />
                        </button>
                    </div>

                    <div className="space-y-4">
                        {beneficiaries.map(b => (
                            <div key={b.id} className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                                <div className="w-2 h-10 rounded-full" style={{ backgroundColor: b.color }}></div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-slate-800 dark:text-white truncate">{b.name}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{b.relation}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex flex-col items-end w-32">
                                        <span className="text-xs font-bold text-slate-500 uppercase">Allocation</span>
                                        <div className="flex items-center gap-2 w-full">
                                            <input
                                                type="range" min="0" max="100"
                                                value={b.allocation}
                                                onChange={e => updateAllocation(b.id, Number(e.target.value))}
                                                className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                            />
                                            <span className="font-mono font-bold w-10 text-right">{b.allocation}%</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => deleteBeneficiary(b.id)}
                                        className="text-slate-400 hover:text-rose-500 transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {!isAllocationValid && (
                        <div className="mt-6 flex items-center gap-2 text-rose-500 font-bold bg-rose-50 dark:bg-rose-900/20 p-3 rounded-xl">
                            <AlertTriangle size={18} />
                            <span>Total allocation must equal 100% (Current: {totalAllocation}%)</span>
                        </div>
                    )}
                </div>

                {/* 2. VISUAL DISTRIBUTION */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-6">
                        <Heart size={18} className="text-pink-500" /> Distribution
                    </h3>

                    <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={beneficiaries}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="allocation"
                                >
                                    {beneficiaries.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-start gap-3">
                            <Shield className="text-emerald-500 shrink-0" />
                            <div>
                                <h4 className="font-bold text-sm text-slate-800 dark:text-white">Secure Vault</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    All beneficiary data is stored locally. The ICE Report is generated purely in your browser memory for printing.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default LegacyVault;
