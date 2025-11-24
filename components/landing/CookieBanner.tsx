
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie } from 'lucide-react';
import { useLanguage } from './context/LanguageContext';

export const CookieBanner: React.FC = () => {
  const { t } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const choice = localStorage.getItem('blex_cookie_consent');
    if (!choice) {
      const timer = setTimeout(() => setIsVisible(true), 1500); // Small delay for effect
      return () => clearTimeout(timer);
    }
  }, []);

  const handleChoice = (choice: 'accepted' | 'declined') => {
    localStorage.setItem('blex_cookie_consent', choice);
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="fixed bottom-0 left-0 right-0 z-[60] p-4 flex justify-center pointer-events-none"
        >
          <div className="pointer-events-auto bg-[#0a0a0c]/80 backdrop-blur-xl border-t border-x border-white/10 rounded-t-2xl md:rounded-2xl p-6 shadow-[0_-5px_20px_rgba(0,0,0,0.5)] max-w-2xl w-full flex flex-col md:flex-row items-center gap-6 relative overflow-hidden group">

            {/* Top Neon Line */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-brand-purple to-transparent opacity-50"></div>

            <div className="p-3 bg-brand-purple/10 rounded-lg text-brand-purple shrink-0">
              <Cookie size={24} />
            </div>

            <p className="text-gray-300 text-sm leading-relaxed text-center md:text-left flex-grow">
              {t.cookies.text}
            </p>

            <div className="flex gap-3 shrink-0">
              <button
                onClick={() => handleChoice('declined')}
                className="px-4 py-2 text-xs font-medium text-gray-400 hover:text-white transition-colors border border-transparent hover:border-white/10 rounded-lg"
              >
                {t.cookies.decline}
              </button>
              <button
                onClick={() => handleChoice('accepted')}
                className="px-6 py-2 bg-brand-purple hover:bg-brand-purple/90 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-neon-purple transition-all hover:scale-105"
              >
                {t.cookies.accept}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
