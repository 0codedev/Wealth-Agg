
import React, { useState, useEffect } from 'react';
import { Shield, Lock, Unlock, Key, FileText, AlertOctagon, Power, Clock, Eye, EyeOff, Save, Trash2, ShieldCheck, ShieldAlert } from 'lucide-react';
import { encryptData, decryptData, hashPassword } from '../../../utils/Encryption';

interface SecretNote {
    id: string;
    title: string;
    encryptedContent: string;
    date: string;
}

const FortressHub: React.FC = () => {
    // --- Security State ---
    const [isLocked, setIsLocked] = useState(true);
    const [masterPassword, setMasterPassword] = useState(''); // Current input
    const [storedHash, setStoredHash] = useState<string | null>(null); // Ideally from DB
    const [isSetupMode, setIsSetupMode] = useState(false);

    // --- Vault State ---
    const [notes, setNotes] = useState<SecretNote[]>([]); // Locally for now
    const [newNoteTitle, setNewNoteTitle] = useState('');
    const [newNoteContent, setNewNoteContent] = useState('');
    const [viewingNote, setViewingNote] = useState<string | null>(null); // ID of note being viewed

    // --- Dead Man's Switch ---
    const [dmsEnabled, setDmsEnabled] = useState(false);
    const [dmsTimer, setDmsTimer] = useState(30); // Days

    // --- Setup / Unlock Logic ---
    useEffect(() => {
        // Check if vault is already set up (mock logic using localStorage)
        const savedHash = localStorage.getItem('fortress_hash');
        if (savedHash) {
            setStoredHash(savedHash);
        } else {
            setIsSetupMode(true);
        }

        // Load notes
        const savedNotes = localStorage.getItem('fortress_notes');
        if (savedNotes) setNotes(JSON.parse(savedNotes));
    }, []);

    const handleUnlock = () => {
        if (!masterPassword) return;
        const inputHash = hashPassword(masterPassword);
        if (inputHash === storedHash) {
            setIsLocked(false);
            setMasterPassword(''); // Clear from memory
        } else {
            alert("ACCESS DENIED");
        }
    };

    const handleSetup = () => {
        if (!masterPassword) return;
        const h = hashPassword(masterPassword);
        localStorage.setItem('fortress_hash', h);
        setStoredHash(h);
        setIsSetupMode(false);
        setIsLocked(false);
        setMasterPassword('');
    };

    const handleAddNote = () => {
        // Mock Key for this session:
        const sessionKey = "SESSION_KEY_123"; // In prod, derive from password during unlock

        const encrypted = encryptData(newNoteContent, sessionKey);
        const newNote: SecretNote = {
            id: Date.now().toString(),
            title: newNoteTitle,
            encryptedContent: encrypted,
            date: new Date().toLocaleDateString()
        };

        const updated = [...notes, newNote];
        setNotes(updated);
        localStorage.setItem('fortress_notes', JSON.stringify(updated));
        setNewNoteTitle('');
        setNewNoteContent('');
        setViewingNote(null);
    };

    const getDecryptedContent = (note: SecretNote) => {
         const sessionKey = "SESSION_KEY_123";
         return decryptData(note.encryptedContent, sessionKey);
    };

    const deleteNote = (id: string) => {
        const updated = notes.filter(n => n.id !== id);
        setNotes(updated);
        localStorage.setItem('fortress_notes', JSON.stringify(updated));
    };


    // --- LOCK SCREEN ---
    if (isLocked) {
        return (
            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden group h-full min-h-[400px] flex flex-col items-center justify-center text-center">
                
                {/* Cyber Grid Background */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.05)_1px,transparent_1px)] bg-[size:40px_40px]"></div>

                <div className="relative z-10 space-y-6 max-w-sm w-full">
                    <div className="mx-auto w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center border-2 border-slate-700 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                        <Lock size={32} className="text-rose-500" />
                    </div>

                    <div>
                        <h2 className="text-3xl font-black text-white tracking-tighter mb-1">THE FORTRESS</h2>
                        <p className="text-xs font-mono text-slate-400 uppercase tracking-widest">
                            {isSetupMode ? "INITIALIZING SECURE PROTOCOLS..." : "LEGACY VAULT // ENCRYPTED"}
                        </p>
                    </div>

                    <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block text-left">
                            {isSetupMode ? "Create Master Key" : "Enter Master Key"}
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="password"
                                value={masterPassword}
                                onChange={e => setMasterPassword(e.target.value)}
                                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white font-mono text-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all placeholder:text-slate-700"
                                placeholder="••••••••••••"
                                onKeyDown={e => e.key === 'Enter' && (isSetupMode ? handleSetup() : handleUnlock())}
                            />
                            <button
                                onClick={isSetupMode ? handleSetup : handleUnlock}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white p-3 rounded-lg transition-colors shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                            >
                                {isSetupMode ? <Save size={20} /> : <Key size={20} />}
                            </button>
                        </div>
                        {isSetupMode && (
                            <p className="text-[10px] text-amber-500 mt-3 flex items-center gap-1">
                                <AlertOctagon size={12} /> WARNING: If you lose this key, data is lost forever.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // --- VAULT INTERFACE ---
    return (
        <div className="bg-slate-950 border border-emerald-900/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden h-full min-h-[500px] flex flex-col">
             {/* Header */}
             <div className="flex justify-between items-start mb-6 pb-6 border-b border-emerald-900/20">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-950/50 border border-emerald-900/50 text-emerald-400">
                        <ShieldCheck size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                            COMMAND CENTER
                            <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-900/30 text-emerald-400 border border-emerald-900/50 uppercase">Secured</span>
                        </h2>
                        <div className="flex items-center gap-4 text-xs font-mono text-emerald-600/60 mt-1">
                            <span>Last Access: {new Date().toLocaleTimeString()}</span>
                            <span>•</span>
                            <span>AES-256 Active</span>
                        </div>
                    </div>
                </div>
                <button 
                    onClick={() => setIsLocked(true)}
                    className="p-2 rounded-lg bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700"
                    title="Lock Vault"
                >
                    <Lock size={18} />
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
                
                {/* LEFT: DEAD MAN'S SWITCH */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-slate-900/50 rounded-2xl p-5 border border-slate-800">
                        <h3 className="text-xs font-bold text-slate-400 uppercase mb-4 flex items-center gap-2">
                            <ShieldAlert size={14} className={dmsEnabled ? "text-rose-500 animate-pulse" : "text-slate-600"} />
                            Dead Man's Switch
                        </h3>

                        <div className="flex items-center justify-between mb-6">
                            <span className="text-sm font-medium text-slate-200">Protocol Status</span>
                            <button
                                onClick={() => setDmsEnabled(!dmsEnabled)}
                                className={`w-12 h-6 rounded-full transition-colors relative ${dmsEnabled ? 'bg-rose-600' : 'bg-slate-700'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${dmsEnabled ? 'left-7' : 'left-1'}`}></div>
                            </button>
                        </div>

                        {dmsEnabled && (
                            <div className="animate-in fade-in slide-in-from-top-2">
                                <div className="mb-4">
                                    <label className="text-[10px] text-slate-500 font-bold uppercase block mb-2">Inactivity Trigger</label>
                                    <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-800">
                                        {[15, 30, 60].map(days => (
                                            <button
                                                key={days}
                                                onClick={() => setDmsTimer(days)}
                                                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${dmsTimer === days ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                                            >
                                                {days} Days
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="p-3 bg-rose-950/20 border border-rose-900/30 rounded-lg">
                                    <p className="text-[10px] text-rose-300 leading-relaxed">
                                        <AlertOctagon size={10} className="inline mr-1" />
                                        If inactive for {dmsTimer} days, "The Digital Will" key will be sent to verified beneficiaries.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bg-slate-900/30 rounded-2xl p-5 border border-slate-800/50">
                        <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Authenticated Users</h3>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-emerald-950 font-bold text-xs">Admin</div>
                            <span className="text-sm font-medium text-slate-300">You (Owner)</span>
                        </div>
                    </div>
                </div>

                {/* RIGHT: ENCRYPTED NOTES */}
                <div className="lg:col-span-2 flex flex-col h-full overflow-hidden">
                    <div className="bg-slate-900/50 rounded-2xl border border-slate-800 flex-1 flex flex-col overflow-hidden">
                        
                        <div className="p-4 border-b border-slate-800 bg-slate-900/80 flex justify-between items-center">
                            <h3 className="text-xs font-bold text-emerald-500 uppercase flex items-center gap-2">
                                <FileText size={14} /> Secure Storage
                            </h3>
                            {viewingNote !== 'NEW' && (
                                <button
                                    onClick={() => setViewingNote('NEW')}
                                    className="text-[10px] font-bold bg-emerald-600/20 text-emerald-400 px-3 py-1.5 rounded-full hover:bg-emerald-600/30 transition-colors border border-emerald-500/20"
                                >
                                    + New Secret
                                </button>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                           
                            {viewingNote === 'NEW' ? (
                                <div className="space-y-4 animate-in fade-in">
                                    <input
                                        type="text"
                                        placeholder="Title (e.g., Ledger Wallet Seed)"
                                        value={newNoteTitle}
                                        onChange={e => setNewNoteTitle(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white font-bold text-sm focus:border-emerald-500 outline-none"
                                    />
                                    <textarea
                                        placeholder="Sensitive content here... (Will be encrypted)"
                                        value={newNoteContent}
                                        onChange={e => setNewNoteContent(e.target.value)}
                                        className="w-full h-32 bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-slate-300 font-mono text-xs focus:border-emerald-500 outline-none resize-none"
                                    ></textarea>
                                    <div className="flex gap-2 justify-end">
                                        <button 
                                            onClick={() => { setViewingNote(null); setNewNoteTitle(''); setNewNoteContent(''); }}
                                            className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            onClick={handleAddNote}
                                            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-emerald-900/20 transition-all"
                                        >
                                            Encrypt & Save
                                        </button>
                                    </div>
                                </div>
                            ) : notes.length === 0 ? (
                                <div className="text-center py-10 opacity-30">
                                    <Shield size={40} className="mx-auto mb-2 text-slate-500" />
                                    <p className="text-xs text-slate-400">Vault is empty.</p>
                                </div>
                            ) : (
                                notes.map(note => (
                                    <div key={note.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 hover:border-emerald-500/30 transition-all group">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h4 className="text-sm font-bold text-slate-200 group-hover:text-emerald-400 transition-colors">{note.title}</h4>
                                                <p className="text-[10px] text-slate-600 font-mono mt-1">{note.date}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                 <button 
                                                    onClick={() => setViewingNote(viewingNote === note.id ? null : note.id)}
                                                    className="p-1.5 text-slate-500 hover:text-emerald-400 transition-colors"
                                                >
                                                    {viewingNote === note.id ? <EyeOff size={14} /> : <Eye size={14} />}
                                                </button>
                                                <button 
                                                    onClick={() => deleteNote(note.id)}
                                                    className="p-1.5 text-slate-500 hover:text-rose-500 transition-colors"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                        
                                        {viewingNote === note.id && (
                                            <div className="mt-3 p-3 bg-emerald-950/10 rounded-lg border border-emerald-900/20 animate-in fade-in">
                                                <p className="text-xs font-mono text-emerald-300 break-all select-all">
                                                    {getDecryptedContent(note)}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}

                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default FortressHub;
