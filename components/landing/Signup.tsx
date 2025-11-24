import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from './context/LanguageContext';
import { ArrowLeft, User, Mail, ShieldCheck, ChevronRight } from 'lucide-react';
import { View } from './types';

interface SignupProps {
  onNavigate: (view: View) => void;
}

export const Signup: React.FC<SignupProps> = ({ onNavigate }) => {
  const { t } = useLanguage();
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'pro'>('pro');

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

      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold text-white mb-2">{t.auth.signupTitle}</h1>
          <p className="text-gray-400">{t.auth.signupSubtitle}</p>
        </div>

        <div className="tech-card rounded-2xl p-8 bg-[#0a0a0c]">
          <form className="space-y-6">

            {/* Plan Selection */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">{t.auth.planLabel}</label>
              <div className="grid grid-cols-2 gap-4">
                <div
                  onClick={() => setSelectedPlan('starter')}
                  className={`cursor-pointer p-4 rounded-xl border ${selectedPlan === 'starter' ? 'bg-white/10 border-white text-white' : 'bg-[#050507] border-white/10 text-gray-400 hover:border-white/30'} transition-all text-center`}
                >
                  <div className="font-bold mb-1">Starter</div>
                  <div className="text-xs opacity-70">Independent</div>
                </div>
                <div
                  onClick={() => setSelectedPlan('pro')}
                  className={`cursor-pointer p-4 rounded-xl border relative ${selectedPlan === 'pro' ? 'bg-brand-purple/20 border-brand-purple text-white shadow-neon-purple' : 'bg-[#050507] border-white/10 text-gray-400 hover:border-white/30'} transition-all text-center`}
                >
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-brand-purple text-[10px] font-bold px-2 py-0.5 rounded text-white">POPULAR</div>
                  <div className="font-bold mb-1">Pro</div>
                  <div className="text-xs opacity-70">Growth Firm</div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t.auth.nameLabel}</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="text"
                  className="w-full bg-[#050507] border border-white/10 rounded-lg py-3 pl-12 pr-4 text-white focus:border-brand-purple focus:outline-none transition-colors"
                  placeholder="John Doe"
                />
              </div>
            </div>

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

            <div className="flex items-start gap-3 p-4 bg-brand-cyan/5 rounded-lg border border-brand-cyan/10">
              <ShieldCheck className="text-brand-cyan shrink-0" size={20} />
              <p className="text-xs text-gray-300 leading-relaxed">
                We use bank-grade AES-256 encryption. Your client data is strictly confidential and protected.
              </p>
            </div>

            <button className="w-full py-4 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-all flex items-center justify-center gap-2 group shadow-[0_0_20px_rgba(255,255,255,0.3)]">
              {t.auth.signupButton}
              <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <p className="text-sm text-gray-500">
              Already have an account? {' '}
              <button onClick={() => onNavigate('login')} className="text-white font-bold hover:underline">
                Login
              </button>
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};