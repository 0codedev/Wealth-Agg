
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useToast } from './shared/ToastProvider';
import { db, IPOApplication } from '../database';
import { Investment, InvestmentType } from '../types';
import { Users, RefreshCw, ShieldCheck, Plus, Trash2, BarChart4, Rocket, CheckCircle2, ArrowRight, Wallet, ChevronDown, ChevronRight, LayoutList, GripVertical } from 'lucide-react';
import { formatCurrency } from '../utils/helpers';

interface SyndicateTrackerProps {
    totalCash: number;
    onPortfolioRefresh?: () => void;
    onDataChange?: () => void;
}

const SyndicateTracker: React.FC<SyndicateTrackerProps> = ({ totalCash, onPortfolioRefresh, onDataChange }) => {
    const { toast } = useToast();
    const [applications, setApplications] = useState<IPOApplication[]>([]);
    const [formData, setFormData] = useState<Partial<IPOApplication>>({
        status: 'BLOCKED',
        amount: 15000,
        appliedDate: new Date().toISOString().split('T')[0]
    });
    const [formError, setFormError] = useState<string | null>(null);

    // View Mode: 'LIST' or 'GROUPED'
    const [viewMode, setViewMode] = useState<'LIST' | 'GROUPED'>('LIST');
    const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

    // Listing Day Logic State
    const [selectedIPO, setSelectedIPO] = useState<string>('');
    const [listingMode, setListingMode] = useState<'PERCENT' | 'PRICE'>('PERCENT');
    const [listingGainPct, setListingGainPct] = useState<string>('');
    const [listingPrice, setListingPrice] = useState<string>('');
    const [issuePrice, setIssuePrice] = useState<string>('');
    const [isSyncing, setIsSyncing] = useState(false);

    const [syncSuccess, setSyncSuccess] = useState(false);
    const [realizedGains, setRealizedGains] = useState(0);

    const applicantInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadApplications();
    }, []);

    const loadApplications = async () => {
        const data = await db.ipo_applications.toArray();
        // Sort by date descending (newest first)
        data.sort((a, b) => new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime());
        setApplications(data);

        // Calculate Realized Gains from Investments (Platform = Syndicate)
        const syndicateInv = await db.investments.where('platform').equals('Syndicate').toArray();

        // --- CLEANUP LOGIC (Cycle 17.1 Fixing Data Integrity) ---
        // Identify valid IPO names that are currently marked as LISTED in applications
        /* DISABLED CYCLE 22: Causing data loss on restore. 
           If DB restores Investments but not Applications immediately, this deletes the investments.
           Better to have "Ghost" gains than lost money.
        
        const validListedIPONames = new Set(
            data.filter(app => app.status === 'LISTED').map(app => app.ipoName)
        );

        // Identify orphan investments (those with no matching listed application)
        const orphanInvestments = syndicateInv.filter(inv => {
            // Investment name format is "IPO Gain: [IPOName]"
            const ipoName = inv.name.replace('IPO Gain: ', '');
            return !validListedIPONames.has(ipoName);
        });

        // Delete orphans to ensure Total Realized matches the visible list
        if (orphanInvestments.length > 0) {
            await db.investments.bulkDelete(orphanInvestments.map(i => i.id));
        }
        */

        // const validInv = syndicateInv.filter(inv => !orphanInvestments.includes(inv));
        // Use ALL syndicate investments for calculation (Cycle 22 Fix)
        const validInv = syndicateInv;
        const gains = validInv.reduce((acc, curr) => acc + (curr.currentValue - curr.investedAmount), 0);
        setRealizedGains(gains);

        if (onDataChange) onDataChange();
    };

    const blockedCapital = applications
        .filter(app => app.status === 'BLOCKED')
        .reduce((acc, curr) => acc + curr.amount, 0);

    // Group active applications logic
    const activeApplications = applications.filter(app => app.status !== 'LISTED');
    const totalActiveCapital = activeApplications.reduce((acc, curr) => acc + curr.amount, 0);

    // Fix: Use totalActiveCapital as fallback for displayTotal to prevent NaN/Overflow if totalCash is 0 or < active amount
    const displayTotal = Math.max(totalCash || 0, totalActiveCapital);
    const availableCapital = totalCash - blockedCapital;
    const isCapitalDanger = availableCapital < 0;

    const groupedApps = useMemo(() => {
        const groups: Record<string, IPOApplication[]> = {};
        activeApplications.forEach(app => {
            if (!groups[app.ipoName]) groups[app.ipoName] = [];
            groups[app.ipoName].push(app);
        });
        return groups;
    }, [activeApplications]);

    // Stack Visualizer Data
    const stackData = Object.entries(groupedApps).map(([name, apps]) => ({
        name,
        amount: apps.reduce((acc, curr) => acc + curr.amount, 0),
        count: apps.length
    })).sort((a, b) => b.amount - a.amount);

    // Unique IPOs available for listing (must have at least one ALLOTTED)
    const availableForListing = useMemo(() => {
        const allottedNames = new Set(
            applications
                .filter(app => app.status === 'ALLOTTED')
                .map(app => app.ipoName)
        );
        return Array.from(allottedNames);
    }, [applications]);

    // Memory for Autocomplete
    const pastApplicants = useMemo(() => Array.from(new Set(applications.map(a => a.applicantName).filter(Boolean))), [applications]);
    const pastUPIs = useMemo(() => Array.from(new Set(applications.map(a => a.upiHandle).filter(Boolean))), [applications]);

    const STACK_COLORS = ['bg-emerald-500', 'bg-blue-500', 'bg-amber-500', 'bg-rose-500', 'bg-indigo-500', 'bg-teal-500', 'bg-orange-500'];


    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.applicantName || !formData.ipoName || !formData.upiHandle || !formData.amount) {
            setFormError("All fields required");
            return;
        }

        // Duplicate checks removed for faster bulk entry as per user request


        await db.ipo_applications.add(formData as IPOApplication);

        // Smart Reset for Bulk Entry
        const currentIPOName = formData.ipoName;
        const currentAmount = formData.amount;

        setFormData({
            status: 'BLOCKED',
            amount: currentAmount, // Keep amount same
            applicantName: '', // Reset applicant
            ipoName: currentIPOName, // Keep IPO name
            upiHandle: '', // Reset UPI
            appliedDate: new Date().toISOString().split('T')[0]
        });
        setFormError(null);
        loadApplications();

        // Auto-expand the group we just added to
        if (!expandedGroups.includes(currentIPOName!)) {
            setExpandedGroups(prev => [...prev, currentIPOName!]);
        }

        // Focus back on applicant name for rapid entry
        applicantInputRef.current?.focus();
    };

    const updateStatus = async (id: number, status: IPOApplication['status']) => {
        await db.ipo_applications.update(id, { status });
        loadApplications();
    };

    const deleteApp = async (id: number) => {
        await db.ipo_applications.delete(id);
        loadApplications();
    };

    const toggleGroup = (ipoName: string) => {
        setExpandedGroups(prev =>
            prev.includes(ipoName) ? prev.filter(n => n !== ipoName) : [...prev, ipoName]
        );
    };

    // --- LISTING DAY LOGIC ---
    const handleRealizeGains = async () => {
        if (!selectedIPO) return;

        let calculatedGainMultiplier = 0;

        if (listingMode === 'PERCENT') {
            if (!listingGainPct) return;
            calculatedGainMultiplier = parseFloat(listingGainPct) / 100;
        } else {
            if (!listingPrice || !issuePrice) return;
            const open = parseFloat(listingPrice);
            const issue = parseFloat(issuePrice);
            if (issue <= 0) return;
            calculatedGainMultiplier = (open - issue) / issue;
        }

        setIsSyncing(true);

        // 1. Calculate stats
        const allottedApps = applications.filter(app => app.ipoName === selectedIPO && app.status === 'ALLOTTED');
        const totalInvested = allottedApps.reduce((acc, curr) => acc + curr.amount, 0);
        const profit = totalInvested * calculatedGainMultiplier;
        const totalCurrentValue = totalInvested + profit;

        try {
            // 2. Add to Main Portfolio
            const newInvestment: Investment = {
                id: crypto.randomUUID(),
                name: `IPO Gain: ${selectedIPO}`,
                type: InvestmentType.IPO,
                platform: 'Syndicate',
                investedAmount: 0, // Record only the gain, as capital is returned
                currentValue: profit,
                lastUpdated: new Date().toISOString()
            };
            await db.investments.add(newInvestment);

            // 3. Archive Applications (Mark as LISTED)
            const updatePromises = allottedApps.map(app =>
                db.ipo_applications.update(app.id!, { status: 'LISTED' })
            );
            await Promise.all(updatePromises);

            // 4. Reset & Notify
            setIsSyncing(false);
            setSyncSuccess(true);
            loadApplications();

            // --- TRIGGER PARENT REFRESH ---
            if (onPortfolioRefresh) {
                onPortfolioRefresh();
            }

            setTimeout(() => {
                setSyncSuccess(false);
                setSelectedIPO('');
                setListingGainPct('');
                setListingPrice('');
                setIssuePrice('');
            }, 3000);

        } catch (err) {
            console.error(err);
            toast.error('Failed to sync with portfolio. Please try again.');
            setIsSyncing(false);
        }
    };

    const previewProfit = useMemo(() => {
        if (!selectedIPO) return 0;
        const totalInvested = applications
            .filter(app => app.ipoName === selectedIPO && app.status === 'ALLOTTED')
            .reduce((acc, curr) => acc + curr.amount, 0);

        if (listingMode === 'PERCENT') {
            if (!listingGainPct) return 0;
            return totalInvested * (parseFloat(listingGainPct) / 100);
        } else {
            if (!listingPrice || !issuePrice) return 0;
            const open = parseFloat(listingPrice);
            const issue = parseFloat(issuePrice);
            if (issue <= 0) return 0;
            return totalInvested * ((open - issue) / issue);
        }
    }, [selectedIPO, listingMode, listingGainPct, listingPrice, issuePrice, applications]);

    // Computed list of archived apps for display and checking
    const listedApps = useMemo(() => applications.filter(app => app.status === 'LISTED'), [applications]);



    return (
        <div className="space-y-6 animate-in fade-in">

            {/* LISTING DAY SIMULATOR */}
            {availableForListing.length > 0 && (
                <div className="bg-gradient-to-r from-emerald-900 to-teal-900 border border-emerald-500/30 rounded-2xl p-6 shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-10">
                        <Rocket size={100} className="text-white" />
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-emerald-500 text-white rounded-lg shadow-lg shadow-emerald-500/50 animate-pulse">
                                <Rocket size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">Listing Day Event</h3>
                                <p className="text-xs text-emerald-200 uppercase font-bold tracking-wider">Realize Profits</p>
                            </div>
                        </div>

                        {!syncSuccess ? (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                <div className="md:col-span-1">
                                    <label className="block text-xs font-bold text-emerald-200 uppercase mb-1">Select IPO</label>
                                    <select
                                        value={selectedIPO}
                                        onChange={(e) => setSelectedIPO(e.target.value)}
                                        className="w-full p-3 rounded-xl bg-black/30 border border-emerald-500/30 text-white outline-none focus:border-emerald-400"
                                    >
                                        <option value="">-- Allotted IPOs --</option>
                                        {availableForListing.map(name => (
                                            <option key={name} value={name}>{name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="md:col-span-2">
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="block text-xs font-bold text-emerald-200 uppercase">Performance</label>
                                        <div className="flex bg-black/30 rounded-lg p-0.5">
                                            <button onClick={() => setListingMode('PERCENT')} className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded ${listingMode === 'PERCENT' ? 'bg-emerald-500 text-white' : 'text-emerald-400'}`}>% Gain</button>
                                            <button onClick={() => setListingMode('PRICE')} className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded ${listingMode === 'PRICE' ? 'bg-emerald-500 text-white' : 'text-emerald-400'}`}>Price</button>
                                        </div>
                                    </div>

                                    {listingMode === 'PERCENT' ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                value={listingGainPct}
                                                onChange={(e) => setListingGainPct(e.target.value)}
                                                placeholder="23"
                                                className="w-full p-3 rounded-xl bg-black/30 border border-emerald-500/30 text-white outline-none focus:border-emerald-400 font-bold text-lg"
                                            />
                                            <span className="text-emerald-400 font-bold">%</span>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2">
                                            <input
                                                type="number"
                                                value={issuePrice}
                                                onChange={(e) => setIssuePrice(e.target.value)}
                                                placeholder="Issue Px"
                                                className="w-1/2 p-3 rounded-xl bg-black/30 border border-emerald-500/30 text-white outline-none focus:border-emerald-400 text-sm"
                                            />
                                            <input
                                                type="number"
                                                value={listingPrice}
                                                onChange={(e) => setListingPrice(e.target.value)}
                                                placeholder="List Px"
                                                className="w-1/2 p-3 rounded-xl bg-black/30 border border-emerald-500/30 text-white outline-none focus:border-emerald-400 font-bold text-lg"
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="md:col-span-1 space-y-2">
                                    <div className="px-3 py-2 bg-emerald-500/20 rounded-xl border border-emerald-500/30 text-right">
                                        <span className="text-[10px] uppercase text-emerald-300 block">Net Profit</span>
                                        <span className="text-emerald-100 font-mono font-bold text-lg">+{formatCurrency(previewProfit)}</span>
                                    </div>
                                    <button
                                        onClick={handleRealizeGains}
                                        disabled={!selectedIPO || isSyncing || (listingMode === 'PERCENT' && !listingGainPct) || (listingMode === 'PRICE' && (!listingPrice || !issuePrice))}
                                        className="w-full py-3 bg-white text-emerald-900 font-bold rounded-xl hover:bg-emerald-50 transition-colors shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {isSyncing ? <RefreshCw className="animate-spin" size={18} /> : <Wallet size={18} />}
                                        Realize
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-emerald-500/20 border border-emerald-500/50 rounded-xl p-6 text-center animate-in zoom-in">
                                <CheckCircle2 size={48} className="text-emerald-400 mx-auto mb-2" />
                                <h3 className="text-xl font-bold text-white">Gains Secured!</h3>
                                <p className="text-emerald-200">Profit added to portfolio. Applications archived.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">

                {/* VISUALIZER: CAPITAL STACK */}
                <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-end mb-3">
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                                <BarChart4 size={14} /> Capital Stack
                            </p>
                            <p className="text-sm font-medium text-slate-400 mt-0.5">
                                Total Liquidity: <span className="text-slate-900 dark:text-white font-mono font-bold">{formatCurrency(totalCash)}</span>
                            </p>
                        </div>
                        <div className="text-right">
                            <p className={`text-sm font-mono font-bold ${isCapitalDanger ? 'text-rose-500' : 'text-emerald-500'}`}>
                                {formatCurrency(availableCapital)}
                            </p>
                            <p className="text-xs uppercase font-bold text-slate-400">Available</p>
                        </div>
                    </div>

                    <div className="w-full h-8 bg-slate-200 dark:bg-slate-800 rounded-lg overflow-hidden flex shadow-inner relative">
                        {stackData.map((item, idx) => {
                            const width = (item.amount / displayTotal) * 100;
                            return (
                                <div
                                    key={item.name}
                                    className={`h-full ${STACK_COLORS[idx % STACK_COLORS.length]} border-r border-slate-900/10 flex items-center justify-center text-[10px] font-bold text-white whitespace-nowrap overflow-hidden transition-all hover:opacity-90`}
                                    style={{ width: `${width}%` }}
                                    title={`${item.name}: ${formatCurrency(item.amount)}`}
                                >
                                    {width > 10 && `${item.name}`}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Add Application Form */}
                <form onSubmit={handleAdd} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
                        <div className="md:col-span-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">IPO Name</label>
                            <input
                                placeholder="e.g. NTPC Green"
                                value={formData.ipoName || ''}
                                onChange={e => setFormData({ ...formData, ipoName: e.target.value })}
                                className="w-full p-2 rounded-xl border bg-white dark:bg-slate-900 dark:border-slate-700 text-xs outline-none focus:border-indigo-500"
                            />
                        </div>
                        <div className="md:col-span-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Applicant</label>
                            <AutocompleteInput
                                ref={applicantInputRef}
                                placeholder="e.g. Self/Wife"
                                value={formData.applicantName || ''}
                                onChange={val => setFormData({ ...formData, applicantName: val })}
                                options={pastApplicants}
                                className="w-full p-2 rounded-xl border bg-white dark:bg-slate-900 dark:border-slate-700 text-xs outline-none focus:border-indigo-500"
                            />
                        </div>
                        <div className="md:col-span-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">UPI ID</label>
                            <AutocompleteInput
                                placeholder="e.g. mobile@ybl"
                                value={formData.upiHandle || ''}
                                onChange={val => setFormData({ ...formData, upiHandle: val })}
                                options={pastUPIs}
                                className="w-full p-2 rounded-xl border bg-white dark:bg-slate-900 dark:border-slate-700 text-xs outline-none focus:border-indigo-500"
                            />
                        </div>
                        <div className="md:col-span-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Amount (₹)</label>
                            <input
                                type="number"
                                placeholder="15000"
                                value={formData.amount || ''}
                                onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                                className="w-full p-2 rounded-xl border bg-white dark:bg-slate-900 dark:border-slate-700 text-xs outline-none focus:border-indigo-500"
                            />
                        </div>
                        <div className="md:col-span-1">
                            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2 text-xs font-bold flex items-center justify-center gap-2">
                                <Plus size={14} /> Add Application
                            </button>
                        </div>
                    </div>
                    {formError && <p className="text-xs text-rose-500 font-bold">{formError}</p>}
                </form>

                {/* Active Syndicate Table */}
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
                                {activeApplications.length === 0 && (
                                    <tr><td colSpan={5} className="text-center py-6 text-slate-400 text-xs">No active syndicate applications.</td></tr>
                                )}

                                {viewMode === 'LIST' ? (
                                    activeApplications.map(app => (
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
                                        // Count status
                                        const allottedCount = apps.filter(a => a.status === 'ALLOTTED').length;

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

                {/* Archived / Listed History */}
                {listedApps.length > 0 && (
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
                )}
            </div>
        </div>
    );
};

const StatusBadge = ({ status }: { status: string }) => (
    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${status === 'BLOCKED' ? 'bg-amber-100 text-amber-600 border-amber-200' :
        status === 'ALLOTTED' ? 'bg-emerald-100 text-emerald-600 border-emerald-200' :
            'bg-slate-100 text-slate-500 border-slate-200'
        }`}>
        {status}
    </span>
);

const ActionButtons = ({ app, updateStatus, deleteApp }: any) => (
    <>
        {app.status === 'BLOCKED' && (
            <>
                <button
                    onClick={() => updateStatus(app.id!, 'REFUNDED')}
                    className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
                    title="Mark Refunded"
                >
                    <RefreshCw size={14} />
                </button>
                <button
                    onClick={() => updateStatus(app.id!, 'ALLOTTED')}
                    className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Mark Allotted"
                >
                    <ShieldCheck size={14} />
                </button>
            </>
        )}
        <button onClick={() => deleteApp(app.id!)} className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors">
            <Trash2 size={14} />
        </button>
    </>
);

const AutocompleteInput = React.forwardRef<HTMLInputElement, {
    value: string;
    onChange: (val: string) => void;
    placeholder: string;
    options: string[];
    className?: string;
}>(({ value, onChange, placeholder, options, className }, ref) => {
    const [show, setShow] = useState(false);

    // Filter options based on input
    const filtered = options.filter(opt =>
        opt.toLowerCase().includes(value.toLowerCase()) && opt.toLowerCase() !== value.toLowerCase()
    );

    return (
        <div className="relative">
            <input
                ref={ref}
                type="text"
                value={value}
                onChange={(e) => {
                    onChange(e.target.value);
                    setShow(true);
                }}
                onFocus={() => setShow(true)}
                // Delay blur to allow clicking the item
                onBlur={() => setTimeout(() => setShow(false), 200)}
                placeholder={placeholder}
                className={className}
                autoComplete="off"
            />
            {show && filtered.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-40 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                    {filtered.map(opt => (
                        <div
                            key={opt}
                            className="px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer font-medium border-b last:border-0 border-slate-100 dark:border-slate-800/50"
                            onClick={() => {
                                onChange(opt);
                                setShow(false);
                            }}
                        >
                            {opt}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
});

export default SyndicateTracker;
