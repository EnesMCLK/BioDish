import React from 'react';
import { Message, Role, LanguageCode } from '../types';
import { ShieldCheck, AlertCircle } from 'lucide-react';

// Enhanced simple markdown parser to handle bullets and bold text
const SimpleMarkdown: React.FC<{ text: string }> = ({ text }) => {
  const lines = text.split('\n');

  const parseInline = (text: string) => {
    // Split by bold markers
    return text.split(/(\*\*.*?\*\*)/g).map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="space-y-1">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        
        // Handle Headings
        // Check for #### first, then ###, etc. although checking specific startsWith is safe
        if (trimmed.startsWith('#### ')) {
          return <h4 key={idx} className="text-sm font-bold text-slate-700 mt-3 mb-1 uppercase tracking-wide">{parseInline(trimmed.slice(5))}</h4>;
        }
        if (trimmed.startsWith('### ')) {
          return <h3 key={idx} className="text-base font-bold text-teal-700 mt-4 mb-2">{parseInline(trimmed.slice(4))}</h3>;
        }
        if (trimmed.startsWith('## ')) {
          return <h2 key={idx} className="text-lg font-bold text-teal-800 mt-5 mb-3">{parseInline(trimmed.slice(3))}</h2>;
        }
        if (trimmed.startsWith('# ')) {
          return <h1 key={idx} className="text-xl font-bold text-slate-900 mt-6 mb-4">{parseInline(trimmed.slice(2))}</h1>;
        }

        // Handle Bullet Points (* or -)
        if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
          return (
            <div key={idx} className="flex items-start gap-2.5 ml-1 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-teal-500 flex-shrink-0 mt-2.5"></div>
              <div className="flex-1">{parseInline(trimmed.slice(2))}</div>
            </div>
          );
        }
        
        // Handle Numbered Lists (Basic support for "1. ", "2. ")
        if (/^\d+\.\s/.test(trimmed)) {
          const content = trimmed.replace(/^\d+\.\s/, '');
          return (
             <div key={idx} className="flex items-start gap-2.5 ml-1 mb-1">
               <span className="text-teal-600 font-bold text-xs mt-1 min-w-[12px]">{trimmed.match(/^\d+/)?.[0]}.</span>
               <div className="flex-1">{parseInline(content)}</div>
             </div>
          );
        }

        // Handle empty lines
        if (!trimmed) {
          return <div key={idx} className="h-2"></div>;
        }

        // Regular paragraph
        return (
          <p key={idx} className="min-h-[1rem] mb-1">
            {parseInline(line)}
          </p>
        );
      })}
    </div>
  );
};

interface ChatMessageProps {
  message: Message;
  userLabel?: string;
  language?: LanguageCode;
  isTranslating?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, userLabel, language = 'en', isTranslating = false }) => {
  const isUser = message.role === Role.USER;
  const isError = message.isError;
  
  // Use translation if available for the current language, otherwise fallback to original text
  const contentText = message.translations?.[language] || message.text;
  
  // Check if this specific message is waiting for translation (translating global flag is on, but this lang is missing)
  const isPendingTranslation = isTranslating && !message.translations?.[language];

  return (
    <div className={`
        w-full py-6 md:py-8 border-b border-black/5 
        ${isUser ? 'bg-white' : isError ? 'bg-red-50/50' : 'bg-slate-50'}
        ${isPendingTranslation ? 'animate-pulse opacity-70 transition-opacity duration-500' : 'transition-opacity duration-500'}
    `}>
      <div className="max-w-3xl mx-auto flex gap-4 md:gap-6 px-4">
        {/* Avatar Area - Preserving width for alignment even if empty for user */}
        <div className="flex-shrink-0 flex flex-col relative items-end w-8">
          {!isUser && (
            <div className={`
              w-8 h-8 rounded-sm flex items-center justify-center
              ${isError ? 'bg-red-500' : 'bg-teal-600'}
            `}>
              <ShieldCheck size={20} className="text-white" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="relative flex-1 overflow-hidden">
          <div className="font-semibold text-sm mb-1 opacity-90">
            {isUser ? (userLabel || 'You') : 'BioDish'}
          </div>
          
          {message.imageUrl && (
            <div className="mb-4">
               <img 
                 src={`data:image/jpeg;base64,${message.imageUrl}`} 
                 alt="Uploaded content" 
                 className="max-w-xs rounded-lg border border-slate-200 shadow-sm"
               />
            </div>
          )}

          {isError ? (
            <div className="bg-white border border-red-200 rounded-lg p-4 shadow-sm inline-block max-w-full">
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-red-800 font-medium text-sm mb-1">Unable to complete request</h4>
                  <p className="text-red-600 text-sm leading-relaxed">
                    {contentText}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="prose prose-slate max-w-none text-slate-800 leading-7">
              <SimpleMarkdown text={contentText} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;