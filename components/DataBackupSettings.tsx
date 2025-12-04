
import React, { useRef, useState } from 'react';
import { HardDrive, Download, Upload, Loader2, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import * as BackupService from '../services/BackupService';

interface DataBackupSettingsProps {
  onDataRestored?: () => void;
}

const DataBackupSettings: React.FC<DataBackupSettingsProps> = () => {
  const [status, setStatus] = useState<'IDLE' | 'DOWNLOADING' | 'RESTORING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [message, setMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setStatus('DOWNLOADING');
    setMessage('Packaging data...');
    try {
      await BackupService.handleDownloadBackup();
      setStatus('SUCCESS');
      setMessage('Backup downloaded!');
      setTimeout(() => {
        setStatus('IDLE');
        setMessage(null);
      }, 3000);
    } catch (e) {
      setStatus('ERROR');
      setMessage('Export failed. Check console.');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset UI
    setStatus('IDLE');
    setMessage(null);

    // 1. Safety Confirm
    const confirmMsg = 
      "⚠️ NUCLEAR RESTORE PROTOCOL ⚠️\n\n" +
      "This will WIPE all current data and replace it with the backup.\n" +
      "The app will reload automatically upon success.\n\n" +
      "Are you absolutely sure?";

    if (!window.confirm(confirmMsg)) {
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
    }

    try {
        setStatus('RESTORING');
        setMessage('Reading file...');

        // 2. Read & Parse
        const text = await file.text();
        const parsed = JSON.parse(text);

        setMessage('Executing Atomic Transaction...');
        
        // 3. Set Safety Lock (prevents app form reading DB while we wipe it)
        sessionStorage.setItem('IS_RESTORING', 'true');

        // 4. Execute Service
        await BackupService.restoreBackupData(parsed);

        // 5. Success State
        setStatus('SUCCESS');
        setMessage('Restore Verified. Rebooting System...');
        
        // 6. Release Lock
        sessionStorage.removeItem('IS_RESTORING');

        // 7. FORCE RELOAD (The Nuclear Finish)
        // Give UI a moment to show success, then kill the app to ensure fresh state
        setTimeout(() => {
            window.location.reload();
        }, 1500);

    } catch (err: any) {
        console.error("Restore Critical Failure:", err);
        sessionStorage.removeItem('IS_RESTORING'); // Release lock on error so user isn't stuck
        setStatus('ERROR');
        setMessage(`Critical Error: ${err.message}`);
        
        // Clear input so they can try again
        if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const isProcessing = status === 'DOWNLOADING' || status === 'RESTORING';

  return (
    <div className="bg-slate-950 rounded-xl p-4 border border-slate-800">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider">
            <HardDrive size={14} /> Data Vault
        </div>
        {status === 'IDLE' && (
            <span className="text-[9px] text-slate-600 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                v3.0 Nuclear
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
            
            { isProcessing && <Loader2 size={24} className="animate-spin mb-1"/> }
            { status === 'SUCCESS' && <RefreshCw size={24} className="animate-spin mb-1"/> }
            { status === 'ERROR' && <AlertTriangle size={24} className="mb-1"/> }
            
            <span className="text-sm font-bold">{message}</span>
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".json"
        onChange={handleFileChange}
        disabled={isProcessing}
      />
    </div>
  );
};

export default DataBackupSettings;
