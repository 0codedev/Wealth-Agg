
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    CheckCircle, Lock, Unlock, PlayCircle, BookOpen, 
    TrendingUp, Calculator, ShieldCheck, Award, Star, Book,
    Flame, Zap, Map, ArrowDown, MonitorPlay, Activity,
    GraduationCap, LineChart
} from 'lucide-react';
import { useGamificationStore, DayProgress } from '../../gamificationStore';
import { ACADEMY_EXTENSION } from '../../data/AcademyData';
import { PaperTradingGym } from '../academy/PaperTradingGym';
import AdvancedPaperTrading from '../academy/AdvancedPaperTrading';
import confetti from 'canvas-confetti';

const PHASES = [
    { id: 1, name: "Foundation", days: [1, 2, 3, 4, 5], color: "from-indigo-500 to-purple-600" },
    { id: 2, name: "Mechanics", days: [6, 7, 8, 9, 10], color: "from-cyan-500 to-blue-600" },
    { id: 3, name: "Risk Management", days: [11, 12, 13, 14, 15], color: "from-fuchsia-500 to-pink-600" },
    { id: 4, name: "The Operator", days: [16, 17, 18, 19, 20], color: "from-amber-500 to-orange-600" }
];

const Academy: React.FC = () => {
  const { xp, level, sprintProgress, streak, initializeSprint, checkStreak, completeDay, addXp } = useGamificationStore();
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [activeMode, setActiveMode] = useState<'ACADEMY' | 'PAPER_TRADING'>('ACADEMY');
  
  // Gym State
  const [isGymOpen, setIsGymOpen] = useState(false);
  const [gymScore, setGymScore] = useState<number | null>(null);

  useEffect(() => {
      initializeSprint();
      checkStreak();
  }, [initializeSprint, checkStreak]);

  // UI State for specific tasks
  const [phase2LogCount, setPhase2LogCount] = useState(0);
  const [quizAnswer, setQuizAnswer] = useState('');
  const [quizParams, setQuizParams] = useState({ capital: 5000, risk: 2 });
  const [quizFeedback, setQuizFeedback] = useState<string | null>(null);

  // Final Exam State
  const [finalExamAnswers, setFinalExamAnswers] = useState<Record<number, string>>({});

  const triggerConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.6 },
      colors: ['#6366f1', '#10b981', '#f43f5e', '#fbbf24']
    });
  };

  const generateQuiz = () => {
      const cap = Math.floor(Math.random() * 90000) + 10000; // 10k - 100k
      const r = Math.floor(Math.random() * 3) + 1; // 1-3%
      setQuizParams({ capital: cap, risk: r });
      setQuizAnswer('');
      setQuizFeedback(null);
  };

  const handlePhase2Submit = (day: number) => {
      if (phase2LogCount < 10) {
          setPhase2LogCount(prev => prev + 1);
      }
      if (phase2LogCount + 1 >= 10) {
          completeDay(day);
          addXp(50);
          setPhase2LogCount(0);
          triggerConfetti();
          setSelectedDay(null); // Close modal on complete
      }
  };

  const handleQuizSubmit = (day: number) => {
      const maxLoss = (quizParams.capital * quizParams.risk) / 100;
      if (parseFloat(quizAnswer) === maxLoss) {
          completeDay(day);
          addXp(100);
          setQuizFeedback('CORRECT! +100 XP');
          triggerConfetti();
          setTimeout(() => setSelectedDay(null), 1500);
      } else {
          setQuizFeedback(`Incorrect. ${quizParams.capital} * ${quizParams.risk}% = ${maxLoss}`);
      }
  };

  const handleFinalExamSubmit = (day: number) => {
      if (Object.keys(finalExamAnswers).length === 4) {
          completeDay(day);
          addXp(500); 
          triggerConfetti();
          setTimeout(() => setSelectedDay(null), 1500);
      } else {
          alert("Please answer all questions.");
      }
  };

  const markComplete = (day: number, xpReward: number) => {
      completeDay(day);
      addXp(xpReward);
      triggerConfetti();
      setTimeout(() => setSelectedDay(null), 1000);
  };

  const handleGymComplete = (score: number) => {
      setGymScore(score);
      // We assume day 10 is the Gym Day for this implementation
      if (selectedDay) {
          completeDay(selectedDay);
          addXp(score);
          triggerConfetti();
      }
  };

  // --- COMPONENT RENDERERS ---

  const renderMissionContent = (day: number) => {
    const isCompleted = sprintProgress[day]?.completed;
    
    // --- PHASE 1: THEORY ---
    if (day <= 5) {
        return (
            <div className="space-y-4">
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800">
                    <h4 className="font-bold text-indigo-700 dark:text-indigo-300 mb-2">Required Reading</h4>
                    <ul className="space-y-3">
                        <li className="flex items-center gap-3">
                            <input type="checkbox" checked={isCompleted} readOnly className="w-5 h-5 accent-indigo-600 rounded" />
                            <span className="text-slate-700 dark:text-slate-300">Read: "Market Structure 101"</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <input type="checkbox" checked={isCompleted} readOnly className="w-5 h-5 accent-indigo-600 rounded" />
                            <span className="text-slate-700 dark:text-slate-300">Watch: "Candlestick Secrets"</span>
                        </li>
                    </ul>
                </div>
                {!isCompleted ? (
                    <button 
                        onClick={() => markComplete(day, 20)}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-500/30 transition-all active:scale-95"
                    >
                        Mark Mission Complete (+20 XP)
                    </button>
                ) : (
                     <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl text-center font-bold">
                         Mission Accomplished
                     </div>
                )}
            </div>
        );
    } 
    // --- PHASE 2: MECHANICS & SIMULATION ---
    else if (day <= 10) {
        // Special case for Day 10: The Gym
        if (day === 10) {
            return (
                <div className="space-y-5">
                    <div className="bg-cyan-950 p-6 rounded-2xl border border-cyan-800 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <MonitorPlay size={80} className="text-cyan-400"/>
                        </div>
                        <div className="relative z-10">
                            <h4 className="text-xl font-black text-white mb-2 flex items-center gap-2">
                                <Activity size={24} className="text-cyan-400"/> The Paper Gym
                            </h4>
                            <p className="text-cyan-200 text-sm mb-6">
                                Simulation Drill: Trade a historical NIFTY session candle-by-candle. No risk, pure skill.
                            </p>
                            
                            {gymScore !== null ? (
                                <div className="text-center bg-cyan-900/50 rounded-xl p-4 border border-cyan-500/30">
                                    <p className="text-xs font-bold text-cyan-400 uppercase">Last Session Score</p>
                                    <p className="text-3xl font-black text-white">{gymScore} XP</p>
                                </div>
                            ) : (
                                <button 
                                    onClick={() => setIsGymOpen(true)}
                                    className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-black py-4 rounded-xl shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                                >
                                    <PlayCircle size={20}/> ENTER SIMULATION
                                </button>
                            )}
                        </div>
                    </div>
                    {isCompleted && (
                        <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl text-center font-bold">
                            Drill Mastered
                        </div>
                    )}
                </div>
            );
        }

        return (
            <div className="space-y-5">
                <div className="bg-cyan-50 dark:bg-cyan-900/20 p-4 rounded-xl border border-cyan-100 dark:border-cyan-800">
                    <h4 className="font-bold text-cyan-700 dark:text-cyan-300 mb-2">Field Work: Log 10 Charts</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Identify Trend & Zones on real live charts.</p>
                    
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <input placeholder="Symbol (e.g. NIFTY)" className="bg-white dark:bg-slate-900 p-3 rounded-lg text-sm border border-cyan-200 dark:border-cyan-800 outline-none" disabled={isCompleted} />
                        <select className="bg-white dark:bg-slate-900 p-3 rounded-lg text-sm border border-cyan-200 dark:border-cyan-800 outline-none" disabled={isCompleted}>
                            <option>Uptrend</option>
                            <option>Downtrend</option>
                            <option>Sideways</option>
                        </select>
                    </div>

                    <div className="flex items-center justify-between">
                         <div className="flex gap-1">
                             {[...Array(10)].map((_, i) => (
                                 <div key={i} className={`w-2 h-4 rounded-sm ${i < phase2LogCount ? 'bg-cyan-500' : 'bg-slate-300 dark:bg-slate-700'}`}></div>
                             ))}
                         </div>
                         <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400">{phase2LogCount}/10</span>
                    </div>
                </div>

                {!isCompleted ? (
                    <button 
                        onClick={() => handlePhase2Submit(day)}
                        className="w-full bg-cyan-600 text-white font-bold py-3 rounded-xl hover:bg-cyan-500 transition-colors shadow-lg shadow-cyan-500/30 active:scale-95"
                    >
                        Log Chart Entry
                    </button>
                ) : (
                    <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl text-center font-bold">
                         10/10 Charts Logged
                     </div>
                )}
            </div>
        );
    }
    // --- PHASE 3: RISK DRILLS ---
    else if (day <= 15) {
        return (
            <div className="space-y-5">
                <div className="bg-fuchsia-50 dark:bg-fuchsia-900/20 p-4 rounded-xl border border-fuchsia-100 dark:border-fuchsia-800">
                     <h4 className="font-bold text-fuchsia-700 dark:text-fuchsia-300 mb-4">Live Fire Drill: Max Loss Calc</h4>
                     
                     <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-xl border border-dashed border-fuchsia-300 dark:border-fuchsia-700 mb-4 font-mono">
                         <div className="text-center">
                             <p className="text-xs text-slate-500 uppercase">Capital</p>
                             <p className="font-bold text-lg">₹{quizParams.capital}</p>
                         </div>
                         <div className="text-fuchsia-300">×</div>
                         <div className="text-center">
                             <p className="text-xs text-slate-500 uppercase">Risk</p>
                             <p className="font-bold text-lg text-rose-500">{quizParams.risk}%</p>
                         </div>
                         <div className="text-fuchsia-300">=</div>
                         <div className="text-center">
                             <p className="text-xs text-slate-500 uppercase">Max Loss</p>
                             <p className="font-bold text-lg text-fuchsia-500">?</p>
                         </div>
                     </div>

                     {!isCompleted && (
                        <div className="flex gap-2">
                            <input 
                                type="number" 
                                value={quizAnswer}
                                onChange={(e) => setQuizAnswer(e.target.value)}
                                placeholder="Enter value..."
                                className="flex-1 bg-white dark:bg-slate-900 border border-fuchsia-200 dark:border-fuchsia-800 p-3 rounded-xl text-sm outline-none focus:border-fuchsia-500"
                            />
                            <button 
                                onClick={() => handleQuizSubmit(day)}
                                className="bg-fuchsia-600 text-white px-6 rounded-xl font-bold hover:bg-fuchsia-700 shadow-lg shadow-fuchsia-500/30"
                            >
                                Fire
                            </button>
                        </div>
                     )}
                     
                     {quizFeedback && (
                        <p className={`mt-3 text-center text-sm font-bold ${quizFeedback.includes('CORRECT') ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {quizFeedback}
                        </p>
                    )}
                </div>
                {!isCompleted && (
                    <button onClick={generateQuiz} className="w-full py-2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        Generate New Scenario
                    </button>
                )}
            </div>
        );
    }
    // --- PHASE 4: THE OPERATOR ---
    else {
        const content = ACADEMY_EXTENSION[day];
        if (!content) return null;

        return (
            <div className="space-y-5">
                <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-100 dark:border-amber-800">
                    <h4 className="font-bold text-amber-700 dark:text-amber-300 mb-1">{content.title}</h4>
                    <p className="text-xs text-amber-600/70 dark:text-amber-400/70 mb-4">{content.subtitle}</p>
                    
                    {content.type === 'EXAM' ? (
                        <div className="space-y-4">
                            {content.content.map((q, idx) => (
                                <div key={idx} className="space-y-1">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">{q}</label>
                                    <input 
                                        type="text" 
                                        className="w-full bg-white dark:bg-slate-900 p-2.5 rounded-lg text-sm border border-amber-200 dark:border-amber-800 outline-none focus:border-amber-500" 
                                        placeholder="Your answer..."
                                        disabled={isCompleted}
                                        onChange={(e) => setFinalExamAnswers(prev => ({...prev, [idx]: e.target.value}))}
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                         <ul className="space-y-2">
                            {content.content.map((item, idx) => (
                                 <li key={idx} className="flex gap-3 items-start text-sm text-slate-700 dark:text-slate-300 bg-white/50 dark:bg-slate-900/50 p-2 rounded-lg">
                                    <span className="mt-1.5 w-1.5 h-1.5 bg-amber-500 rounded-full shrink-0"></span>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {!isCompleted && (
                    <button 
                        onClick={() => content.type === 'EXAM' ? handleFinalExamSubmit(day) : markComplete(day, 30)}
                        className={`w-full font-bold py-3 rounded-xl shadow-lg transition-all active:scale-95 text-white ${content.type === 'EXAM' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/30' : 'bg-slate-800 hover:bg-slate-700 shadow-slate-500/30'}`}
                    >
                        {content.type === 'EXAM' ? 'Submit Final Exam' : 'Acknowledge Protocol (+30 XP)'}
                    </button>
                )}
            </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4 relative">
        
        {/* TOP TOGGLE HEADER */}
        <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 px-2">
                <GraduationCap size={20} className="text-indigo-500" />
                <span className="font-bold text-slate-800 dark:text-white">Academy</span>
            </div>
            
            <div className="flex bg-white dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
                <button
                    onClick={() => setActiveMode('ACADEMY')}
                    className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeMode === 'ACADEMY' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                >
                    Learning Engine
                </button>
                <button
                    onClick={() => setActiveMode('PAPER_TRADING')}
                    className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${activeMode === 'PAPER_TRADING' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                >
                    <LineChart size={12}/> Pro Paper Trader
                </button>
            </div>
        </div>

        {activeMode === 'PAPER_TRADING' ? (
            <div className="flex-1 animate-in fade-in slide-in-from-right-4">
                <AdvancedPaperTrading />
            </div>
        ) : (
            <div className="flex flex-col h-full space-y-6 animate-in fade-in slide-in-from-left-4">
                {/* HEADER: STREAK & XP BAR */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* 1. XP Card */}
                    <div className="bg-slate-900 rounded-2xl p-4 flex items-center justify-between shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Award size={64} className="text-indigo-500"/>
                        </div>
                        <div className="relative z-10">
                            <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">Current Rank</p>
                            <h2 className="text-xl font-black text-white">{level}</h2>
                        </div>
                        <div className="relative z-10 text-right">
                            <p className="text-2xl font-black text-indigo-400">{xp} XP</p>
                            <p className="text-[10px] text-slate-500">Next Rank: Fund Manager</p>
                        </div>
                    </div>

                    {/* 2. Streak Card */}
                    <div className="bg-gradient-to-r from-orange-500 to-rose-600 rounded-2xl p-4 flex items-center justify-between shadow-lg text-white relative overflow-hidden">
                        {streak > 0 && (
                            <div className="absolute -bottom-4 -right-4 text-white opacity-20 animate-pulse">
                                <Flame size={80} />
                            </div>
                        )}
                        <div>
                            <p className="text-xs font-bold text-orange-200 uppercase tracking-wider mb-1">Daily Streak</p>
                            <div className="flex items-baseline gap-2">
                                <h2 className="text-3xl font-black">{streak}</h2>
                                <span className="text-sm font-bold opacity-80">Days</span>
                            </div>
                        </div>
                        {streak >= 3 ? (
                            <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/30 text-center">
                                <p className="text-[10px] font-bold uppercase mb-0.5">Multiplier Active</p>
                                <p className="text-xl font-black flex items-center justify-center gap-1">
                                    <Zap size={16} className="fill-white"/> 1.5x
                                </p>
                            </div>
                        ) : (
                            <div className="text-right opacity-80">
                                <p className="text-xs">Reach 3 days</p>
                                <p className="text-xs font-bold">to unlock 1.5x XP</p>
                            </div>
                        )}
                    </div>

                    {/* 3. Progress Summary */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-center">
                        <div className="flex justify-between text-xs font-bold text-slate-500 uppercase mb-2">
                            <span>Sprint Progress</span>
                            <span>{Object.values(sprintProgress).filter((d: DayProgress) => d.completed).length} / 20</span>
                        </div>
                        <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-emerald-500 transition-all duration-1000" 
                                style={{width: `${(Object.values(sprintProgress).filter((d: DayProgress) => d.completed).length / 20) * 100}%`}}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* MAIN: SKILL MAP - FIXED SCROLLING */}
                <div className="flex-1 bg-slate-50/50 dark:bg-black/20 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 relative overflow-hidden flex flex-col">
                    
                    {/* Background Map Grid */}
                    <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #6366f1 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>

                    {/* Scrollable Container */}
                    <div className="flex-1 overflow-y-auto overflow-x-hidden pb-20 relative z-10 px-2 scroll-smooth">
                        <div className="max-w-4xl mx-auto space-y-12">
                            {PHASES.map((phase, pIdx) => (
                                <div key={phase.id} className="relative">
                                    {/* Phase Header */}
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className={`h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-700 to-transparent`}></div>
                                        <span className={`px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest text-white bg-gradient-to-r ${phase.color} shadow-lg`}>
                                            Phase {phase.id}: {phase.name}
                                        </span>
                                        <div className={`h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-700 to-transparent`}></div>
                                    </div>

                                    {/* Nodes Container */}
                                    <div className="flex flex-wrap justify-center gap-8 md:gap-16 relative">
                                        {/* Connecting Line (Simulated) */}
                                        {pIdx < PHASES.length && (
                                            <div className="absolute left-1/2 top-10 bottom-[-4rem] w-0.5 border-l-2 border-dashed border-slate-300 dark:border-slate-700 -z-10"></div>
                                        )}

                                        {phase.days.map((day) => {
                                            const data = sprintProgress[day];
                                            const isLocked = !data?.unlocked;
                                            const isCompleted = data?.completed;
                                            const isCurrent = !isLocked && !isCompleted;

                                            return (
                                                <motion.button
                                                    key={day}
                                                    whileHover={!isLocked ? { scale: 1.1 } : {}}
                                                    whileTap={!isLocked ? { scale: 0.95 } : {}}
                                                    onClick={() => !isLocked && setSelectedDay(day)}
                                                    className={`relative w-20 h-20 md:w-24 md:h-24 rounded-3xl flex flex-col items-center justify-center border-4 shadow-xl transition-all duration-300 z-10
                                                        ${isLocked 
                                                            ? 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-300 opacity-60 grayscale cursor-not-allowed backdrop-blur-sm' 
                                                            : isCompleted 
                                                                ? 'bg-emerald-500 border-emerald-400 text-white shadow-emerald-500/40' 
                                                                : 'bg-white dark:bg-slate-800 border-indigo-500 text-indigo-600 dark:text-indigo-400 shadow-indigo-500/30 animate-pulse-slow'
                                                        }
                                                    `}
                                                >
                                                    {isLocked ? (
                                                        <Lock size={24} />
                                                    ) : isCompleted ? (
                                                        <CheckCircle size={32} className="drop-shadow-md" />
                                                    ) : day === 10 ? (
                                                        <MonitorPlay size={32} className="text-cyan-500 animate-pulse"/>
                                                    ) : (
                                                        <span className="text-2xl md:text-3xl font-black">{day}</span>
                                                    )}
                                                    
                                                    {!isLocked && !isCompleted && (
                                                        <div className="absolute -bottom-2 bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                                                            Current
                                                        </div>
                                                    )}
                                                    
                                                    {/* Day Label tooltip-ish */}
                                                    <div className="absolute -bottom-8 w-32 text-center">
                                                        <span className={`text-[10px] font-bold uppercase ${isLocked ? 'text-slate-300' : isCompleted ? 'text-emerald-600 dark:text-emerald-500' : 'text-indigo-600 dark:text-indigo-400'}`}>
                                                            Day {day}
                                                        </span>
                                                    </div>
                                                </motion.button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                            
                            {/* End of Path */}
                            <div className="flex justify-center mt-12 pb-12">
                                <div className="bg-slate-900 text-slate-500 px-6 py-3 rounded-xl border border-dashed border-slate-700 text-xs font-mono">
                                    END OF SPRINT 1. MORE MODULES COMING SOON.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* MISSION MODAL */}
        <AnimatePresence>
            {selectedDay && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="bg-white dark:bg-slate-950 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
                    >
                        {/* Modal Header */}
                        <div className="bg-slate-100 dark:bg-slate-900 p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                                    <Map size={20} className="text-indigo-500"/> Day {selectedDay}
                                </h3>
                                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Mission Briefing</p>
                            </div>
                            <button 
                                onClick={() => setSelectedDay(null)}
                                className="p-2 bg-slate-200 dark:bg-slate-800 rounded-full hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                            >
                                <ArrowDown size={20} className="text-slate-500"/>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6">
                            {renderMissionContent(selectedDay)}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>

        {/* PAPER TRADING GYM SIMULATOR */}
        <PaperTradingGym 
            isOpen={isGymOpen} 
            onClose={() => setIsGymOpen(false)} 
            onComplete={handleGymComplete} 
        />

    </div>
  );
};

export default Academy;
