import React, { useState, useEffect, useMemo } from 'react';
import {
    Shield, Lock, Unlock, Key, FileText, AlertOctagon, Power, Clock,
    Eye, EyeOff, Save, Trash2, ShieldCheck, ShieldAlert, Users,
    Fingerprint, Smartphone, Mail, CreditCard, Building, Heart,
    FolderLock, ChevronRight, CheckCircle2, XCircle, AlertTriangle,
    Download, Upload, Copy, Edit3, Plus, Tag, Calendar, Star
} from 'lucide-react';
import { encryptData, decryptData, hashPassword } from '../../../utils/Encryption';

// ===================== TYPES =====================
interface SecretNote {
    id: string;
    title: string;
    encryptedContent: string;
    date: string;
    category: 'password' | 'financial' | 'personal' | 'medical' | 'legal';
    starred: boolean;
}

interface LegacyBeneficiary {
    id: string;
    name: string;
    email: string;
    relationship: string;
    share: number; // Percentage
}

interface SecurityItem {
    id: string;
    name: string;
    platform: string;
    has2FA: boolean;
    lastChecked: string;
    icon: React.ReactNode;
}

// ===================== SECURITY DASHBOARD =====================
const SecurityDashboard: React.FC<{ securityScore: number }> = ({ securityScore }) => {
    const securityItems: SecurityItem[] = [
        { id: '1', name: 'Google Account', platform: 'google.com', has2FA: true, lastChecked: '2024-12-15', icon: <Mail size={14} /> },
        { id: '2', name: 'Bank Account', platform: 'hdfc.com', has2FA: true, lastChecked: '2024-12-10', icon: <Building size={14} /> },
        { id: '3', name: 'Zerodha', platform: 'zerodha.com', has2FA: true, lastChecked: '2024-12-18', icon: <CreditCard size={14} /> },
        { id: '4', name: 'Groww', platform: 'groww.in', has2FA: false, lastChecked: '2024-11-20', icon: <CreditCard size={14} /> },
    ];

    const enabled2FA = securityItems.filter(i => i.has2FA).length;
    const total = securityItems.length;

    return (
        <div className="space-y-4">
            {/* Security Score */}
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950/30 rounded-2xl p-4 border border-indigo-500/20">
                <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold text-indigo-300 uppercase flex items-center gap-2">
                        <ShieldCheck size={14} /> Security Score
                    </h4>
                    <span className={`text-2xl font-black font-mono ${securityScore > 80 ? 'text-emerald-400' :
                            securityScore > 60 ? 'text-amber-400' : 'text-rose-400'
                        }`}>
                        {securityScore}%
                    </span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all duration-1000 ${securityScore > 80 ? 'bg-emerald-500' :
                                securityScore > 60 ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                        style={{ width: `${securityScore}%` }}
                    />
                </div>
            </div>

            {/* 2FA Overview */}
            <div className="bg-slate-900/50 rounded-2xl p-4 border border-slate-800">
                <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                        <Fingerprint size={14} /> 2FA Status
                    </h4>
                    <span className="text-[10px] text-emerald-400 font-bold">{enabled2FA}/{total} Enabled</span>
                </div>
                <div className="space-y-2">
                    {securityItems.map(item => (
                        <div key={item.id} className="flex items-center justify-between p-2 bg-slate-950/50 rounded-lg border border-slate-800/50">
                            <div className="flex items-center gap-2">
                                <span className="text-slate-500">{item.icon}</span>
                                <div>
                                    <p className="text-xs font-bold text-slate-300">{item.name}</p>
                                    <p className="text-[9px] text-slate-600 font-mono">{item.platform}</p>
                                </div>
                            </div>
                            {item.has2FA ? (
                                <CheckCircle2 size={16} className="text-emerald-500" />
                            ) : (
                                <XCircle size={16} className="text-rose-500" />
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// ===================== LEGACY PLANNING =====================
const LegacyPlanning: React.FC = () => {
    const [beneficiaries, setBeneficiaries] = useState<LegacyBeneficiary[]>([
        { id: '1', name: 'Spouse', email: 'spouse@email.com', relationship: 'Spouse', share: 50 },
        { id: '2', name: 'Child 1', email: 'child1@email.com', relationship: 'Child', share: 25 },
        { id: '3', name: 'Child 2', email: 'child2@email.com', relationship: 'Child', share: 25 },
    ]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newBeneficiary, setNewBeneficiary] = useState({ name: '', email: '', relationship: '', share: 0 });

    const totalShare = beneficiaries.reduce((sum, b) => sum + b.share, 0);

    const handleAdd = () => {
        if (!newBeneficiary.name || !newBeneficiary.email) return;
        setBeneficiaries([...beneficiaries, {
            id: Date.now().toString(),
            ...newBeneficiary,
            share: newBeneficiary.share || 0
        }]);
        setNewBeneficiary({ name: '', email: '', relationship: '', share: 0 });
        setShowAddForm(false);
    };

    const handleDelete = (id: string) => {
        setBeneficiaries(beneficiaries.filter(b => b.id !== id));
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-amber-300 uppercase flex items-center gap-2">
                    <Users size={14} /> Beneficiaries
                </h4>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-1 rounded-full hover:bg-amber-500/20 border border-amber-500/20"
                >
                    <Plus size={10} className="inline mr-1" /> Add
                </button>
            </div>

            {totalShare !== 100 && (
                <div className="bg-rose-950/20 border border-rose-500/30 rounded-lg p-2 text-[10px] text-rose-400 flex items-center gap-2">
                    <AlertTriangle size={12} />
                    Total share is {totalShare}% (should be 100%)
                </div>
            )}

            {showAddForm && (
                <div className="bg-slate-950 p-3 rounded-xl border border-amber-500/30 space-y-2 animate-in fade-in">
                    <input
                        type="text"
                        placeholder="Name"
                        value={newBeneficiary.name}
                        onChange={e => setNewBeneficiary({ ...newBeneficiary, name: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-white"
                    />
                    <input
                        type="email"
                        placeholder="Email"
                        value={newBeneficiary.email}
                        onChange={e => setNewBeneficiary({ ...newBeneficiary, email: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-white"
                    />
                    <div className="flex gap-2">
                        <select
                            value={newBeneficiary.relationship}
                            onChange={e => setNewBeneficiary({ ...newBeneficiary, relationship: e.target.value })}
                            className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-white"
                        >
                            <option value="">Relationship</option>
                            <option value="Spouse">Spouse</option>
                            <option value="Child">Child</option>
                            <option value="Parent">Parent</option>
                            <option value="Sibling">Sibling</option>
                            <option value="Other">Other</option>
                        </select>
                        <input
                            type="number"
                            placeholder="%"
                            value={newBeneficiary.share || ''}
                            onChange={e => setNewBeneficiary({ ...newBeneficiary, share: parseInt(e.target.value) || 0 })}
                            className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-white text-center"
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setShowAddForm(false)} className="text-[10px] text-slate-400">Cancel</button>
                        <button onClick={handleAdd} className="text-[10px] bg-amber-600 text-white px-3 py-1 rounded">Add</button>
                    </div>
                </div>
            )}

            <div className="space-y-2">
                {beneficiaries.map(b => (
                    <div key={b.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl border border-slate-800 group hover:border-amber-500/30">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 text-xs font-bold">
                                {b.name.charAt(0)}
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-200">{b.name}</p>
                                <p className="text-[9px] text-slate-500">{b.relationship} • {b.email}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-mono font-bold text-amber-400">{b.share}%</span>
                            <button
                                onClick={() => handleDelete(b.id)}
                                className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-500 transition-all"
                            >
                                <Trash2 size={12} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-amber-950/20 border border-amber-500/20 rounded-xl p-3">
                <p className="text-[10px] text-amber-300 leading-relaxed">
                    <Heart size={10} className="inline mr-1" />
                    Upon activation of Dead Man's Switch, your encrypted vault access will be securely shared with verified beneficiaries.
                </p>
            </div>
        </div>
    );
};

// ===================== DOCUMENT CATEGORIES =====================
const CATEGORIES = [
    { id: 'password', label: 'Passwords', icon: <Key size={12} />, color: 'text-indigo-400 bg-indigo-500/10' },
    { id: 'financial', label: 'Financial', icon: <CreditCard size={12} />, color: 'text-emerald-400 bg-emerald-500/10' },
    { id: 'personal', label: 'Personal', icon: <Users size={12} />, color: 'text-blue-400 bg-blue-500/10' },
    { id: 'medical', label: 'Medical', icon: <Heart size={12} />, color: 'text-rose-400 bg-rose-500/10' },
    { id: 'legal', label: 'Legal', icon: <FileText size={12} />, color: 'text-amber-400 bg-amber-500/10' },
];

// ===================== MAIN FORTRESS HUB =====================
const FortressHub: React.FC = () => {
    // Security State
    const [isLocked, setIsLocked] = useState(true);
    const [masterPassword, setMasterPassword] = useState('');
    const [storedHash, setStoredHash] = useState<string | null>(null);
    const [isSetupMode, setIsSetupMode] = useState(false);

    // Vault State
    const [notes, setNotes] = useState<SecretNote[]>([]);
    const [newNote, setNewNote] = useState({ title: '', content: '', category: 'password' as const });
    const [viewingNote, setViewingNote] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    // Tabs
    const [activeTab, setActiveTab] = useState<'vault' | 'security' | 'legacy'>('vault');

    // Dead Man's Switch
    const [dmsEnabled, setDmsEnabled] = useState(false);
    const [dmsTimer, setDmsTimer] = useState(30);

    // Calculate security score
    const securityScore = useMemo(() => {
        let score = 50; // Base
        if (storedHash) score += 20; // Password set
        if (notes.length > 0) score += 15; // Notes stored
        if (dmsEnabled) score += 15; // DMS enabled
        return Math.min(100, score);
    }, [storedHash, notes.length, dmsEnabled]);

    // Setup / Unlock Logic
    useEffect(() => {
        const savedHash = localStorage.getItem('fortress_hash');
        if (savedHash) {
            setStoredHash(savedHash);
        } else {
            setIsSetupMode(true);
        }
        const savedNotes = localStorage.getItem('fortress_notes_v2');
        if (savedNotes) setNotes(JSON.parse(savedNotes));
    }, []);

    const handleUnlock = () => {
        if (!masterPassword) return;
        const inputHash = hashPassword(masterPassword);
        if (inputHash === storedHash) {
            setIsLocked(false);
            setMasterPassword('');
        } else {
            alert("ACCESS DENIED - Invalid Master Key");
        }
    };

    const handleSetup = () => {
        if (!masterPassword || masterPassword.length < 8) {
            alert("Password must be at least 8 characters");
            return;
        }
        const h = hashPassword(masterPassword);
        localStorage.setItem('fortress_hash', h);
        setStoredHash(h);
        setIsSetupMode(false);
        setIsLocked(false);
        setMasterPassword('');
    };

    const saveNotes = (updatedNotes: SecretNote[]) => {
        setNotes(updatedNotes);
        localStorage.setItem('fortress_notes_v2', JSON.stringify(updatedNotes));
    };

    const handleAddNote = () => {
        if (!newNote.title || !newNote.content) return;
        const sessionKey = storedHash?.substring(0, 32) || "FALLBACK_KEY_123";
        const encrypted = encryptData(newNote.content, sessionKey);
        const note: SecretNote = {
            id: Date.now().toString(),
            title: newNote.title,
            encryptedContent: encrypted,
            date: new Date().toLocaleDateString(),
            category: newNote.category,
            starred: false
        };
        saveNotes([note, ...notes]);
        setNewNote({ title: '', content: '', category: 'password' });
        setViewingNote(null);
    };

    const getDecryptedContent = (note: SecretNote) => {
        const sessionKey = storedHash?.substring(0, 32) || "FALLBACK_KEY_123";
        return decryptData(note.encryptedContent, sessionKey);
    };

    const toggleStar = (id: string) => {
        const updated = notes.map(n => n.id === id ? { ...n, starred: !n.starred } : n);
        saveNotes(updated);
    };

    const deleteNote = (id: string) => {
        saveNotes(notes.filter(n => n.id !== id));
    };

    const filteredNotes = selectedCategory
        ? notes.filter(n => n.category === selectedCategory)
        : notes;

    // ===================== LOCK SCREEN =====================
    if (isLocked) {
        return (
            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden min-h-[400px] flex flex-col items-center justify-center text-center">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />

                <div className="relative z-10 space-y-6 max-w-sm w-full">
                    <div className="mx-auto w-24 h-24 bg-gradient-to-br from-slate-900 to-slate-800 rounded-full flex items-center justify-center border-2 border-emerald-500/30 shadow-[0_0_40px_rgba(16,185,129,0.2)]">
                        <Lock size={36} className="text-emerald-500" />
                    </div>

                    <div>
                        <h2 className="text-3xl font-black text-white tracking-tighter mb-1">THE FORTRESS 2.0</h2>
                        <p className="text-xs font-mono text-emerald-500/60 uppercase tracking-widest">
                            {isSetupMode ? "Initialize Secure Vault" : "AES-256 Encrypted"}
                        </p>
                    </div>

                    <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block text-left">
                            {isSetupMode ? "Create Master Key (min 8 chars)" : "Enter Master Key"}
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="password"
                                value={masterPassword}
                                onChange={e => setMasterPassword(e.target.value)}
                                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white font-mono text-lg focus:border-emerald-500 outline-none transition-all"
                                placeholder="••••••••••••"
                                onKeyDown={e => e.key === 'Enter' && (isSetupMode ? handleSetup() : handleUnlock())}
                            />
                            <button
                                onClick={isSetupMode ? handleSetup : handleUnlock}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white p-3 rounded-lg transition-colors shadow-lg shadow-emerald-900/30"
                            >
                                {isSetupMode ? <Save size={20} /> : <Key size={20} />}
                            </button>
                        </div>
                        {isSetupMode && (
                            <p className="text-[10px] text-amber-500 mt-3 flex items-center gap-1">
                                <AlertOctagon size={12} /> This key cannot be recovered. Store it safely.
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-600">
                        <div className="flex items-center gap-1"><ShieldCheck size={10} /> AES-256</div>
                        <div className="flex items-center gap-1"><FolderLock size={10} /> Local Only</div>
                        <div className="flex items-center gap-1"><Fingerprint size={10} /> Zero-Trust</div>
                    </div>
                </div>
            </div>
        );
    }

    // ===================== VAULT INTERFACE =====================
    return (
        <div className="bg-slate-950 border border-emerald-900/30 rounded-3xl shadow-2xl relative overflow-hidden min-h-[500px] flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-emerald-900/20 bg-gradient-to-r from-slate-900 to-emerald-950/20">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                            <ShieldCheck size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                                THE FORTRESS 2.0
                                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-900/30 text-emerald-400 border border-emerald-900/50 uppercase">Secured</span>
                            </h2>
                            <div className="flex items-center gap-4 text-xs font-mono text-emerald-600/60 mt-1">
                                <span>Security: {securityScore}%</span>
                                <span>•</span>
                                <span>{notes.length} secrets</span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsLocked(true)}
                        className="p-2 rounded-lg bg-slate-900 text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors border border-slate-800"
                        title="Lock Vault"
                    >
                        <Lock size={18} />
                    </button>
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-1 mt-4 p-1 bg-slate-900/50 rounded-xl border border-slate-800">
                    {[
                        { id: 'vault', label: 'Secure Vault', icon: <FolderLock size={14} /> },
                        { id: 'security', label: 'Security', icon: <ShieldCheck size={14} /> },
                        { id: 'legacy', label: 'Legacy', icon: <Users size={14} /> },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === tab.id
                                    ? 'bg-emerald-600 text-white shadow-lg'
                                    : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 p-6 overflow-auto">
                {/* VAULT TAB */}
                {activeTab === 'vault' && (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Category Sidebar */}
                        <div className="space-y-2">
                            <button
                                onClick={() => setSelectedCategory(null)}
                                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${!selectedCategory ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                                    }`}
                            >
                                <FolderLock size={12} /> All Secrets
                            </button>
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${selectedCategory === cat.id
                                            ? `${cat.color} border border-current`
                                            : 'text-slate-400 hover:bg-slate-800'
                                        }`}
                                >
                                    {cat.icon} {cat.label}
                                    <span className="ml-auto text-[9px] opacity-60">
                                        {notes.filter(n => n.category === cat.id).length}
                                    </span>
                                </button>
                            ))}

                            {/* Dead Man's Switch */}
                            <div className="mt-6 p-3 bg-slate-900/50 rounded-xl border border-slate-800">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                        <ShieldAlert size={10} className={dmsEnabled ? 'text-rose-500' : ''} /> DMS
                                    </span>
                                    <button
                                        onClick={() => setDmsEnabled(!dmsEnabled)}
                                        className={`w-8 h-4 rounded-full transition-colors relative ${dmsEnabled ? 'bg-rose-600' : 'bg-slate-700'}`}
                                    >
                                        <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${dmsEnabled ? 'left-4' : 'left-0.5'}`} />
                                    </button>
                                </div>
                                {dmsEnabled && (
                                    <p className="text-[9px] text-rose-400">Active: {dmsTimer} days</p>
                                )}
                            </div>
                        </div>

                        {/* Notes List */}
                        <div className="lg:col-span-3 space-y-3">
                            {/* Add New Button */}
                            {viewingNote !== 'NEW' && (
                                <button
                                    onClick={() => setViewingNote('NEW')}
                                    className="w-full p-4 border-2 border-dashed border-slate-800 hover:border-emerald-500/50 rounded-xl text-slate-500 hover:text-emerald-400 transition-all flex items-center justify-center gap-2 text-xs font-bold"
                                >
                                    <Plus size={14} /> Add New Secret
                                </button>
                            )}

                            {/* New Note Form */}
                            {viewingNote === 'NEW' && (
                                <div className="bg-slate-900 p-4 rounded-xl border border-emerald-500/30 space-y-3 animate-in fade-in">
                                    <input
                                        type="text"
                                        placeholder="Title (e.g., Gmail Password)"
                                        value={newNote.title}
                                        onChange={e => setNewNote({ ...newNote, title: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm focus:border-emerald-500 outline-none"
                                    />
                                    <textarea
                                        placeholder="Secret content... (Will be encrypted)"
                                        value={newNote.content}
                                        onChange={e => setNewNote({ ...newNote, content: e.target.value })}
                                        className="w-full h-24 bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-slate-300 font-mono text-xs focus:border-emerald-500 outline-none resize-none"
                                    />
                                    <div className="flex gap-2">
                                        {CATEGORIES.map(cat => (
                                            <button
                                                key={cat.id}
                                                onClick={() => setNewNote({ ...newNote, category: cat.id as any })}
                                                className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 ${newNote.category === cat.id ? cat.color : 'text-slate-500 bg-slate-800'
                                                    }`}
                                            >
                                                {cat.icon} {cat.label}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex gap-2 justify-end">
                                        <button onClick={() => setViewingNote(null)} className="px-4 py-2 text-xs text-slate-400">Cancel</button>
                                        <button onClick={handleAddNote} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg">
                                            Encrypt & Save
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Notes List */}
                            {filteredNotes.length === 0 && viewingNote !== 'NEW' ? (
                                <div className="text-center py-12 opacity-30">
                                    <Shield size={40} className="mx-auto mb-2 text-slate-500" />
                                    <p className="text-xs text-slate-400">No secrets in this category</p>
                                </div>
                            ) : (
                                filteredNotes.map(note => (
                                    <div key={note.id} className="bg-slate-900 p-4 rounded-xl border border-slate-800 hover:border-emerald-500/30 transition-all group">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-start gap-3">
                                                <button onClick={() => toggleStar(note.id)} className="mt-0.5">
                                                    <Star size={14} className={note.starred ? 'text-amber-400 fill-amber-400' : 'text-slate-600'} />
                                                </button>
                                                <div>
                                                    <h4 className="text-sm font-bold text-slate-200 group-hover:text-emerald-400 transition-colors">{note.title}</h4>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className={`text-[9px] px-1.5 py-0.5 rounded ${CATEGORIES.find(c => c.id === note.category)?.color}`}>
                                                            {note.category}
                                                        </span>
                                                        <span className="text-[9px] text-slate-600 font-mono">{note.date}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => setViewingNote(viewingNote === note.id ? null : note.id)}
                                                    className="p-1.5 text-slate-500 hover:text-emerald-400"
                                                >
                                                    {viewingNote === note.id ? <EyeOff size={14} /> : <Eye size={14} />}
                                                </button>
                                                <button
                                                    onClick={() => navigator.clipboard.writeText(getDecryptedContent(note))}
                                                    className="p-1.5 text-slate-500 hover:text-blue-400"
                                                >
                                                    <Copy size={14} />
                                                </button>
                                                <button
                                                    onClick={() => deleteNote(note.id)}
                                                    className="p-1.5 text-slate-500 hover:text-rose-500"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>

                                        {viewingNote === note.id && (
                                            <div className="mt-3 p-3 bg-emerald-950/20 rounded-lg border border-emerald-900/30 animate-in fade-in">
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
                )}

                {/* SECURITY TAB */}
                {activeTab === 'security' && (
                    <SecurityDashboard securityScore={securityScore} />
                )}

                {/* LEGACY TAB */}
                {activeTab === 'legacy' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <LegacyPlanning />

                        <div className="bg-slate-900/50 rounded-2xl p-5 border border-slate-800">
                            <h4 className="text-xs font-bold text-rose-300 uppercase flex items-center gap-2 mb-4">
                                <ShieldAlert size={14} /> Dead Man's Switch
                            </h4>

                            <div className="flex items-center justify-between mb-4">
                                <span className="text-sm font-medium text-slate-200">Protocol Status</span>
                                <button
                                    onClick={() => setDmsEnabled(!dmsEnabled)}
                                    className={`w-12 h-6 rounded-full transition-colors relative ${dmsEnabled ? 'bg-rose-600' : 'bg-slate-700'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${dmsEnabled ? 'left-7' : 'left-1'}`} />
                                </button>
                            </div>

                            {dmsEnabled && (
                                <div className="space-y-4 animate-in fade-in">
                                    <div>
                                        <label className="text-[10px] text-slate-500 font-bold uppercase block mb-2">Inactivity Trigger</label>
                                        <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-800">
                                            {[15, 30, 60, 90].map(days => (
                                                <button
                                                    key={days}
                                                    onClick={() => setDmsTimer(days)}
                                                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${dmsTimer === days ? 'bg-rose-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                                                >
                                                    {days}d
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="p-3 bg-rose-950/20 border border-rose-900/30 rounded-lg">
                                        <p className="text-[10px] text-rose-300 leading-relaxed">
                                            <AlertOctagon size={10} className="inline mr-1" />
                                            If no login for {dmsTimer} days, vault access will be shared with verified beneficiaries.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FortressHub;
