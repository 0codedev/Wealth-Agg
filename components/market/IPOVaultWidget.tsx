import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Friend } from '../../database';
import { Users, Plus, Wallet, ArrowUpRight, ArrowDownLeft, Trash2, History, ChevronRight } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';
import { motion, AnimatePresence } from 'framer-motion';

export const IPOVaultWidget: React.FC = () => {
    const friends = useLiveQuery(() => db.friends.toArray());
    const [isAddMode, setIsAddMode] = useState(false);
    const [newFriendName, setNewFriendName] = useState('');
    const [initialBalance, setInitialBalance] = useState('');

    const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
    const [fundAmount, setFundAmount] = useState('');

    const totalVaultValue = friends?.reduce((acc, curr) => acc + curr.balance, 0) || 0;

    const handleAddFriend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFriendName) return;

        await db.friends.add({
            name: newFriendName,
            balance: parseFloat(initialBalance) || 0,
            color: `hsl(${Math.random() * 360}, 70%, 50%)`,
            history: [{
                date: new Date().toISOString(),
                amount: parseFloat(initialBalance) || 0,
                type: 'DEPOSIT',
                notes: 'Initial Balance'
            }]
        });

        setIsAddMode(false);
        setNewFriendName('');
        setInitialBalance('');
    };

    const handleTransaction = async (type: 'DEPOSIT' | 'WITHDRAW') => {
        if (!selectedFriend || !fundAmount) return;
        const amount = parseFloat(fundAmount);
        if (isNaN(amount) || amount <= 0) return;

        const newBalance = type === 'DEPOSIT'
            ? selectedFriend.balance + amount
            : selectedFriend.balance - amount;

        const updatedHistory = [
            ...(selectedFriend.history || []),
            {
                date: new Date().toISOString(),
                amount: amount,
                type: type,
                notes: 'Manual Update'
            }
        ];

        await db.friends.update(selectedFriend.id!, {
            balance: newBalance,
            history: updatedHistory
        });

        setFundAmount('');
        // Keep selected friend open to show updated balance
    };

    const handleDelete = async (id: number) => {
        if (confirm('Delete this friend from vault?')) {
            await db.friends.delete(id);
            setSelectedFriend(null);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-indigo-500/20 rounded-xl">
                        <Users className="text-indigo-600 dark:text-indigo-400" size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 dark:text-white">IPO Syndicate Vault</h3>
                        <p className="text-[10px] text-slate-500">Track balance in friends' accounts</p>
                    </div>
                </div>
                {!isAddMode && (
                    <button
                        onClick={() => setIsAddMode(true)}
                        className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-400 transition-colors"
                    >
                        <Plus size={16} />
                    </button>
                )}
            </div>

            <div className="mb-4 p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white shadow-lg shadow-indigo-500/20">
                <p className="text-xs font-medium text-indigo-100 mb-1">Total Vault Value</p>
                <div className="flex items-baseline gap-1">
                    <h2 className="text-3xl font-black">{formatCurrency(totalVaultValue)}</h2>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-[200px]">
                {isAddMode ? (
                    <form onSubmit={handleAddFriend} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 animate-in slide-in-from-top-2">
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Add New Partner</h4>
                            <button type="button" onClick={() => setIsAddMode(false)} className="text-xs text-rose-500 font-bold">Cancel</button>
                        </div>
                        <input
                            type="text"
                            placeholder="Name (e.g., Rahul)"
                            value={newFriendName}
                            onChange={(e) => setNewFriendName(e.target.value)}
                            className="w-full mb-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm"
                            autoFocus
                        />
                        <input
                            type="number"
                            placeholder="Initial Balance"
                            value={initialBalance}
                            onChange={(e) => setInitialBalance(e.target.value)}
                            className="w-full mb-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm"
                        />
                        <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-bold">
                            Add Partner
                        </button>
                    </form>
                ) : selectedFriend ? (
                    <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 h-full flex flex-col animate-in fade-in">
                        <div className="flex items-center justify-between mb-4">
                            <button onClick={() => setSelectedFriend(null)} className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-700">
                                ← Back
                            </button>
                            <button onClick={() => handleDelete(selectedFriend.id!)} className="text-slate-400 hover:text-rose-500">
                                <Trash2 size={14} />
                            </button>
                        </div>

                        <div className="text-center mb-6">
                            <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center text-xl font-bold text-white mb-2 shadow-sm" style={{ backgroundColor: selectedFriend.color }}>
                                {selectedFriend.name[0]}
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">{selectedFriend.name}</h3>
                            <p className="text-2xl font-black text-emerald-500 mt-1">{formatCurrency(selectedFriend.balance)}</p>
                            <p className="text-[10px] text-slate-400 mt-1">Available in Bank</p>
                        </div>

                        <div className="mt-auto space-y-2">
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-slate-400 text-xs">₹</span>
                                <input
                                    type="number"
                                    placeholder="Amount"
                                    value={fundAmount}
                                    onChange={(e) => setFundAmount(e.target.value)}
                                    className="w-full pl-6 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm mb-2"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => handleTransaction('DEPOSIT')}
                                    disabled={!fundAmount}
                                    className="flex items-center justify-center gap-1 bg-emerald-500 text-white py-2 rounded-lg text-xs font-bold hover:bg-emerald-600 disabled:opacity-50"
                                >
                                    <ArrowDownLeft size={14} /> Add
                                </button>
                                <button
                                    onClick={() => handleTransaction('WITHDRAW')}
                                    disabled={!fundAmount}
                                    className="flex items-center justify-center gap-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 py-2 rounded-lg text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50"
                                >
                                    <ArrowUpRight size={14} /> Withdraw
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {friends?.map(friend => (
                            <div
                                key={friend.id}
                                onClick={() => setSelectedFriend(friend)}
                                className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 cursor-pointer transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm" style={{ backgroundColor: friend.color }}>
                                        {friend.name[0]}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800 dark:text-white">{friend.name}</p>
                                        <p className="text-[10px] text-slate-500">
                                            {friend.history?.filter(h => h.type === 'PROFIT').length || 0} IPOs Won
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-emerald-600">{formatCurrency(friend.balance)}</p>
                                    <ChevronRight size={14} className="ml-auto text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </div>
                        ))}

                        {(!friends || friends.length === 0) && (
                            <div className="text-center py-8 text-slate-400">
                                <Users size={32} className="mx-auto mb-2 opacity-50" />
                                <p className="text-xs">No partners yet.</p>
                                <button onClick={() => setIsAddMode(true)} className="text-xs text-indigo-500 font-bold mt-2">Add First Partner</button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
