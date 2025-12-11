import React, { useState, useRef, useEffect } from 'react';
import { ChatSession, LanguageCode } from '../types';
import { Plus, MessageSquare, Trash2, Menu, Globe, Check } from 'lucide-react';
import { TRANSLATIONS, SUPPORTED_LANGUAGES } from '../constants';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  language: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  toggleSidebar,
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  language,
  onLanguageChange
}) => {
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const t = TRANSLATIONS[language];
  const langMenuRef = useRef<HTMLDivElement>(null);

  // Close language menu if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setShowLanguageMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-slate-100 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0
        flex flex-col h-full border-r border-slate-700
      `}>
        
        {/* Header / New Chat */}
        <div className="p-4 border-b border-slate-700">
          <button
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 768) toggleSidebar();
            }}
            className="w-full flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-3 rounded-lg transition-colors font-medium"
          >
            <Plus size={20} />
            <span>{t.newChat}</span>
          </button>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessions.length === 0 ? (
            <div className="text-slate-500 text-sm text-center mt-4">{t.noHistory}</div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => {
                  onSelectSession(session.id);
                  if (window.innerWidth < 768) toggleSidebar();
                }}
                className={`
                  group flex items-center justify-between p-3 rounded-lg cursor-pointer text-sm transition-colors
                  ${currentSessionId === session.id ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800'}
                `}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <MessageSquare size={16} className="flex-shrink-0" />
                  <span className="truncate whitespace-nowrap overflow-hidden">
                    {session.title || t.newChat}
                  </span>
                </div>
                
                <button
                  onClick={(e) => onDeleteSession(session.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
                  title={t.deleteChat}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer / User Info & Language */}
        <div className="p-4 border-t border-slate-700 text-xs text-slate-400 relative" ref={langMenuRef}>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-300">{t.version}</p>
              <p>{t.role}</p>
            </div>
            
            <button 
              onClick={() => setShowLanguageMenu(!showLanguageMenu)}
              className="p-2 hover:bg-slate-800 rounded-md text-slate-300 hover:text-white transition-colors"
              title="Change Language"
            >
              <Globe size={18} />
            </button>
          </div>

          {/* Language Popover */}
          {showLanguageMenu && (
            <div className="absolute bottom-full right-4 mb-2 w-40 bg-slate-800 border border-slate-600 rounded-lg shadow-xl overflow-hidden z-50">
              {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
                <button
                  key={code}
                  onClick={() => {
                    onLanguageChange(code as LanguageCode);
                    setShowLanguageMenu(false);
                  }}
                  className={`
                    w-full text-left px-4 py-2 text-sm flex items-center justify-between hover:bg-slate-700 transition-colors
                    ${language === code ? 'text-teal-400 font-medium' : 'text-slate-300'}
                  `}
                >
                  <span>{name}</span>
                  {language === code && <Check size={14} />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;
