import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { useLanguage } from './context/LanguageContext';
import { motion } from 'framer-motion';

export const Pricing: React.FC = () => {
  const { t } = useLanguage();
  const [annual, setAnnual] = useState(true);

  const plans = [t.pricing.plans.starter, t.pricing.plans.pro, t.pricing.plans.enterprise];

  return (
    <section id="pricing" className="py-32 bg-[#020204] relative">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-display font-bold mb-8 text-white">{t.pricing.title}</h2>

          <div className="inline-flex bg-[#0f0f12] p-1 rounded-lg border border-white/10">
            <button
              onClick={() => setAnnual(false)}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${!annual ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}
            >
              {t.pricing.monthly}
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${annual ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}
            >
              {t.pricing.yearly}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => {
            const isPro = index === 1;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`relative rounded-xl p-8 flex flex-col transition-all duration-300 ${isPro
                    ? 'bg-[#0a0a0c] border border-brand-purple shadow-neon-purple transform scale-105 z-10'
                    : 'bg-[#050507] border border-white/10 hover:border-white/20'
                  }`}
              >
                {/* Popular Badge */}
                {isPro && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand-purple text-white px-4 py-1 rounded-full text-xs font-bold tracking-widest uppercase shadow-[0_0_15px_rgba(124,58,237,0.6)]">
                    {t.pricing.plans.pro.badge}
                  </div>
                )}

                <div className="mb-8 border-b border-white/5 pb-8">
                  <h3 className={`text-lg font-bold mb-2 uppercase tracking-wider ${isPro ? 'text-brand-purple' : 'text-gray-400'}`}>{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-display font-bold text-white">{plan.price}</span>
                    {plan.price !== 'Custom' && <span className="text-gray-500 font-mono text-sm">/mo</span>}
                  </div>
                  <p className="text-sm text-gray-500 mt-4">{plan.desc}</p>
                </div>

                <div className="space-y-4 mb-8 flex-grow">
                  {plan.features.map((feat, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className={`mt-1 ${isPro ? 'text-brand-purple' : 'text-gray-600'}`}>
                        <Check size={14} strokeWidth={3} />
                      </div>
                      <span className="text-sm text-gray-300 font-light">{feat}</span>
                    </div>
                  ))}
                </div>

                <button className={`w-full py-4 rounded-lg font-bold text-sm tracking-wide transition-all uppercase ${isPro
                    ? 'bg-brand-purple hover:bg-brand-purple/90 text-white shadow-[0_0_20px_rgba(124,58,237,0.4)]'
                    : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                  }`}>
                  Select {plan.name}
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};