
import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from './context/LanguageContext';
import { Lightbulb, Eye, Award, Users, ArrowLeft } from 'lucide-react';
import { View } from './types';

interface WhoWeAreProps {
   onNavigate?: (view: View) => void;
}

export const WhoWeAre: React.FC<WhoWeAreProps> = ({ onNavigate }) => {
   const { t } = useLanguage();

   const values = [
      {
         key: 'innovation',
         icon: Lightbulb,
         color: 'text-brand-cyan',
         bg: 'bg-brand-cyan/10'
      },
      {
         key: 'transparency',
         icon: Eye,
         color: 'text-brand-purple',
         bg: 'bg-brand-purple/10'
      },
      {
         key: 'mastery',
         icon: Award,
         color: 'text-brand-blue',
         bg: 'bg-brand-blue/10'
      }
   ];

   return (
      <motion.div
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         exit={{ opacity: 0 }}
         className="min-h-screen py-32 bg-[#020204] relative"
      >
         {/* Background Grid */}
         <div className="absolute inset-0 tech-grid opacity-30 pointer-events-none" />

         <div className="max-w-7xl mx-auto px-6 relative z-10">

            {onNavigate && (
               <button
                  onClick={() => onNavigate('home')}
                  className="flex items-center gap-2 text-gray-400 hover:text-white mb-12 transition-colors group"
               >
                  <div className="p-2 rounded-full bg-white/5 group-hover:bg-white/10 border border-white/5">
                     <ArrowLeft size={16} />
                  </div>
                  <span className="text-sm font-medium">{t.auth.backToHome}</span>
               </button>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-24">
               <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
               >
                  <h2 className="text-4xl md:text-5xl font-display font-bold mb-8 text-white">
                     {t.whoWeAre.title}
                  </h2>
                  <div className="p-8 rounded-2xl bg-[#0a0a0c] border border-white/10 shadow-2xl relative overflow-hidden group">
                     <div className="absolute top-0 left-0 w-1 h-full bg-brand-purple"></div>
                     <p className="text-xl md:text-2xl text-gray-300 font-light leading-relaxed relative z-10">
                        "{t.whoWeAre.mission}"
                     </p>
                     {/* Decorative glow */}
                     <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-brand-purple/20 blur-[60px] group-hover:bg-brand-purple/30 transition-all"></div>
                  </div>
               </motion.div>

               <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="grid grid-cols-1 gap-6"
               >
                  {values.map((v, i) => (
                     <div key={i} className="tech-card rounded-xl p-6 flex items-start gap-5 group hover:border-white/20 transition-colors">
                        <div className={`p-3 rounded-lg ${v.bg} ${v.color} border border-white/5`}>
                           <v.icon size={24} />
                        </div>
                        <div>
                           {/* @ts-ignore - Dynamic key access */}
                           <h3 className="text-lg font-bold text-white mb-2">{t.whoWeAre.values[v.key].title}</h3>
                           {/* @ts-ignore */}
                           <p className="text-sm text-gray-400">{t.whoWeAre.values[v.key].desc}</p>
                        </div>
                     </div>
                  ))}
               </motion.div>
            </div>

            {/* Team Section */}
            <motion.div
               initial={{ opacity: 0, y: 30 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.4 }}
               className="rounded-2xl bg-gradient-to-r from-[#0a0a0c] to-[#050507] border border-white/10 p-8 md:p-12 text-center relative overflow-hidden"
            >
               <div className="absolute inset-0 tech-grid opacity-20" />

               <div className="relative z-10">
                  <div className="w-16 h-16 mx-auto bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10">
                     <Users className="text-white" size={32} />
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-4">{t.whoWeAre.team.title}</h3>
                  <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-8">
                     {t.whoWeAre.team.desc}
                  </p>
                  <div className="flex justify-center gap-4">
                     <div className="flex -space-x-4">
                        {[1, 2, 3, 4].map(i => (
                           <div key={i} className="w-12 h-12 rounded-full border-2 border-[#0a0a0c] bg-gray-800 relative overflow-hidden">
                              <img src={`https://images.unsplash.com/photo-${1500000000000 + i}?auto=format&fit=crop&w=100&h=100`} className="w-full h-full object-cover opacity-60" />
                           </div>
                        ))}
                        <div className="w-12 h-12 rounded-full border-2 border-[#0a0a0c] bg-brand-purple flex items-center justify-center text-xs font-bold text-white">
                           +12
                        </div>
                     </div>
                  </div>
               </div>
            </motion.div>
         </div>
      </motion.div>
   );
};
