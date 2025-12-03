
/* eslint-disable @next/next/no-img-element */
import React from 'react';
import { ArrowRight, Play, Terminal } from 'lucide-react';
import { useLanguage } from './context/LanguageContext';
import { motion } from 'framer-motion';

export const Hero: React.FC = () => {
  const { t } = useLanguage();

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 md:pt-20">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=2000"
          alt="Background"
          className="w-full h-full object-cover opacity-20 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#020204] via-[#020204]/80 to-[#020204]"></div>
      </div>

      {/* Spotlight Effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-brand-purple/20 rounded-full blur-[120px] pointer-events-none opacity-40 mix-blend-screen" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Tech Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-cyan/30 bg-brand-cyan/5 mb-8 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-cyan opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-cyan"></span>
            </span>
            <span className="text-brand-cyan text-xs font-mono font-bold tracking-wider uppercase">
              System v2.0 Online
            </span>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-8xl font-display font-bold leading-[1.05] tracking-tight mb-8">
            <span className="bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-gray-400 block pb-2">
              {t.hero.titleStart}
            </span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-blue via-brand-purple to-brand-cyan block">
              {t.hero.titleEnd}
            </span>
          </h1>

          <p className="text-base md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed font-light px-2 border-l-2 border-brand-purple/30 pl-6 text-left md:text-center md:border-none md:pl-0">
            {t.hero.subtitle}
          </p>

          <div className="flex flex-col sm:flex-row gap-5 justify-center items-center mb-16 w-full px-4">
            <button className="w-full sm:w-auto group relative px-8 py-4 bg-white text-black font-bold rounded-lg hover:bg-gray-100 transition-all shadow-[0_0_30px_-5px_rgba(255,255,255,0.4)]">
              {t.hero.ctaPrimary}
              <ArrowRight className="inline-block ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button className="w-full sm:w-auto px-8 py-4 bg-transparent border border-white/20 text-white font-semibold rounded-lg hover:border-white/50 hover:bg-white/5 transition-all flex items-center justify-center gap-2">
              <Terminal className="w-4 h-4" />
              {t.hero.ctaSecondary}
            </button>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/10 max-w-4xl mx-auto border border-white/10 rounded-lg overflow-hidden">
            {t.hero.stats.map((stat, i) => (
              <div key={i} className="bg-[#050507]/90 backdrop-blur-sm p-4 text-center hover:bg-[#0a0a0c] transition-colors">
                <p className="text-gray-200 font-mono text-sm tracking-wide">{stat}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Mockup - Neon Tech Style */}
        <motion.div
          initial={{ opacity: 0, y: 100, rotateX: 10 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="mt-20 relative mx-auto max-w-6xl"
        >
          {/* Glow behind mockup */}
          <div className="absolute inset-0 bg-brand-purple/20 blur-[100px] -z-10 rounded-full opacity-50"></div>

          <div className="relative rounded-xl border border-white/10 bg-[#0a0a0c] shadow-2xl overflow-hidden group">
            {/* Mockup Header */}
            <div className="h-10 bg-[#0f0f12] border-b border-white/5 flex items-center px-4 gap-2">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
              </div>
              <div className="mx-auto w-64 h-6 bg-[#1a1a20] rounded-md border border-white/5 flex items-center justify-center">
                <span className="text-[10px] text-gray-500 font-mono">blex.io/dashboard</span>
              </div>
            </div>

            {/* Mockup Body Content - Real Image */}
            <div className="aspect-[16/9] relative bg-[#050507] overflow-hidden group-hover:opacity-90 transition-opacity">
              <img
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1600"
                alt="Dashboard Preview"
                className="w-full h-full object-cover opacity-80"
              />
              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-transparent to-transparent"></div>

              {/* Interactive Overlay Hint */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="bg-black/60 backdrop-blur-md border border-white/20 rounded-full px-6 py-3 flex items-center gap-3">
                  <Play className="w-4 h-4 text-white fill-white" />
                  <span className="text-sm font-bold text-white">Watch Interactive Demo</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
