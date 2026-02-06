import React, { useState, useRef, useEffect } from 'react';
import { useToast } from '../shared/ToastProvider';
import {
    Mic, Loader2, FileText, MessageSquare, History, Trash2
} from 'lucide-react';
import { Investment } from '../../types';
import * as AIService from '../../services/aiService';
import { chatWithGroq, streamChatWithGroq } from '../../services/groqService';
import { SEBI_COMPLIANCE_CORE } from '../../services/aiService';
import { blobToBase64, compressImage } from '../../utils/helpers';
import { useConversations } from '../../hooks/useConversations';
import { ConversationsSidebar } from '../ai/ConversationsSidebar';
import { type AdvisorData } from '../ai';

// --- Sub Components ---
import { ModelSelector, PersonaSelector, PERSONAS } from './advisor/HeaderControls';
import { ChatInterface } from './advisor/ChatInterface';
import { VoiceInterface } from './advisor/VoiceInterface';

interface AdvisorTabProps {
    investments: Investment[];
    totalNetWorth: string;
    onNavigate: (tab: string) => void;
}

// --- Helper: Context Aware Prompts ---
const getContextAwarePrompts = (investments: Investment[], netWorth: string) => {
    const prompts = ["Analyze my risk exposure", "Upload Chart Screenshot"];

    // 1. Check for high cash (Opportunity)
    const cash = investments.find(i => i.type === 'Cash/Bank')?.currentValue || 0;
    const total = parseFloat(netWorth.replace(/[^0-9.-]+/g, ""));
    if (total > 0 && (cash / total) > 0.2) {
        prompts.push("Where should I deploy my idle cash?");
    }

    // 2. Check for crypto exposure (Risk)
    const crypto = investments.filter(i => i.type === 'Crypto').reduce((acc, i) => acc + i.currentValue, 0);
    if (total > 0 && (crypto / total) > 0.15) {
        prompts.push("Is my crypto allocation too high?");
    }

    // 3. Tax Season (Time based - simplified)
    const month = new Date().getMonth();
    if (month >= 0 && month <= 2) { // Jan-Mar
        prompts.push("How to save tax before March 31?");
    }

    // 4. Default fallback
    if (prompts.length < 4) {
        prompts.push("Review portfolio diversity");
    }

    return prompts.slice(0, 4);
};

// --- Main Advisor Component ---

const AdvisorTab: React.FC<AdvisorTabProps> = ({ investments, totalNetWorth, onNavigate }) => {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState<'CHAT' | 'VOICE'>('CHAT');
    const contextPrompts = useRef(getContextAwarePrompts(investments, totalNetWorth)).current;

    // Voice State
    const [isLiveSessionActive, setIsLiveSessionActive] = useState(false);
    const [advisorData, setAdvisorData] = useState<AdvisorData | null>(null);
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);
    const liveSessionRef = useRef<AIService.LiveVoiceSession | null>(null);

    // Chat State
    const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'model', text?: string, image?: string | null }[]>(() => {
        const saved = localStorage.getItem('advisor_chat_history');
        return saved ? JSON.parse(saved) : [];
    });
    const [selectedModelId, setSelectedModelId] = useState('gemini-2.5-flash');
    const [selectedPersonaId, setSelectedPersonaId] = useState('standard');
    const [isSending, setIsSending] = useState(false);
    const [chatImage, setChatImage] = useState<string | null>(null);

    // Conversation Memory
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const {
        conversations,
        activeConversation,
        createConversation,
        loadConversation,
        deleteConversation,
        renameConversation,
    } = useConversations(selectedPersonaId);

    useEffect(() => {
        liveSessionRef.current = new AIService.LiveVoiceSession();
        return () => {
            liveSessionRef.current?.stop();
        };
    }, []);

    // Persist Chat History
    useEffect(() => {
        localStorage.setItem('advisor_chat_history', JSON.stringify(chatMessages));
    }, [chatMessages]);

    // Persist Advisor Data (Audit Report)
    useEffect(() => {
        if (advisorData) {
            localStorage.setItem('advisor_report_data', JSON.stringify(advisorData));
        }
    }, [advisorData]);

    // Load Advisor Data on Mount
    useEffect(() => {
        const savedReport = localStorage.getItem('advisor_report_data');
        if (savedReport) {
            try {
                setAdvisorData(JSON.parse(savedReport));
            } catch (e) {
                console.error("Failed to load saved report", e);
            }
        }
    }, []);

    const handleClearChat = () => {
        setChatMessages([]);
        setAdvisorData(null);
        localStorage.removeItem('advisor_chat_history');
        localStorage.removeItem('advisor_report_data');
        toast.success("Chat history & reports cleared");
    };

    // --- Voice Handlers ---
    const handleToggleLiveSession = async () => {
        if (isLiveSessionActive) {
            liveSessionRef.current?.stop();
            setIsLiveSessionActive(false);
        } else {
            try {
                const persona = PERSONAS.find(p => p.id === selectedPersonaId) || PERSONAS[0];
                const systemInstructions = `${persona.prompt} Net Worth: ${totalNetWorth}. Portfolio: ${JSON.stringify(investments)}. Answer questions concisely.`;
                await liveSessionRef.current?.start(systemInstructions);
                setIsLiveSessionActive(true);
            } catch (e) {
                console.error("Live Session Start Error:", e);
                toast.error('Failed to connect to Gemini Live. Please check your API key.');
                setIsLiveSessionActive(false);
            }
        }
    };

    const handleGenerateReport = async () => {
        setIsGeneratingReport(true);
        setAdvisorData(null);
        try {
            const prompt = `
            Role: Senior Wealth Manager. Context: Portfolio: ${JSON.stringify(investments)}. Net Worth: ${totalNetWorth}.
            Task: Audit portfolio. Output JSON schema: { "grades": { "diversification": "Grade", "riskProfile": "Grade", "assetQuality": "Grade" }, "summary": "text", "risks": ["text"], "opportunities": ["text"], "actions": ["text"] }
          `;
            const rawResponse = await AIService.askGemini(prompt, true);
            const cleanJson = rawResponse.replace(/```json|```/g, '').trim();
            const parsedData = JSON.parse(cleanJson);
            setAdvisorData(parsedData);

            setChatMessages(prev => [...prev, { role: 'model', text: "I've generated a comprehensive portfolio audit report for you.", image: null }]);
        } catch (e) {
            console.error("Report Failed", e);
            setChatMessages(prev => [...prev, { role: 'model', text: "Error generating report. Please try again later.", image: null }]);
        } finally {
            setIsGeneratingReport(false);
        }
    };

    const handleSendMessage = async (userText: string, userImage: string | null) => {
        setChatImage(null);
        setIsSending(true);

        const newHistory = [...chatMessages, { role: 'user' as const, text: userText, image: userImage }];
        setChatMessages(newHistory);

        // Add placeholder for streaming response
        const streamingIndex = newHistory.length;
        setChatMessages(prev => [...prev, { role: 'model', text: '', image: null }]);

        try {
            const apiHistory = chatMessages.map(msg => ({
                role: msg.role,
                parts: msg.image
                    ? [{ inlineData: { mimeType: 'image/png', data: msg.image.split(',')[1] } }, { text: msg.text || '' }]
                    : [{ text: msg.text || '' }]
            }));

            const apiMessage = userImage
                ? [{ inlineData: { mimeType: 'image/png', data: userImage.split(',')[1] } }, { text: userText || 'Analyze this image' }]
                : userText;

            const persona = PERSONAS.find(p => p.id === selectedPersonaId) || PERSONAS[0];
            const systemContext = `${persona.prompt}\n\n${SEBI_COMPLIANCE_CORE}\n\nUSER PORTFOLIO:\nNet Worth: ${totalNetWorth}\nHoldings: ${JSON.stringify(investments.map(i => ({ name: i.name, type: i.type, val: i.currentValue })))}`;

            // Stream handler: Update message as tokens arrive
            const onToken = (_token: string, fullText: string) => {
                setChatMessages(prev => {
                    const updated = [...prev];
                    updated[streamingIndex] = { role: 'model', text: fullText, image: null };
                    return updated;
                });
            };

            const onComplete = (fullText: string) => {
                setChatMessages(prev => {
                    const updated = [...prev];
                    updated[streamingIndex] = { role: 'model', text: fullText, image: null };
                    return updated;
                });
                setIsSending(false);
            };

            const onError = (error: Error) => {
                setChatMessages(prev => {
                    const updated = [...prev];
                    updated[streamingIndex] = { role: 'model', text: `Error: ${error.message || "Unable to process request."}`, image: null };
                    return updated;
                });
                setIsSending(false);
            };

            // Route to appropriate streaming provider
            if (selectedModelId.startsWith('groq:')) {
                const groqModel = selectedModelId.replace('groq:', '');
                const groqHistory = chatMessages.map(msg => ({
                    role: msg.role as 'user' | 'assistant',
                    content: msg.text || ''
                }));
                await streamChatWithGroq(groqModel, groqHistory, userText, systemContext, onToken, onComplete, onError);
            } else {
                await AIService.streamChatWithGemini(selectedModelId, apiHistory, apiMessage, systemContext, onToken, onComplete, onError);
            }
        } catch (error: any) {
            console.error("Chat Error", error);
            setChatMessages(prev => {
                const updated = [...prev];
                updated[streamingIndex] = { role: 'model', text: `Error: ${error.message || "Unable to process request."}`, image: null };
                return updated;
            });
            setIsSending(false);
        }
    };

    const renderHeader = () => (
        <div className="flex items-center justify-between px-4 py-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm z-30 relative shrink-0">
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                <button
                    onClick={() => setActiveTab('CHAT')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'CHAT' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'}`}
                >
                    <MessageSquare size={14} /> Chat
                </button>
                <button
                    onClick={() => setActiveTab('VOICE')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'VOICE' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'}`}
                >
                    <Mic size={14} /> Voice
                </button>
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className={`p-2 rounded-lg transition-colors ${isSidebarOpen
                        ? 'text-indigo-600 bg-indigo-100 dark:bg-indigo-500/20'
                        : 'text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                    title="Conversation History"
                >
                    <History size={16} />
                </button>
                {chatMessages.length > 0 && (
                    <button
                        onClick={handleClearChat}
                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                        title="Clear Chat History"
                    >
                        <Trash2 size={16} />
                    </button>
                )}
                <PersonaSelector selected={selectedPersonaId} onSelect={setSelectedPersonaId} />
                <ModelSelector selected={selectedModelId} onSelect={setSelectedModelId} />
                <button
                    onClick={handleGenerateReport}
                    disabled={isGeneratingReport}
                    className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors flex items-center gap-1 shadow-sm"
                >
                    {isGeneratingReport ? <Loader2 size={12} className="animate-spin" /> : <FileText size={12} />} Audit Report
                </button>
            </div>
        </div>
    );

    return (
        <div className="-m-4 md:-m-8 h-[calc(100vh-4rem)] flex flex-col relative bg-slate-50 dark:bg-slate-950">
            {activeTab === 'CHAT' ? (
                <ChatInterface
                    chatMessages={chatMessages}
                    advisorData={advisorData}
                    isGeneratingReport={isGeneratingReport}
                    isSending={isSending}
                    investments={investments}
                    totalNetWorth={totalNetWorth}
                    contextPrompts={contextPrompts}
                    onNavigate={onNavigate}
                    onSendMessage={handleSendMessage}
                    onClearReport={() => setAdvisorData(null)}
                    renderHeader={renderHeader}
                    isSidebarOpen={isSidebarOpen}
                    SidebarComponent={
                        <div className="w-72 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shrink-0 h-full">
                            <ConversationsSidebar
                                conversations={conversations}
                                activeConversationId={activeConversation?.id || null}
                                onSelect={loadConversation}
                                onNew={() => createConversation(selectedPersonaId)}
                                onDelete={deleteConversation}
                                onRename={renameConversation}
                            />
                        </div>
                    }
                    setChatImage={setChatImage}
                    chatImage={chatImage}
                    compressImage={compressImage}
                    blobToBase64={blobToBase64}
                />
            ) : (
                <VoiceInterface
                    isLiveSessionActive={isLiveSessionActive}
                    onToggleSession={handleToggleLiveSession}
                    renderHeader={renderHeader}
                />
            )}
        </div>
    );
};

// Wrap with React.memo to prevent unnecessary re-renders
export default React.memo(AdvisorTab);
