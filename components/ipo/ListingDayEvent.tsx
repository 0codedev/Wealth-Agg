import React from 'react';
import { Rocket, RefreshCw, Wallet, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';

interface ListingDayEventProps {
    availableForListing: string[];
    syncSuccess: boolean;
    selectedIPO: string;
    setSelectedIPO: (val: string) => void;
    listingMode: 'PERCENT' | 'PRICE';
    setListingMode: (val: 'PERCENT' | 'PRICE') => void;
    listingGainPct: string;
    setListingGainPct: (val: string) => void;
    listingPrice: string;
    setListingPrice: (val: string) => void;
    issuePrice: string;
    setIssuePrice: (val: string) => void;
    previewProfit: number;
    handleRealizeGains: () => void;
    isSyncing: boolean;
}

export const ListingDayEvent = React.memo(({
    availableForListing, syncSuccess, selectedIPO, setSelectedIPO,
    listingMode, setListingMode, listingGainPct, setListingGainPct,
    listingPrice, setListingPrice, issuePrice, setIssuePrice,
    previewProfit, handleRealizeGains, isSyncing
}: ListingDayEventProps) => {
    if (availableForListing.length === 0) return null;

    return (
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
    );
});
