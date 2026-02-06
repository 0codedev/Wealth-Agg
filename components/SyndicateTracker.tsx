
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useToast } from './shared/ToastProvider';
import { db, IPOApplication } from '../database';
import { Investment, InvestmentType } from '../types';
import { Users, RefreshCw, ShieldCheck, Plus, Trash2, BarChart4, Rocket, CheckCircle2, ArrowRight, Wallet, ChevronDown, ChevronRight, LayoutList, GripVertical } from 'lucide-react';
import { formatCurrency } from '../utils/helpers';
import {
    ListingDayEvent, CapitalStack, SyndicateForm, SyndicateTable, ArchivedList, AutocompleteInput, StatusBadge, ActionButtons
} from './ipo';
import { IPOCalendarWidget } from './market/IPOCalendarWidget';
import { IPOVaultWidget } from './market/IPOVaultWidget';

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

    // Vault Integration
    const friends = useLiveQuery(() => db.friends.toArray());

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
    // USER REQUEST: Include LISTED (Realized) apps in the main list.
    const displayApplications = applications;

    // Capital stats should exclude LISTED (Realized) as that money is liquid again
    const capitalApps = applications.filter(app => app.status !== 'LISTED');
    const totalActiveCapital = capitalApps.reduce((acc, curr) => acc + curr.amount, 0);

    // Fix: Use totalActiveCapital as fallback for displayTotal to prevent NaN/Overflow if totalCash is 0 or < active amount
    const displayTotal = Math.max(totalCash || 0, totalActiveCapital);
    const availableCapital = totalCash - blockedCapital;
    const isCapitalDanger = availableCapital < 0;

    const groupedApps = useMemo(() => {
        const groups: Record<string, IPOApplication[]> = {};
        displayApplications.forEach(app => { // Use displayApplications (ALL) for list
            if (!groups[app.ipoName]) groups[app.ipoName] = [];
            groups[app.ipoName].push(app);
        });
        return groups;
    }, [displayApplications]);

    // Stack Visualizer Data (Should ONLY show Active/Blocked capital, not realized)
    const stackData = useMemo(() => {
        const activeGroups: Record<string, IPOApplication[]> = {};
        capitalApps.forEach(app => {
            if (!activeGroups[app.ipoName]) activeGroups[app.ipoName] = [];
            activeGroups[app.ipoName].push(app);
        });

        return Object.entries(activeGroups).map(([name, apps]) => ({
            name,
            amount: apps.reduce((acc, curr) => acc + curr.amount, 0),
            count: apps.length
        })).sort((a, b) => b.amount - a.amount);
    }, [capitalApps]);

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

    // Vault: Filter friends with enough balance (optional visual cue, logic is strict)
    const activeFriends = useMemo(() => friends || [], [friends]);

    const pastUPIs = useMemo(() => Array.from(new Set(applications.map(a => a.upiHandle).filter(Boolean))), [applications]);

    const STACK_COLORS = ['bg-emerald-500', 'bg-blue-500', 'bg-amber-500', 'bg-rose-500', 'bg-indigo-500', 'bg-teal-500', 'bg-orange-500'];


    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.applicantName || !formData.ipoName || !formData.upiHandle || !formData.amount) {
            setFormError("All fields required");
            return;
        }

        // Duplicate checks removed for faster bulk entry as per user request


        // VAULT LOGIC: Auto-Debit
        const friend = friends?.find(f => f.name === formData.applicantName);
        if (friend) {
            if (friend.balance < (formData.amount || 0)) {
                if (!confirm(`⚠️ LOW BALANCE: ${friend.name} has only ₹${formatCurrency(friend.balance)}. Proceed anyway (negative balance)?`)) {
                    return;
                }
            }

            // Debit
            const newBalance = friend.balance - (formData.amount || 0);
            await db.friends.update(friend.id!, {
                balance: newBalance,
                history: [
                    ...(friend.history || []),
                    {
                        date: new Date().toISOString(),
                        amount: formData.amount || 0,
                        type: 'BLOCKED',
                        notes: `Applied for ${formData.ipoName}`
                    }
                ]
            });
            toast.success(`Debited ₹${formData.amount} from ${friend.name}'s Vault`);
        }

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

    const updateStatus = useCallback(async (id: number, status: IPOApplication['status']) => {
        // Vault Logic: Handle Refunds/Revocations
        const app = await db.ipo_applications.get(id);
        if (app) {
            // Determine if money should be returned
            const isRefund = status === 'REFUNDED' || status === 'Revoked' as any; // Handle loose typing if needed
            const wasBlockedOrAllotted = app.status === 'BLOCKED' || app.status === 'ALLOTTED';

            if (isRefund && wasBlockedOrAllotted) {
                const friend = (await db.friends.toArray()).find(f => f.name === app.applicantName);
                if (friend) {
                    await db.friends.update(friend.id!, {
                        balance: friend.balance + app.amount,
                        history: [
                            ...(friend.history || []),
                            {
                                date: new Date().toISOString(),
                                amount: app.amount,
                                type: 'REFUND',
                                notes: `Refund/Revoke: ${app.ipoName}`
                            }
                        ]
                    });
                    toast.success(`Refunded ₹${app.amount} to ${friend.name}`);
                }
            }
        }

        await db.ipo_applications.update(id, { status });
        loadApplications();
    }, [toast]);

    const deleteApp = useCallback(async (id: number) => {
        await db.ipo_applications.delete(id);
        loadApplications();
    }, []);

    const toggleGroup = useCallback((ipoName: string) => {
        setExpandedGroups(prev =>
            prev.includes(ipoName) ? prev.filter(n => n !== ipoName) : [...prev, ipoName]
        );
    }, []);

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

            // 3. Archive Applications (Mark as LISTED) & Credit Vault
            const updatePromises = allottedApps.map(async (app) => {
                // Vault Credit Logic
                const friend = (await db.friends.toArray()).find(f => f.name === app.applicantName);
                if (friend) {
                    const totalReturn = app.amount + (app.amount * calculatedGainMultiplier);
                    const profitAmount = app.amount * calculatedGainMultiplier;

                    await db.friends.update(friend.id!, {
                        balance: friend.balance + totalReturn,
                        totalProfits: (friend.totalProfits || 0) + profitAmount,
                        history: [
                            ...(friend.history || []),
                            {
                                date: new Date().toISOString(),
                                amount: totalReturn,
                                type: 'PROFIT',
                                notes: `Listing Gain: ${app.ipoName} (+₹${profitAmount.toFixed(0)})`
                            }
                        ]
                    });
                }
                return db.ipo_applications.update(app.id!, { status: 'LISTED' });
            });
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
            {/* LISTING DAY SIMULATOR */}
            <ListingDayEvent
                availableForListing={availableForListing}
                syncSuccess={syncSuccess}
                selectedIPO={selectedIPO}
                setSelectedIPO={setSelectedIPO}
                listingMode={listingMode}
                setListingMode={setListingMode}
                listingGainPct={listingGainPct}
                setListingGainPct={setListingGainPct}
                listingPrice={listingPrice}
                setListingPrice={setListingPrice}
                issuePrice={issuePrice}
                setIssuePrice={setIssuePrice}
                previewProfit={previewProfit}
                handleRealizeGains={handleRealizeGains}
                isSyncing={isSyncing}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="lg:col-span-2">
                    <IPOCalendarWidget />
                </div>
                <div className="lg:col-span-1 h-[500px]">
                    <IPOVaultWidget />
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">

                {/* VISUALIZER: CAPITAL STACK */}
                <CapitalStack
                    totalCash={totalCash}
                    availableCapital={availableCapital}
                    displayTotal={displayTotal}
                    isCapitalDanger={isCapitalDanger}
                    stackData={stackData}
                />

                {/* Add Application Form */}
                <SyndicateForm
                    formData={formData}
                    setFormData={setFormData}
                    handleAdd={handleAdd}
                    formError={formError}
                    applicantInputRef={applicantInputRef}
                    pastApplicants={pastApplicants}
                    pastUPIs={pastUPIs}
                    setFormError={setFormError}
                />

                {/* Active Syndicate Table */}
                <SyndicateTable
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    displayApplications={displayApplications}
                    groupedApps={groupedApps}
                    expandedGroups={expandedGroups}
                    toggleGroup={toggleGroup}
                    updateStatus={updateStatus}
                    deleteApp={deleteApp}
                />

                {/* Archived / Listed History */}
                <ArchivedList
                    listedApps={listedApps}
                    realizedGains={realizedGains}
                />
            </div>
        </div>
    );
};

// Local components moved to ./ipo/index.ts

export default SyndicateTracker;
