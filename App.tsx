import React, { useState, useEffect, useRef } from 'react';
import { GenerateContentResponse } from "@google/genai";
import { v4 as uuidv4 } from 'uuid'; 
import { 
  Menu, 
  Send, 
  Paperclip, 
  Image as ImageIcon,
  LogIn,
  LogOut,
  User as UserIcon,
  ShieldCheck,
  Loader2
} from 'lucide-react';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';

import Sidebar from './components/Sidebar';
import ChatMessage from './components/ChatMessage';
import { Message, ChatSession, Role, UserProfile, LanguageCode } from './types';
import { sendMessageStream, fileToGenerativePart, translateText } from './services/geminiService';
import { auth, googleProvider } from './services/firebase';
import { SUGGESTIONS, TRANSLATIONS, SUPPORTED_LANGUAGES } from './constants';

// Simple UUID polyfill if uuid lib isn't available in environment
const generateId = () => Math.random().toString(36).substring(2, 15);

const App: React.FC = () => {
  // -- State --
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null); // Null = Guest
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Language State
  const [language, setLanguage] = useState<LanguageCode>('en');

  // State for the single random suggestion
  const [randomSuggestion, setRandomSuggestion] = useState(SUGGESTIONS['en'][0]);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // -- Helper --
  const t = TRANSLATIONS[language];

  // -- Init --
  useEffect(() => {
    // 1. Load Sessions
    const savedSessions = localStorage.getItem('biodish_sessions');
    if (savedSessions) {
      setSessions(JSON.parse(savedSessions));
    }
    
    // 2. Auth Listener (Firebase)
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          id: firebaseUser.uid,
          name: firebaseUser.displayName || 'User',
          email: firebaseUser.email || '',
          avatarUrl: firebaseUser.photoURL || undefined
        });
      } else {
        setUser(null);
      }
    });

    // 3. Detect Language
    const browserLang = navigator.language.split('-')[0] as LanguageCode;
    if (SUPPORTED_LANGUAGES[browserLang]) {
      setLanguage(browserLang);
    }

    return () => unsubscribe();
  }, []);

  // Update random suggestion when language changes
  useEffect(() => {
    const list = SUGGESTIONS[language];
    setRandomSuggestion(list[Math.floor(Math.random() * list.length)]);
  }, [language]);

  // -- Translation Effect --
  useEffect(() => {
    const translateSessionMessages = async () => {
       if (!currentSessionId) return;

       const sessionIndex = sessions.findIndex(s => s.id === currentSessionId);
       if (sessionIndex === -1) return;

       const session = sessions[sessionIndex];
       
       const messagesToTranslate = session.messages.filter(
         msg => msg.text && (!msg.translations || !msg.translations[language])
       );

       if (messagesToTranslate.length === 0) return;
       
       setIsTranslating(true);

       try {
          const updatedMessagesMap = new Map<string, string>();
          
          await Promise.all(messagesToTranslate.map(async (msg) => {
            const translated = await translateText(msg.text, language);
            updatedMessagesMap.set(msg.id, translated);
          }));

          setSessions(prev => prev.map(s => {
            if (s.id === currentSessionId) {
              return {
                ...s,
                messages: s.messages.map(msg => {
                  if (updatedMessagesMap.has(msg.id)) {
                    return {
                      ...msg,
                      translations: {
                        ...msg.translations,
                        [language]: updatedMessagesMap.get(msg.id)!
                      }
                    };
                  }
                  return msg;
                })
              };
            }
            return s;
          }));
       } finally {
          setIsTranslating(false);
       }
    };

    translateSessionMessages();
  }, [language, currentSessionId]); 

  useEffect(() => {
    localStorage.setItem('biodish_sessions', JSON.stringify(sessions));
  }, [sessions]);

  // -- Computed --
  const currentSession = sessions.find(s => s.id === currentSessionId);
  const messages = currentSession?.messages || [];

  // -- Handlers --

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed:", error);
      alert("Login failed. Please check the console for details.");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Optional: Clear sessions on logout if desired
      // setSessions([]); 
      // setCurrentSessionId(null);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: generateId(),
      title: t.newChat,
      messages: [],
      lastUpdated: Date.now()
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    return newSession.id;
  };

  const handleSend = async (overrideText?: string) => {
    const textToSend = overrideText || input;
    if ((!textToSend.trim() && !selectedFile) || isLoading) return;

    let activeSessionId = currentSessionId;
    if (!activeSessionId) {
      activeSessionId = createNewSession();
    }

    let base64Image: string | undefined = undefined;
    if (selectedFile) {
      try {
        base64Image = await fileToGenerativePart(selectedFile);
      } catch (e) {
        console.error("Failed to process image", e);
        return;
      }
    }

    const userMessage: Message = {
      id: generateId(),
      role: Role.USER,
      text: textToSend,
      timestamp: Date.now(),
      imageUrl: base64Image,
      translations: { [language]: textToSend } 
    };

    setSessions(prev => prev.map(session => {
      if (session.id === activeSessionId) {
        return {
          ...session,
          messages: [...session.messages, userMessage],
          title: session.messages.length === 0 ? textToSend.slice(0, 30) : session.title
        };
      }
      return session;
    }));

    setInput('');
    setSelectedFile(null);
    setIsLoading(true);

    const botMessageId = generateId();
    const botMessage: Message = {
      id: botMessageId,
      role: Role.MODEL,
      text: '', 
      timestamp: Date.now(),
      translations: {}
    };

    setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: [...s.messages, botMessage] } : s));

    try {
      const currentMessages = sessions.find(s => s.id === activeSessionId)?.messages || [];
      const history = [...currentMessages, userMessage]; 
      
      const stream = await sendMessageStream(
        history, 
        textToSend, 
        language, 
        base64Image, 
        selectedFile?.type
      );

      let fullText = '';

      for await (const chunk of stream) {
         const content = chunk as GenerateContentResponse;
         const chunkText = content.text;
         
         if (chunkText) {
            fullText += chunkText;
            setSessions(prev => prev.map(s => {
              if (s.id === activeSessionId) {
                const newMessages = s.messages.map(m => 
                  m.id === botMessageId ? { 
                    ...m, 
                    text: fullText,
                    translations: { ...m.translations, [language]: fullText } 
                  } : m
                );
                return { ...s, messages: newMessages };
              }
              return s;
            }));
         }
      }

    } catch (error) {
      console.error("Gemini Error:", error);
      setSessions(prev => prev.map(s => {
        if (s.id === activeSessionId) {
          const newMessages = s.messages.map(m => 
            m.id === botMessageId ? { 
              ...m, 
              text: t.errorGeneric,
              isError: true 
            } : m
          );
          return { ...s, messages: newMessages };
        }
        return s;
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessions(prev => prev.filter(s => s.id !== id));
    if (currentSessionId === id) setCurrentSessionId(null);
  };

  const handleScrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    handleScrollToBottom();
  }, [messages, isLoading, isTranslating]);

  return (
    <div className="flex h-screen bg-white overflow-hidden font-sans">
      
      {/* Sidebar */}
      <Sidebar 
        isOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={setCurrentSessionId}
        onNewChat={() => setCurrentSessionId(null)}
        onDeleteSession={handleDeleteSession}
        language={language}
        onLanguageChange={setLanguage}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative">
        
        {/* Header */}
        <header className="h-14 md:h-16 flex items-center justify-between px-4 border-b border-gray-100 bg-white/80 backdrop-blur-sm z-10 absolute top-0 w-full">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-md"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2 text-teal-700 font-bold text-lg">
              <ShieldCheck size={24} />
              <span>BioDish</span>
            </div>
          </div>

          <div>
            {!user ? (
              <button 
                onClick={handleLogin}
                className="text-xs md:text-sm bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-full font-medium transition-colors flex items-center gap-2"
              >
                <span>{t.login}</span>
                <LogIn size={16} />
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-700 hidden md:inline">{user.name}</span>
                  {user.avatarUrl ? (
                    <img 
                      src={user.avatarUrl} 
                      alt={user.name} 
                      className="w-8 h-8 rounded-full border border-teal-200 object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 border border-teal-200">
                      <UserIcon size={16} />
                    </div>
                  )}
                </div>
                <button 
                  onClick={handleLogout}
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                  title={t.logout}
                >
                  <LogOut size={18} />
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Translation Indicator Banner */}
        {isTranslating && (
          <div className="absolute top-14 md:top-16 left-0 w-full z-20 bg-teal-50/95 backdrop-blur-sm border-b border-teal-100 py-2 px-4 flex items-center justify-center gap-2 shadow-sm transition-all animate-in slide-in-from-top-2">
            <Loader2 size={14} className="animate-spin text-teal-600" />
            <span className="text-xs font-medium text-teal-700">{t.translating}</span>
          </div>
        )}

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto pt-16 pb-32 scroll-smooth">
          {messages.length === 0 ? (
            // Empty State
            <div className="min-h-full flex flex-col items-center justify-center p-6 text-center max-w-xl mx-auto">
              <div className="bg-teal-50 p-4 rounded-full mb-6 mt-4 shadow-sm">
                <ShieldCheck size={48} className="text-teal-600" />
              </div>
              <h2 className="text-2xl font-semibold text-slate-800 mb-2">
                {t.welcomeTitle}
              </h2>
              <p className="text-slate-500 mb-8 leading-relaxed">
                {t.welcomeDesc}
              </p>

              {/* Single Suggestion */}
              <div className="w-full mb-8">
                  <button 
                    onClick={() => handleSend(randomSuggestion.prompt)}
                    className="w-full p-4 bg-white border border-slate-200 rounded-xl hover:border-teal-300 hover:shadow-md transition-all text-left text-sm text-slate-700"
                  >
                    "{randomSuggestion.prompt}"
                  </button>
              </div>
              
              {/* Disclaimer */}
              <div className="text-xs text-slate-400 bg-yellow-50 p-3 rounded-lg border border-yellow-100 w-full">
                <strong>{t.disclaimerLabel}</strong> {t.disclaimerText}
              </div>
            </div>
          ) : (
            // Message List
            <div className="flex flex-col">
              {messages.map((msg) => (
                <ChatMessage 
                  key={msg.id} 
                  message={msg} 
                  userLabel={t.you} 
                  language={language}
                  isTranslating={isTranslating} 
                />
              ))}
              {isLoading && (
                <div className="w-full py-6 px-4">
                  <div className="max-w-3xl mx-auto flex gap-4">
                    <div className="w-8 h-8 bg-teal-600 rounded-sm flex items-center justify-center">
                       <ShieldCheck size={16} className="text-white animate-pulse" />
                    </div>
                    <div className="flex items-center gap-1 h-6">
                       <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                       <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></span>
                       <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="absolute bottom-0 left-0 w-full bg-white bg-opacity-90 backdrop-blur-md border-t border-slate-100 p-4">
          <div className="max-w-3xl mx-auto">
            {/* File Preview */}
            {selectedFile && (
               <div className="flex items-center gap-2 mb-2 p-2 bg-slate-100 rounded-lg w-fit">
                  <ImageIcon size={16} className="text-slate-500" />
                  <span className="text-xs text-slate-700 max-w-[200px] truncate">{selectedFile.name}</span>
                  <button onClick={() => setSelectedFile(null)} className="text-slate-400 hover:text-red-500 ml-2">x</button>
               </div>
            )}

            <div className="relative flex items-end gap-2 bg-white border border-slate-300 rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-teal-500 p-2">
              {/* File Upload Trigger */}
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-slate-400 hover:text-teal-600 transition-colors"
                title="Upload Medical Report (PDF/Image)"
              >
                <Paperclip size={20} />
              </button>
              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden"
                accept="image/*,application/pdf"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setSelectedFile(e.target.files[0]);
                  }
                }}
              />

              {/* Text Input */}
              <textarea
                className="flex-1 max-h-32 min-h-[44px] bg-transparent border-none focus:ring-0 outline-none resize-none py-3 text-slate-700 placeholder:text-slate-400"
                placeholder={t.inputPlaceholder}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />

              {/* Send Button */}
              <button 
                onClick={() => handleSend()}
                disabled={isLoading || (!input.trim() && !selectedFile)}
                className={`
                  p-2 rounded-lg mb-1 transition-all
                  ${(input.trim() || selectedFile) && !isLoading 
                    ? 'bg-teal-600 text-white hover:bg-teal-700' 
                    : 'bg-slate-100 text-slate-300 cursor-not-allowed'}
                `}
              >
                <Send size={18} />
              </button>
            </div>
            {messages.length === 0 && (
              <div className="text-center mt-2 text-[10px] text-slate-400">
                {t.disclaimerText}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;