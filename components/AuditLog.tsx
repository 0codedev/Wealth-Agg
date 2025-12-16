import React from 'react';
import { FileText, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

interface AuditEvent {
    id: number;
    type: 'TAX_HARVEST' | 'WASH_SALE' | 'LTCG_ALERT' | 'SYSTEM';
    message: string;
    timestamp: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

const MOCK_AUDIT_LOG: AuditEvent[] = [
    { id: 1, type: 'SYSTEM', message: 'Compliance Engine Initialized v2.4', timestamp: '2024-10-24 09:00', severity: 'LOW' },
    { id: 2, type: 'LTCG_ALERT', message: 'Realized LTCG crossed ₹1L threshold', timestamp: '2024-11-02 14:30', severity: 'MEDIUM' },
    { id: 3, type: 'WASH_SALE', message: 'Potential Wash Sale detected on ADANIENT', timestamp: '2024-11-15 11:15', severity: 'HIGH' },
    { id: 4, type: 'TAX_HARVEST', message: 'Harvested ₹12,000 loss in TATAMOTORS', timestamp: '2024-12-01 10:00', severity: 'LOW' },
];

const AuditLog: React.FC = () => {
    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <FileText size={20} className="text-indigo-500" /> Compliance Audit Log
                </h3>
                <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-500 font-mono">
                    FY 2024-25
                </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {MOCK_AUDIT_LOG.map((event) => (
                    <div key={event.id} className="flex gap-4 relative">
                        {/* Timeline Line */}
                        <div className="absolute left-[19px] top-8 bottom-[-16px] w-0.5 bg-slate-100 dark:bg-slate-800 last:hidden"></div>

                        <div className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center border-4 border-white dark:border-slate-900 z-10 
                            ${event.severity === 'HIGH' ? 'bg-rose-100 text-rose-500' :
                                event.severity === 'MEDIUM' ? 'bg-amber-100 text-amber-500' :
                                    'bg-slate-100 text-slate-500'}`}>
                            {event.severity === 'HIGH' ? <AlertTriangle size={18} /> :
                                event.severity === 'MEDIUM' ? <Clock size={18} /> :
                                    <CheckCircle2 size={18} />}
                        </div>

                        <div className="flex-1 pb-4">
                            <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                                <div className="flex justify-between items-start mb-1">
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider 
                                        ${event.type === 'WASH_SALE' ? 'bg-rose-100 text-rose-600' :
                                            event.type === 'LTCG_ALERT' ? 'bg-amber-100 text-amber-600' :
                                                'bg-slate-200 text-slate-600'}`}>
                                        {event.type.replace('_', ' ')}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-mono">{event.timestamp}</span>
                                </div>
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    {event.message}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AuditLog;
