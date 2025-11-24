
import React, { useState, useEffect } from 'react';
import { Menu, X, Globe } from 'lucide-react';
import { useLanguage } from './context/LanguageContext';
import { View } from './types';

interface HeaderProps {
  onNavigate: (view: View) => void;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate }) => {
  const { t } = useLanguage();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'glass py-4' : 'bg-transparent py-6'}`}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <div
          className="flex items-center gap-2 cursor-pointer group"
          onClick={() => {
            onNavigate('home');
            window.scrollTo(0, 0);
          }}
        >
          <div className="w-10 h-10 bg-gradient-purple rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
            <Globe className="text-white w-6 h-6" />
          </div>
          <span className="text-2xl font-display font-bold text-white tracking-tight">
            Blex
          </span>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          <button onClick={() => onNavigate('home')} className="text-gray-300 hover:text-white transition-colors text-sm font-medium">{t.nav.home}</button>
          <button onClick={() => onNavigate('solutions')} className="text-gray-300 hover:text-white transition-colors text-sm font-medium">{t.nav.features}</button>
          <button
            onClick={() => {
              onNavigate('home');
              // Small delay to ensure view switch happened
              setTimeout(() => {
                const el = document.getElementById('pricing');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}
            className="text-gray-300 hover:text-white transition-colors text-sm font-medium"
          >
            {t.nav.pricing}
          </button>
          <button onClick={() => onNavigate('who-we-are')} className="text-gray-300 hover:text-white transition-colors text-sm font-medium">{t.nav.whoWeAre}</button>
          <button onClick={() => onNavigate('contact')} className="text-gray-300 hover:text-white transition-colors text-sm font-medium">{t.nav.contact}</button>
        </nav>

        {/* Actions */}
        <div className="hidden md:flex items-center gap-4">
          <button
            onClick={() => onNavigate('login')}
            className="text-white font-medium text-sm px-4 hover:text-brand-cyan transition-colors"
          >
            {t.nav.login}
          </button>
          <button
            onClick={() => onNavigate('signup')}
            className="btn-foundry text-sm font-bold transition-all hover:scale-105 px-5 py-2.5 rounded-full"
          >
            {t.nav.tryFree}
          </button>
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 glass border-t border-white/10 p-6 flex flex-col gap-4 animate-in slide-in-from-top-5">
          <button
            className="text-white text-lg text-left"
            onClick={() => {
              onNavigate('home');
              setMobileMenuOpen(false);
            }}
          >
            {t.nav.home}
          </button>
          <button
            className="text-white text-lg text-left"
            onClick={() => {
              onNavigate('solutions');
              setMobileMenuOpen(false);
            }}
          >
            {t.nav.features}
          </button>
          <button
            className="text-white text-lg text-left"
            onClick={() => {
              onNavigate('home');
              setTimeout(() => document.getElementById('pricing')?.scrollIntoView(), 100);
              setMobileMenuOpen(false);
            }}
          >
            {t.nav.pricing}
          </button>
          <button
            className="text-white text-lg text-left"
            onClick={() => {
              onNavigate('who-we-are');
              setMobileMenuOpen(false);
            }}
          >
            {t.nav.whoWeAre}
          </button>
          <button
            className="text-white text-lg text-left"
            onClick={() => {
              onNavigate('contact');
              setMobileMenuOpen(false);
            }}
          >
            {t.nav.contact}
          </button>
          <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-white/10">
            <button
              onClick={() => {
                onNavigate('login');
                setMobileMenuOpen(false);
              }}
              className="text-white text-left text-lg"
            >
              {t.nav.login}
            </button>
            <button
              onClick={() => {
                onNavigate('signup');
                setMobileMenuOpen(false);
              }}
              className="bg-white text-black py-3 rounded-lg font-bold text-center"
            >
              {t.nav.tryFree}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
