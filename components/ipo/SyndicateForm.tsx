import React from 'react';
import { Plus } from 'lucide-react';
import { AutocompleteInput } from './AutocompleteInput';
import { IPOApplication } from '../../database';

interface SyndicateFormProps {
    formData: Partial<IPOApplication>;
    setFormData: (data: Partial<IPOApplication>) => void;
    handleAdd: (e: React.FormEvent) => void;
    formError: string | null;
    applicantInputRef: React.RefObject<HTMLInputElement>;
    pastApplicants: string[];
    pastUPIs: string[];
    setFormError: (error: string | null) => void; // Added implicitly by original usage
}

export const SyndicateForm = React.memo(({
    formData, setFormData, handleAdd, formError, applicantInputRef, pastApplicants, pastUPIs
}: SyndicateFormProps) => {
    return (
        <form onSubmit={handleAdd} className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-3">
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
    );
});
