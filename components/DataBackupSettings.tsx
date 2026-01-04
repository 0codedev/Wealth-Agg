
import React, { useRef, useState } from 'react';
import { HardDrive, Download, Upload, Loader2, CheckCircle, AlertTriangle, RefreshCw, X, ShieldAlert } from 'lucide-react';
import * as BackupService from '../services/BackupService';
import CloudSyncPanel from './settings/CloudSyncPanel';

interface DataBackupSettingsProps {
  onDataRestored?: () => void;
  onImport?: (data: any) => Promise<void>;
  collapsed?: boolean;
}

const DataBackupSettings: React.FC<DataBackupSettingsProps> = ({ onDataRestored, onImport, collapsed = false }) => {
  const [status, setStatus] = useState<'IDLE' | 'PROCESSING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [message, setMessage] = useState<string | null>(null);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setStatus('PROCESSING');
    setMessage('Packaging...');
    try {
      await BackupService.handleDownloadBackup();
      setStatus('SUCCESS');
      setMessage('Done');
      setTimeout(() => {
        setStatus('IDLE');
        setMessage(null);
      }, 3000);
    } catch (e) {
      setStatus('ERROR');
      setMessage('Failed');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRestoreFile(file);
    setShowConfirmModal(true);
    // Reset input so the same file can be selected again if needed
    e.target.value = '';
  };

  const executeRestore = async () => {
    if (!restoreFile) return;

    setShowConfirmModal(false);
    setStatus('PROCESSING');
    setMessage('Restoring...');
    console.log("[RESTORE UI] Starting restore process for:", restoreFile.name);

    try {
      const text = await restoreFile.text();
      const json = JSON.parse(text);
      console.log("[RESTORE UI] JSON parsed successfully");

      if (onImport) {
        console.log("[RESTORE UI] Using onImport strategy");
        await onImport(json);
      } else {
        console.log("[RESTORE UI] Using BackupService strategy");
        await BackupService.restoreFromJSON(json);
      }

      console.log("[RESTORE UI] Restore complete");
      setStatus('SUCCESS');
      setMessage('Reloading...');

      if (onDataRestored) await onDataRestored();

      // Give extra time for IndexedDB to commit before reload
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (err: any) {
      console.error("[RESTORE UI] Restore Error:", err);
      setStatus('ERROR');
      setMessage('Failed');

      setTimeout(() => {
        setStatus('IDLE');
        setMessage(null);
      }, 5000);
    } finally {
      setRestoreFile(null);
    }
  };

  if (collapsed) {
    return (
      <div className="flex justify-center p-2">
        <div className="p-2 bg-slate-800 rounded-lg text-slate-400" title="Data Management">
          <HardDrive size={20} />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`rounded-lg p-3 border transition-all duration-300 ${status === 'PROCESSING' ? 'bg-indigo-900/20 border-indigo-500 ring-1 ring-indigo-500/50' : 'bg-slate-950 border-slate-800'}`}>
        {/* Row 1: Heading */}
        <div className="flex items-center gap-2 mb-2 text-slate-400">
          <HardDrive size={12} className="text-indigo-500" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Data Management</span>
        </div>

        {/* Row 2: Actions */}
        {status === 'IDLE' ? (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleExport}
              className="bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white py-1.5 px-2 rounded-md text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all border border-slate-800 hover:border-slate-600"
            >
              <Download size={12} className="text-indigo-500" />
              Backup
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white py-1.5 px-2 rounded-md text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all border border-slate-800 hover:border-slate-600"
            >
              <Upload size={12} className="text-emerald-500" />
              Restore
            </button>
          </div>
        ) : (
          <div className={`py-1.5 px-3 rounded-md border flex items-center justify-center gap-2 animate-in fade-in duration-200
              ${status === 'SUCCESS' ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-400' :
              status === 'ERROR' ? 'bg-rose-950/30 border-rose-500/50 text-rose-400' :
                'bg-indigo-950/30 border-indigo-500/50 text-indigo-300'}`}>

            {status === 'PROCESSING' && <RefreshCw size={12} className="animate-spin" />}
            {status === 'SUCCESS' && <CheckCircle size={12} />}
            {status === 'ERROR' && <AlertTriangle size={12} />}

            <span className="text-[10px] font-bold uppercase">{message}</span>
          </div>
        )}

        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".json"
          onChange={handleFileSelect}
          disabled={status === 'PROCESSING'}
        />
      </div>

      {/* Cloud Sync Section */}
      <div className="mt-3">
        <CloudSyncPanel onRestoreComplete={onDataRestored} />
      </div>

      {/* Restore Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-rose-900/30 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldAlert size={24} />
              </div>

              <h3 className="text-lg font-bold text-white mb-2">
                Nuclear Restore?
              </h3>

              <p className="text-slate-400 text-sm mb-6">
                You are about to restore <span className="text-white font-mono bg-slate-800 px-1 rounded">{restoreFile?.name}</span>.
                <br /><br />
                <span className="text-rose-400 font-bold">WARNING:</span> This will <span className="underline decoration-rose-500 decoration-2 underline-offset-2">permanently wipe</span> all current data and replace it with this backup.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => { setShowConfirmModal(false); setRestoreFile(null); }}
                  className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={executeRestore}
                  className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-rose-900/20 transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw size={16} /> Restore Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DataBackupSettings;
