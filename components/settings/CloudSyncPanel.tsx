import React, { useState, useEffect } from 'react';
import { Cloud, CloudOff, RefreshCw, Download, Upload, Settings, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useSettingsStore } from '../../store/settingsStore';
import {
    initGoogleDrive,
    signInToGoogle,
    signOutFromGoogle,
    isSignedIn,
    uploadBackupToDrive,
    downloadBackupFromDrive,
    getLastBackupInfo
} from '../../services/GoogleDriveService';
import { handleDownloadBackup } from '../../services/BackupService';
import { db } from '../../database';

interface CloudSyncPanelProps {
    onRestoreComplete?: () => void;
}

const CloudSyncPanel: React.FC<CloudSyncPanelProps> = ({ onRestoreComplete }) => {
    const { googleDriveClientId, lastGoogleSyncTime, updateSetting } = useSettingsStore();

    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const [showSetup, setShowSetup] = useState(false);
    const [clientIdInput, setClientIdInput] = useState('');
    const [lastCloudBackup, setLastCloudBackup] = useState<string | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);

    // Sync clientIdInput with stored value (handles Zustand hydration)
    useEffect(() => {
        if (googleDriveClientId) {
            setClientIdInput(googleDriveClientId);
        }
    }, [googleDriveClientId]);

    // Show last sync time from settings
    useEffect(() => {
        if (lastGoogleSyncTime) {
            setLastCloudBackup(new Date(lastGoogleSyncTime).toLocaleString());
        }
    }, [lastGoogleSyncTime]);

    // Initialize Google Drive if client ID is saved
    useEffect(() => {
        const initDrive = async () => {
            if (googleDriveClientId && !isInitialized) {
                try {
                    await initGoogleDrive(googleDriveClientId);
                    setIsInitialized(true);
                    // Check if user is still signed in (tokens are in memory only)
                    setIsConnected(isSignedIn());
                    if (!isSignedIn()) {
                        setMessage('Client ID saved. Click "Connect" to sign in.');
                    }
                } catch (err) {
                    setMessage('Failed to initialize Google Drive');
                }
            }
        };
        initDrive();
    }, [googleDriveClientId, isInitialized]);

    const handleConnect = async () => {
        if (!googleDriveClientId) {
            setShowSetup(true);
            return;
        }

        setIsLoading(true);
        try {
            await initGoogleDrive(googleDriveClientId);
            await signInToGoogle();
            setIsConnected(true);
            setStatus('success');
            setMessage('Connected to Google Drive!');

            // Check for existing backup
            const info = await getLastBackupInfo();
            if (info.exists && info.modifiedTime) {
                setLastCloudBackup(new Date(info.modifiedTime).toLocaleString());
            }
        } catch (error: any) {
            setStatus('error');
            setMessage(error.message || 'Failed to connect');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDisconnect = () => {
        signOutFromGoogle();
        setIsConnected(false);
        setStatus('idle');
        setMessage('Disconnected from Google Drive');
    };

    const handleSaveClientId = () => {
        updateSetting('googleDriveClientId', clientIdInput);
        setShowSetup(false);
        setMessage('Client ID saved! Click "Connect" to sign in.');
    };

    const handleSyncToCloud = async () => {
        setIsLoading(true);
        setStatus('syncing');
        try {
            // Gather all data using existing backup logic
            const investments = await db.investments.toArray();
            const trades = await db.trades.toArray();
            const ipo_applications = await db.ipo_applications.toArray();

            const backupData = {
                version: '1.0',
                timestamp: new Date().toISOString(),
                investments,
                trades,
                ipo_applications,
            };

            const result = await uploadBackupToDrive(backupData);

            if (result.success) {
                setStatus('success');
                setMessage(result.message);
                updateSetting('lastGoogleSyncTime', new Date().toISOString());
                setLastCloudBackup(new Date().toLocaleString());
            } else {
                setStatus('error');
                setMessage(result.message);
            }
        } catch (error: any) {
            setStatus('error');
            setMessage(error.message || 'Sync failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePullFromCloud = async () => {
        setIsLoading(true);
        setStatus('syncing');
        try {
            const result = await downloadBackupFromDrive();

            if (result.success && result.data) {
                // Restore data to IndexedDB
                const data = result.data as any;

                if (data.investments) {
                    await db.investments.clear();
                    await db.investments.bulkAdd(data.investments);
                }
                if (data.trades) {
                    await db.trades.clear();
                    await db.trades.bulkAdd(data.trades);
                }
                if (data.ipo_applications) {
                    await db.ipo_applications.clear();
                    await db.ipo_applications.bulkAdd(data.ipo_applications);
                }

                setStatus('success');
                setMessage('Data restored from Google Drive! Refresh the page.');
                onRestoreComplete?.();
            } else {
                setStatus('error');
                setMessage(result.message);
            }
        } catch (error: any) {
            setStatus('error');
            setMessage(error.message || 'Pull failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${isConnected ? 'bg-emerald-950/50 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                        {isConnected ? <Cloud size={20} /> : <CloudOff size={20} />}
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white">Google Drive Sync</h3>
                        <p className="text-xs text-slate-500">
                            {isConnected ? 'Connected' : 'Not connected'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setShowSetup(!showSetup)}
                    className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                    <Settings size={16} />
                </button>
            </div>

            {/* Setup Panel */}
            {showSetup && (
                <div className="mb-4 p-4 bg-slate-950 rounded-xl border border-slate-700 space-y-3">
                    <p className="text-xs text-slate-400">
                        Enter your Google Cloud OAuth Client ID.
                        <a
                            href="https://console.cloud.google.com/apis/credentials"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:underline ml-1"
                        >
                            Get it here →
                        </a>
                    </p>
                    <input
                        type="text"
                        value={clientIdInput}
                        onChange={(e) => setClientIdInput(e.target.value)}
                        placeholder="xxxx.apps.googleusercontent.com"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-blue-500 outline-none"
                    />
                    <button
                        onClick={handleSaveClientId}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg"
                    >
                        Save Client ID
                    </button>
                </div>
            )}

            {/* Status Message */}
            {message && (
                <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-xs ${status === 'success' ? 'bg-emerald-950/30 text-emerald-400 border border-emerald-900/50' :
                    status === 'error' ? 'bg-red-950/30 text-red-400 border border-red-900/50' :
                        'bg-slate-800 text-slate-300'
                    }`}>
                    {status === 'success' && <CheckCircle size={14} />}
                    {status === 'error' && <AlertCircle size={14} />}
                    {status === 'syncing' && <Loader2 size={14} className="animate-spin" />}
                    {message}
                </div>
            )}

            {/* Connection Button */}
            {!isConnected ? (
                <button
                    onClick={handleConnect}
                    disabled={isLoading}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                    {isLoading ? (
                        <Loader2 size={18} className="animate-spin" />
                    ) : (
                        <>
                            <Cloud size={18} />
                            Connect Google Drive
                        </>
                    )}
                </button>
            ) : (
                <div className="space-y-3">
                    {/* Last Sync Info */}
                    {lastCloudBackup && (
                        <div className="text-xs text-slate-500 text-center">
                            Last cloud backup: {lastCloudBackup}
                        </div>
                    )}

                    {/* Sync Actions */}
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={handleSyncToCloud}
                            disabled={isLoading}
                            className="py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2"
                        >
                            {isLoading && status === 'syncing' ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <Upload size={16} />
                            )}
                            Sync to Cloud
                        </button>
                        <button
                            onClick={handlePullFromCloud}
                            disabled={isLoading}
                            className="py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2"
                        >
                            {isLoading && status === 'syncing' ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <Download size={16} />
                            )}
                            Pull from Cloud
                        </button>
                    </div>

                    {/* Disconnect */}
                    <button
                        onClick={handleDisconnect}
                        className="w-full py-2 text-xs text-slate-500 hover:text-red-400 transition-colors"
                    >
                        Disconnect Google Drive
                    </button>
                </div>
            )}
        </div>
    );
};

export default CloudSyncPanel;
