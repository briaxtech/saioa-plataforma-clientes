import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from './context/LanguageContext';
import { ArrowLeft, Briefcase, Mail, Lock, ChevronRight } from 'lucide-react';
import { View } from './types';

interface LoginProps {
  onNavigate: (view: View) => void;
}

export const Login: React.FC<LoginProps> = ({ onNavigate }) => {
  const { t } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen pt-24 pb-12 flex items-center justify-center px-6 relative"
    >
      <div className="absolute top-24 left-6 md:left-12">
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
        >
          <div className="p-2 rounded-full bg-white/5 group-hover:bg-white/10 border border-white/5">
            <ArrowLeft size={16} />
          </div>
          <span className="text-sm font-medium">{t.auth.backToHome}</span>
        </button>
      </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-gradient-purple rounded-xl flex items-center justify-center mx-auto mb-6 shadow-neon-purple">
            <Briefcase className="text-white w-6 h-6" />
          </div>
          <h1 className="text-3xl font-display font-bold text-white mb-2">{t.auth.loginTitle}</h1>
          <p className="text-gray-400">{t.auth.loginSubtitle}</p>
        </div>

        <div className="tech-card rounded-2xl p-8 bg-[#0a0a0c]">
          <form className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t.auth.emailLabel}</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="email"
                  className="w-full bg-[#050507] border border-white/10 rounded-lg py-3 pl-12 pr-4 text-white focus:border-brand-purple focus:outline-none transition-colors"
                  placeholder="name@firm.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t.auth.passwordLabel}</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="password"
                  className="w-full bg-[#050507] border border-white/10 rounded-lg py-3 pl-12 pr-4 text-white focus:border-brand-purple focus:outline-none transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button className="w-full py-3 bg-brand-purple hover:bg-brand-purple/90 text-white font-bold rounded-lg shadow-neon-purple transition-all flex items-center justify-center gap-2 group">
              {t.auth.loginButton}
              <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <p className="text-sm text-gray-500">
              Don't have an account? {' '}
              <button onClick={() => onNavigate('signup')} className="text-white font-bold hover:underline">
                Sign up
              </button>
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};