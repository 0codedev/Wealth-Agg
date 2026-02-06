import React from 'react';
import { Shield, Lock } from 'lucide-react';
import { DeadManSwitch } from './DeadManSwitch';
import { SecureVault } from './SecureVault';
import { LegacyProtocol } from './LegacyProtocol';

export const FortressDashboard: React.FC = () => {
    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 p-6 overflow-y-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent flex items-center gap-3">
                    <Shield className="text-slate-800 dark:text-white" />
                    The Fortress
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mt-2">
                    Governance layer for wealth preservation, legacy planning, and emergency protocols.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Top Row: Dead Man's Switch & Legacy Protocol */}
                <div className="lg:col-span-2">
                    <DeadManSwitch />
                </div>

                <div className="h-[500px]">
                    <SecureVault />
                </div>

                <div className="h-[500px]">
                    <LegacyProtocol />
                </div>
            </div>

            <div className="text-center mt-8 opacity-50">
                <p className="text-xs font-mono">SYSTEM SECURE • ENCRYPTION ACTIVE • LEGACY MODE STANDBY</p>
            </div>
        </div>
    );
};

export default FortressDashboard;
