
import React, { useState, useEffect, useMemo } from 'react';
import { db, IPOApplication } from '../database';
import { Investment, InvestmentType } from '../types';
import { Users, RefreshCw, ShieldCheck, Plus, Trash2, BarChart4, Rocket, CheckCircle2, ArrowRight, Wallet } from 'lucide-react';
import { formatCurrency } from '../App';

interface SyndicateTrackerProps {
  totalCash: number;
  onPortfolioRefresh?: () => void;
  onDataChange?: () => void;
}

const SyndicateTracker: React.FC<SyndicateTrackerProps> = ({ totalCash, onPortfolioRefresh, onDataChange }) => {
  const [applications, setApplications] = useState<IPOApplication[]>([]);
  const [formData, setFormData] = useState<Partial<IPOApplication>>({
    status: 'BLOCKED',
    amount: 15000,
    appliedDate: new Date().toISOString().split('T')[0]
  });
  const [formError, setFormError] = useState<string | null>(null);

  // Listing Day Logic State
  const [selectedIPO, setSelectedIPO] = useState<string>('');
  const [listingGainPct, setListingGainPct] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    const data = await db.ipo_applications.toArray();
    setApplications(data);
    if (onDataChange) onDataChange(); // Notify parent that data changed
  };

  const blockedCapital = applications
    .filter(app => app.status === 'BLOCKED')
    .reduce((acc, curr) => acc + curr.amount, 0);
  
  const displayTotal = Math.max(totalCash, blockedCapital);
  const availableCapital = totalCash - blockedCapital;
  const isCapitalDanger = availableCapital < 0;

  // Group active applications for Stack Visualizer
  const stackData = applications
    .filter(app => app.status === 'BLOCKED')
    .reduce((acc, curr) => {
        const existing = acc.find(i => i.name === curr.ipoName);
        if (existing) {
            existing.amount += curr.amount;
            existing.count += 1;
        } else {
            acc.push({ name: curr.ipoName, amount: curr.amount, count: 1 });
        }
        return acc;
    }, [] as { name: string, amount: number, count: number }[]);

  // Unique IPOs available for listing (must have at least one ALLOTTED)
  const availableForListing = useMemo(() => {
      const allottedNames = new Set(
          applications
            .filter(app => app.status === 'ALLOTTED')
            .map(app => app.ipoName)
      );
      return Array.from(allottedNames);
  }, [applications]);

  const STACK_COLORS = ['bg-indigo-500', 'bg-purple-500', 'bg-cyan-500', 'bg-fuchsia-500'];

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.applicantName || !formData.ipoName || !formData.upiHandle || !formData.amount) {
        setFormError("All fields required");
        return;
    }

    const hasDuplicateHandle = applications.some(
        app => app.upiHandle.toLowerCase() === formData.upiHandle?.toLowerCase() && app.status === 'BLOCKED'
    );

    if (hasDuplicateHandle) {
        if (!confirm("WARNING: Mandate Fail Risk! This UPI Handle is already used in a blocked application. Proceed anyway?")) {
            return;
        }
    }

    await db.ipo_applications.add(formData as IPOApplication);
    setFormData({ 
        status: 'BLOCKED', 
        amount: 15000, 
        applicantName: '', 
        ipoName: formData.ipoName,
        upiHandle: '',
        appliedDate: new Date().toISOString().split('T')[0]
    });
    setFormError(null);
    loadApplications();
  };

  const updateStatus = async (id: number, status: IPOApplication['status']) => {
      await db.ipo_applications.update(id, { status });
      loadApplications();
  };

  const deleteApp = async (id: number) => {
      await db.ipo_applications.delete(id);
      loadApplications();
  };

  // --- LISTING DAY LOGIC ---
  const handleRealizeGains = async () => {
    if (!selectedIPO || !listingGainPct) return;
    setIsSyncing(true);

    // 1. Calculate stats
    const allottedApps = applications.filter(app => app.ipoName === selectedIPO && app.status === 'ALLOTTED');
    const totalInvested = allottedApps.reduce((acc, curr) => acc + curr.amount, 0);
    const gainMultiplier = parseFloat(listingGainPct) / 100;
    const profit = totalInvested * gainMultiplier;
    const totalCurrentValue = totalInvested + profit;

    try {
        // 2. Add to Main Portfolio
        const newInvestment: Investment = {
            id: crypto.randomUUID(),
            name: `IPO Gain: ${selectedIPO}`,
            type: InvestmentType.IPO,
            platform: 'Syndicate',
            investedAmount: totalInvested,
            currentValue: totalCurrentValue,
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
        }, 3000);

    } catch (err) {
        console.error(err);
        alert("Failed to sync with portfolio.");
        setIsSyncing(false);
    }
  };

  const calculatedProfit = useMemo(() => {
      if (!selectedIPO || !listingGainPct) return 0;
      const totalInvested = applications
        .filter(app => app.ipoName === selectedIPO && app.status === 'ALLOTTED')
        .reduce((acc, curr) => acc + curr.amount, 0);
      return totalInvested * (parseFloat(listingGainPct) / 100);
  }, [selectedIPO, listingGainPct, applications]);

  return (
    <div className="space-y-6 animate-in fade-in">
        
        {/* LISTING DAY SIMULATOR (Only shows if there are allotted IPOs) */}
        {availableForListing.length > 0 && (
            <div className="bg-gradient-to-r from-emerald-900 to-teal-900 border border-emerald-500/30 rounded-2xl p-6 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10">
                    <Rocket size={100} className="text-white"/>
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
                                    <option value="">-- Choose IPO --</option>
                                    {availableForListing.map(name => (
                                        <option key={name} value={name}>{name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="md:col-span-1">
                                <label className="block text-xs font-bold text-emerald-200 uppercase mb-1">Listing Gain %</label>
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
                            </div>

                            <div className="md:col-span-1">
                                <label className="block text-xs font-bold text-emerald-200 uppercase mb-1">Total Profit</label>
                                <div className="p-3 bg-emerald-500/20 rounded-xl border border-emerald-500/30 text-emerald-300 font-mono font-bold text-lg truncate">
                                    +{formatCurrency(calculatedProfit)}
                                </div>
                            </div>

                            <div className="md:col-span-1">
                                <button 
                                    onClick={handleRealizeGains}
                                    disabled={!selectedIPO || !listingGainPct || isSyncing}
                                    className="w-full py-3 bg-white text-emerald-900 font-bold rounded-xl hover:bg-emerald-50 transition-colors shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isSyncing ? <RefreshCw className="animate-spin" size={18}/> : <Wallet size={18}/>}
                                    Add to Portfolio
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-emerald-500/20 border border-emerald-500/50 rounded-xl p-6 text-center animate-in zoom-in">
                            <CheckCircle2 size={48} className="text-emerald-400 mx-auto mb-2"/>
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
                            <BarChart4 size={14}/> Capital Stack
                        </p>
                        <p className="text-sm font-medium text-slate-400 mt-0.5">
                            Total Liquidity: <span className="text-slate-900 dark:text-white font-mono font-bold">{formatCurrency(totalCash)}</span>
                        </p>
                    </div>
                    <div className="text-right">
                        <p className={`text-sm font-mono font-bold ${isCapitalDanger ? 'text-rose-500' : 'text-emerald-500'}`}>
                            {formatCurrency(availableCapital)}
                        </p>
                        <p className="text-[10px] uppercase font-bold text-slate-400">Dry Powder</p>
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
                
                <div className="flex flex-wrap gap-3 mt-3">
                    {stackData.map((item, idx) => (
                        <div key={item.name} className="flex items-center gap-1.5 text-xs">
                            <div className={`w-2 h-2 rounded-full ${STACK_COLORS[idx % STACK_COLORS.length]}`}></div>
                            <span className="text-slate-600 dark:text-slate-400">{item.name} ({item.count}x)</span>
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{formatCurrency(item.amount)}</span>
                        </div>
                    ))}
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
                            onChange={e => setFormData({...formData, ipoName: e.target.value})}
                            className="w-full p-2 rounded border bg-white dark:bg-slate-900 dark:border-slate-700 text-xs outline-none focus:border-indigo-500"
                        />
                    </div>
                    <div className="md:col-span-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Applicant</label>
                        <input 
                            placeholder="e.g. Self/Wife" 
                            value={formData.applicantName || ''}
                            onChange={e => setFormData({...formData, applicantName: e.target.value})}
                            className="w-full p-2 rounded border bg-white dark:bg-slate-900 dark:border-slate-700 text-xs outline-none focus:border-indigo-500"
                        />
                    </div>
                    <div className="md:col-span-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">UPI ID</label>
                        <input 
                            placeholder="e.g. mobile@ybl" 
                            value={formData.upiHandle || ''}
                            onChange={e => setFormData({...formData, upiHandle: e.target.value})}
                            className="w-full p-2 rounded border bg-white dark:bg-slate-900 dark:border-slate-700 text-xs outline-none focus:border-indigo-500"
                        />
                    </div>
                    <div className="md:col-span-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Amount (₹)</label>
                        <input 
                            type="number"
                            placeholder="15000" 
                            value={formData.amount || ''}
                            onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})}
                            className="w-full p-2 rounded border bg-white dark:bg-slate-900 dark:border-slate-700 text-xs outline-none focus:border-indigo-500"
                        />
                    </div>
                    <div className="md:col-span-1">
                        <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded py-2 text-xs font-bold flex items-center justify-center gap-2">
                            <Plus size={14}/> Add
                        </button>
                    </div>
                </div>
                {formError && <p className="text-xs text-rose-500 font-bold">{formError}</p>}
            </form>

            {/* Active Syndicate Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-100 dark:bg-slate-800/50">
                        <tr>
                            <th className="px-4 py-3 rounded-l-lg">Applicant</th>
                            <th className="px-4 py-3">IPO</th>
                            <th className="px-4 py-3">UPI</th>
                            <th className="px-4 py-3 text-right">Amount</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3 rounded-r-lg text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {applications.filter(app => app.status !== 'LISTED').length === 0 ? (
                            <tr><td colSpan={6} className="text-center py-4 text-slate-400 text-xs">No active syndicate applications.</td></tr>
                        ) : (
                            applications.filter(app => app.status !== 'LISTED').map(app => (
                                <tr key={app.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-white">{app.applicantName}</td>
                                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{app.ipoName}</td>
                                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{app.upiHandle}</td>
                                    <td className="px-4 py-3 font-mono text-xs text-slate-900 dark:text-white font-bold text-right">{formatCurrency(app.amount)}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                            app.status === 'BLOCKED' ? 'bg-amber-100 text-amber-600 border-amber-200' :
                                            app.status === 'ALLOTTED' ? 'bg-emerald-100 text-emerald-600 border-emerald-200' :
                                            'bg-slate-100 text-slate-500 border-slate-200'
                                        }`}>
                                            {app.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right flex items-center justify-end gap-2">
                                        {app.status === 'BLOCKED' && (
                                            <>
                                                <button 
                                                    onClick={() => updateStatus(app.id!, 'REFUNDED')}
                                                    className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded transition-colors"
                                                    title="Mark Refunded"
                                                >
                                                    <RefreshCw size={14} />
                                                </button>
                                                <button 
                                                    onClick={() => updateStatus(app.id!, 'ALLOTTED')}
                                                    className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded transition-colors"
                                                    title="Mark Allotted"
                                                >
                                                    <ShieldCheck size={14} />
                                                </button>
                                            </>
                                        )}
                                        <button onClick={() => deleteApp(app.id!)} className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors">
                                            <Trash2 size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Archived / Listed History */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Recent Listings (Archived)</h4>
                <div className="space-y-2 opacity-60">
                     {applications.filter(app => app.status === 'LISTED').slice(0, 5).map(app => (
                         <div key={app.id} className="flex justify-between items-center text-xs text-slate-400">
                             <span>{app.ipoName} ({app.applicantName})</span>
                             <span>{formatCurrency(app.amount)} - <span className="text-emerald-500">Realized</span></span>
                         </div>
                     ))}
                     {applications.filter(app => app.status === 'LISTED').length === 0 && (
                         <p className="text-xs text-slate-300 italic">No historical data.</p>
                     )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default SyndicateTracker;
