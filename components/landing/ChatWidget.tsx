import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Minimize2, Loader2 } from 'lucide-react';
import { useLanguage } from './context/LanguageContext';
import { chatWithLexi } from './services/geminiService';
import { Message } from './types';
import { motion, AnimatePresence } from 'framer-motion';

const LEXY_AVATAR = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200&h=200";

export const ChatWidget: React.FC = () => {
  const { t, language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial Welcome Message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{ role: 'model', content: t.chat.welcome }]);
    }
  }, [isOpen, t.chat.welcome]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userText = inputValue;
    setInputValue('');
    const newHistory: Message[] = [...messages, { role: 'user', content: userText }];
    setMessages(newHistory);
    setIsLoading(true);

    try {
      const responseText = await chatWithLexi(userText, messages, language);
      setMessages([...newHistory, { role: 'model', content: responseText }]);
    } catch (e) {
      setMessages([...newHistory, { role: 'model', content: "Sorry, connection error." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestion = (suggestion: string) => {
    setInputValue(suggestion);
  };

  return (
    <>
      {/* Trigger Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        initial={{ scale: 0 }}
        animate={{ scale: isOpen ? 0 : 1 }}
        className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-40 flex items-center gap-3 bg-white text-black pl-2 pr-6 py-2 rounded-full shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-105 transition-transform group"
      >
        <div className="relative">
          <img
            src={LEXY_AVATAR}
            alt="Lexy AI"
            className="w-10 h-10 rounded-full object-cover border-2 border-brand-purple"
          />
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
        </div>
        <div className="flex flex-col items-start">
          <span className="font-bold text-sm leading-tight">{t.chat.badge}</span>
          <span className="text-[10px] text-gray-500 leading-tight font-medium">Online</span>
        </div>
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-4 right-4 md:bottom-6 md:right-6 w-[calc(100vw-32px)] md:w-[400px] h-[600px] max-h-[80vh] bg-[#0a0a0c]/95 backdrop-blur-2xl rounded-3xl flex flex-col overflow-hidden z-50 shadow-2xl border border-white/20"
          >
            {/* Header */}
            <div className="p-4 bg-[#0f0f12] border-b border-white/10 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={LEXY_AVATAR}
                    alt="Lexy"
                    className="w-10 h-10 rounded-full object-cover border border-white/20"
                  />
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-[#1a1a20]"></div>
                </div>
                <div>
                  <h3 className="font-bold text-white">Lexy AI</h3>
                  <p className="text-xs text-brand-cyan flex items-center gap-1">
                    <span className="w-1 h-1 bg-brand-cyan rounded-full animate-pulse"></span>
                    Paralegal Virtual
                  </p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors">
                <Minimize2 size={18} />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start items-end gap-2'}`}>
                  {msg.role === 'model' && (
                    <img src={LEXY_AVATAR} alt="Lexy" className="w-6 h-6 rounded-full object-cover mb-1 hidden sm:block opacity-70" />
                  )}
                  <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                    ? 'bg-brand-purple text-white rounded-br-none'
                    : 'bg-[#1a1a20] text-gray-200 rounded-bl-none border border-white/10'
                    }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start items-end gap-2">
                  <img src={LEXY_AVATAR} alt="Lexy" className="w-6 h-6 rounded-full object-cover mb-1 hidden sm:block opacity-70" />
                  <div className="bg-[#1a1a20] p-4 rounded-2xl rounded-bl-none flex gap-2 items-center border border-white/10">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                    <span className="text-xs text-gray-400">Lexy está escribiendo...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions */}
            {messages.length < 3 && (
              <div className="px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-hide">
                {t.chat.suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestion(s)}
                    className="whitespace-nowrap px-3 py-1.5 bg-[#1a1a20] hover:bg-white/10 border border-white/10 rounded-full text-xs text-gray-300 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Input Area */}
            <div className="p-4 bg-[#0f0f12] border-t border-white/10">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={t.chat.placeholder}
                  className="w-full bg-[#050505] border border-white/10 rounded-full pl-4 pr-12 py-3 text-sm text-white focus:outline-none focus:border-brand-purple transition-colors"
                />
                <button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isLoading}
                  className="absolute right-2 p-2 bg-brand-purple rounded-full text-white disabled:opacity-50 hover:scale-105 transition-transform"
                >
                  <Send size={16} />
                </button>
              </div>
              <div className="text-center mt-2">
                <p className="text-[10px] text-gray-500">Powered by Gemini 2.0 • Lexy es una IA.</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};