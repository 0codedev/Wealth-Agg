import React, { useState } from 'react';
import { useFamily, FamilyEntity } from '../../contexts/FamilyContext';
import { useAuth } from '../../contexts/AuthContext';
import { User, Users, Building2, Baby, LogOut, ChevronDown, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ProfileMenu: React.FC = () => {
    const { activeEntity, setActiveEntity, getEntityName } = useFamily();
    const { logout, lock } = useAuth();
    const [isOpen, setIsOpen] = useState(false);

    const EntityIcon = {
        'ALL': Users,
        'SELF': User,
        'SPOUSE': User,
        'HUF': Building2,
        'KIDS': Baby,
        'MOM': User
    }[activeEntity] || Users;

    // Ordered list as per user request
    const MENU_ITEMS: { id: FamilyEntity, label: string, icon: any }[] = [
        { id: 'SELF', label: 'My Portfolio', icon: User },
        { id: 'ALL', label: 'Family Office', icon: Users },
        { id: 'MOM', label: 'Mom', icon: User },
        { id: 'SPOUSE', label: 'Spouse', icon: User },
        { id: 'HUF', label: 'HUF Account', icon: Building2 },
        { id: 'KIDS', label: 'Kids Trust', icon: Baby },
    ];

    return (
        <div className="relative z-50">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full p-1 pl-2 transition-all"
            >
                <div className="text-right hidden sm:block">
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Viewing</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{getEntityName(activeEntity)}</p>
                </div>
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full ring-2 ring-slate-100 dark:ring-slate-800 flex items-center justify-center text-white shadow-lg">
                    <EntityIcon size={16} />
                </div>
                <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-40 bg-transparent"
                            onClick={() => setIsOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-[100] p-1"
                        >
                            <div className="p-3 border-b border-slate-100 dark:border-slate-800 mb-1">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Switch Profile</p>
                            </div>

                            <div className="space-y-1">
                                {MENU_ITEMS.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => {
                                            setActiveEntity(item.id);
                                            setIsOpen(false);
                                        }}
                                        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${activeEntity === item.id
                                            ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                                            : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                                            }`}
                                    >
                                        <div className={`p-1.5 rounded-md ${activeEntity === item.id ? 'bg-indigo-100 dark:bg-indigo-800' : 'bg-slate-100 dark:bg-slate-800'}`}>
                                            <item.icon size={16} />
                                        </div>
                                        <div className="text-left">
                                            <span className="text-sm font-bold block">{item.label}</span>
                                        </div>
                                        {activeEntity === item.id && (
                                            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                                        )}
                                    </button>
                                ))}
                            </div>

                            <div className="border-t border-slate-100 dark:border-slate-800 mt-2 pt-2 space-y-1">
                                <button
                                    onClick={() => { lock(); setIsOpen(false); }}
                                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                                >
                                    <Lock size={16} />
                                    <span className="text-sm font-bold">Lock Vault</span>
                                </button>
                                <button
                                    onClick={() => { logout(); setIsOpen(false); }}
                                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/10 text-rose-500 transition-colors"
                                >
                                    <LogOut size={16} />
                                    <span className="text-sm font-bold">Sign Out</span>
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProfileMenu;
