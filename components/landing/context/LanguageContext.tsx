import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, Translations } from '../types';
import { TRANSLATIONS } from '../constants';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('es');

  useEffect(() => {
    // 1. Check Local Storage first (user preference)
    const savedLang = localStorage.getItem('blex_lang') as Language;
    
    if (savedLang && ['es', 'en', 'pt'].includes(savedLang)) {
      setLanguageState(savedLang);
    } else {
      // 2. Auto-detect browser language/region
      const browserLang = navigator.language || navigator.languages?.[0] || '';
      const langCode = browserLang.split('-')[0].toLowerCase(); // 'en-US' -> 'en', 'pt-BR' -> 'pt'

      if (langCode === 'pt') {
        setLanguageState('pt');
      } else if (langCode === 'en') {
        setLanguageState('en');
      } else if (langCode === 'es') {
        setLanguageState('es');
      } else {
        // Fallback to Spanish if language is not supported
        setLanguageState('es');
      }
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('blex_lang', lang);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: TRANSLATIONS[language] }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within a LanguageProvider");
  return context;
};