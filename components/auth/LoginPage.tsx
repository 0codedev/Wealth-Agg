import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Lock, Unlock, ArrowRight, ShieldCheck, Fingerprint } from 'lucide-react';

const LoginPage: React.FC = () => {
    const { login, isAuthenticated, isLocked, unlock } = useAuth();
    const [pin, setPin] = useState('');
    const [error, setError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Auto-focus or clear effects could go here

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(false);

        // Determine if we are Logging In (from scratch) or Unlocking
        const success = isAuthenticated ? await unlock(pin) : await login(pin);

        if (!success) {
            setError(true);
            setPin('');
            // Shake effect logic would be driven by 'error' state in CSS
        }
        setIsLoading(false);
    };

    if (isAuthenticated && !isLocked) return null; // Should be handled by router/guard, but safety check

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-900 overflow-hidden relative">
            {/* Ambient Background Effects */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/30 rounded-full blur-[120px] animate-pulse-slow" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-emerald-600/20 rounded-full blur-[120px] animate-pulse-slow delay-1000" />

            {/* Glass Card */}
            <div className="relative z-10 w-full max-w-md p-8 bg-white/10 dark:bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl flex flex-col items-center">

                {/* Logo / Icon */}
                <div className="mb-8 p-4 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl shadow-lg shadow-indigo-500/20">
                    <ShieldCheck className="text-white w-10 h-10" />
                </div>

                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-white mb-2">
                        {isAuthenticated ? 'Welcome Back' : 'Wealth Aggregator'}
                    </h1>
                    <p className="text-slate-400 text-sm">
                        {isAuthenticated ? 'Enter PIN to unlock your vault' : 'Secure Terminal Access'}
                    </p>
                </div>

                {/* PIN Input */}
                <form onSubmit={handleSubmit} className="w-full space-y-6">
                    <div className="relative">
                        <input
                            type="password"
                            value={pin}
                            onChange={(e) => {
                                if (e.target.value.length <= 4 && /^\d*$/.test(e.target.value)) {
                                    setPin(e.target.value);
                                    setError(false);
                                }
                            }}
                            className={`w-full text-center text-4xl tracking-[1em] font-mono font-bold bg-transparent border-b-2 py-4 text-white focus:outline-none transition-colors ${error ? 'border-rose-500 text-rose-500' : 'border-slate-700 focus:border-indigo-500'
                                }`}
                            placeholder="••••"
                            autoFocus
                        />
                        {error && (
                            <p className="absolute -bottom-6 left-0 w-full text-center text-xs text-rose-500 font-medium animate-pulse">
                                Access Denied. Invalid PIN.
                            </p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={pin.length !== 4 || isLoading}
                        className={`w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all transform ${pin.length === 4
                                ? 'bg-indigo-600 hover:bg-indigo-500 hover:scale-[1.02] shadow-lg shadow-indigo-600/30'
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            }`}
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                {isAuthenticated ? <Unlock size={18} /> : <Fingerprint size={18} />}
                                {isAuthenticated ? 'Unlock Vault' : 'Authenticate'}
                            </>
                        )}
                    </button>
                </form>

                {/* Footer */}
                <div className="mt-8 text-xs text-slate-500 text-center">
                    <p>Protected by Client-Side Encryption</p>
                    <p className="mt-1 opacity-50">Default PIN: 1234</p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
