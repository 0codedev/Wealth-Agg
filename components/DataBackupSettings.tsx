import React, { useRef, useState } from 'react';
import { HardDrive, Download, Upload, Loader2, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import * as BackupService from '../services/BackupService';

interface DataBackupSettingsProps {
  onDataRestored?: () => void;
}

const DataBackupSettings: React.FC<DataBackupSettingsProps> = ({ onDataRestored }) => {
  const [status, setStatus] = useState<'IDLE' | 'PROCESSING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [message, setMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setStatus('PROCESSING');
    setMessage('Packaging data...');
    try {
      await BackupService.handleDownloadBackup();
      setStatus('SUCCESS');
      setMessage('Download started');
      setTimeout(() => {
        setStatus('IDLE');
        setMessage(null);
      }, 3000);
    } catch (e) {
      setStatus('ERROR');
      setMessage('Export failed');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Explicit confirmation dialog
    if (!window.confirm("⚠️ WARNING: NUCLEAR RESTORE\n\nThis will completely WIPE your current database and replace it with this backup.\n\nAre you sure you want to proceed?")) {
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
    }

    setStatus('PROCESSING');
    setMessage('Wiping Database & Restoring...');

    try {
        const text = await file.text();
        const json = JSON.parse(text);

        // Perform Restore
        await BackupService.restoreFromJSON(json);

        setStatus('SUCCESS');
        setMessage('Restore Complete. Rebooting...');
        
        // Trigger React update if provided (though we reload anyway)
        if (onDataRestored) {
            await onDataRestored();
        }

        // FORCE RELOAD to ensure clean state
        setTimeout(() => {
            window.location.reload();
        }, 1500);

    } catch (err: any) {
        console.error("Restore Error:", err);
        setStatus('ERROR');
        setMessage('Restore Failed: ' + (err.message || 'Unknown Error'));
        if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`rounded-xl p-4 border transition-all duration-300 ${status === 'PROCESSING' ? 'bg-indigo-900/20 border-indigo-500 ring-2 ring-indigo-500/50' : 'bg-slate-950 border-slate-800'}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider">
            <HardDrive size={14} /> Data Management
        </div>
        {status === 'IDLE' && (
            <span className="text-[9px] text-slate-600 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                System v5.0
            </span>
        )}
      </div>

      {status === 'IDLE' ? (
        <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleExport}
              className="bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white py-3 px-3 rounded-lg text-xs font-bold flex flex-col items-center justify-center gap-2 transition-all border border-slate-800 hover:border-slate-600 group"
            >
              <Download size={16} className="text-indigo-500 group-hover:scale-110 transition-transform"/>
              <span>Backup</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white py-3 px-3 rounded-lg text-xs font-bold flex flex-col items-center justify-center gap-2 transition-all border border-slate-800 hover:border-slate-600 group"
            >
              <Upload size={16} className="text-emerald-500 group-hover:scale-110 transition-transform"/>
              <span>Restore</span>
            </button>
        </div>
      ) : (
        <div className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center gap-2 min-h-[80px] animate-in fade-in zoom-in duration-200
            ${status === 'SUCCESS' ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-400' : 
              status === 'ERROR' ? 'bg-rose-950/30 border-rose-500/50 text-rose-400' : 
              'bg-indigo-950/30 border-indigo-500/50 text-indigo-300'}`}>
            
            { status === 'PROCESSING' && <RefreshCw size={24} className="animate-spin mb-1"/> }
            { status === 'SUCCESS' && <CheckCircle size={24} className="mb-1"/> }
            { status === 'ERROR' && <AlertTriangle size={24} className="mb-1"/> }
            
            <span className="text-xs font-bold uppercase tracking-wide">{message}</span>
        </div>
      )}

      {/* 
          CRITICAL: onClick resets value to allow re-selecting the same file. 
          This fixes the "Nothing happening" bug.
      */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".json"
        onClick={(e) => (e.currentTarget.value = '')} 
        onChange={handleFileChange}
        disabled={status === 'PROCESSING'}
      />
    </div>
  );
};

export default DataBackupSettings;