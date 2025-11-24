
import React from 'react';
import { FileText, Zap, Users, PieChart, Clock, ShieldCheck, Cpu, Network, Check, X, ArrowRight, ArrowLeft } from 'lucide-react';
import { useLanguage } from './context/LanguageContext';
import { motion } from 'framer-motion';

export const Features: React.FC = () => {
   const { t } = useLanguage();

   return (
      <div className="min-h-screen bg-[#020204] pt-24 pb-20 relative overflow-hidden">
         {/* Background Ambience */}
         <div className="absolute inset-0 tech-grid opacity-30 pointer-events-none"></div>
         <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-cyan/5 blur-[120px] rounded-full pointer-events-none"></div>

         <div className="max-w-7xl mx-auto px-6 relative z-10">

            {/* Header / Hero for Solutions Page */}
            <motion.div
               initial={{ opacity: 0, y: 30 }}
               animate={{ opacity: 1, y: 0 }}
               className="text-center mb-24 max-w-4xl mx-auto"
            >
               <div className="inline-block px-3 py-1 mb-6 rounded-full border border-brand-purple/30 bg-brand-purple/10 text-brand-purple text-xs font-mono tracking-widest uppercase">
                  Blex Solutions
               </div>
               <h1 className="text-5xl md:text-7xl font-display font-bold mb-8 text-white tracking-tight leading-tight">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500">
                     {t.features.title}
                  </span>
               </h1>
               <p className="text-xl md:text-2xl text-gray-400 font-light leading-relaxed">
                  {t.features.subtitle}
               </p>
            </motion.div>

            {/* Deep Dive Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-32">
               {/* Card 1 - Management */}
               <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="lg:col-span-2 tech-card rounded-2xl p-8 md:p-10 hover:border-brand-purple/50 transition-all duration-300 group"
               >
                  <div className="flex justify-between items-start mb-8">
                     <div className="p-4 bg-brand-purple/10 border border-brand-purple/20 rounded-xl text-brand-purple">
                        <FileText size={32} />
                     </div>
                     <ArrowRight className="text-gray-700 group-hover:text-brand-purple transition-colors -rotate-45 group-hover:rotate-0" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">{t.features.cards.management.title}</h3>
                  <p className="text-gray-400 text-lg leading-relaxed">{t.features.cards.management.desc}</p>
                  <div className="mt-8 h-40 bg-[#050507] rounded-lg border border-white/5 relative overflow-hidden">
                     <div className="absolute inset-0 opacity-50 bg-[url('https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=500')] bg-cover bg-center grayscale mix-blend-luminosity"></div>
                     <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] to-transparent"></div>
                  </div>
               </motion.div>

               {/* Card 2 - AI */}
               <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                  className="tech-card rounded-2xl p-8 md:p-10 hover:border-brand-cyan/50 transition-all duration-300 group relative overflow-hidden"
               >
                  <div className="absolute -right-20 -top-20 w-64 h-64 bg-brand-cyan/10 blur-[60px] rounded-full group-hover:bg-brand-cyan/20 transition-all"></div>
                  <div className="p-4 bg-brand-cyan/10 border border-brand-cyan/20 rounded-xl text-brand-cyan w-fit mb-8 relative z-10">
                     <Zap size={32} />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4 relative z-10">{t.features.cards.ai.title}</h3>
                  <p className="text-gray-400 relative z-10">{t.features.cards.ai.desc}</p>
                  <div className="mt-8 flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-brand-cyan animate-pulse"></div>
                     <span className="text-xs font-mono text-brand-cyan">GEMINI 2.0 INTEGRATED</span>
                  </div>
               </motion.div>

               {/* Card 3 - Deadlines */}
               <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                  className="tech-card rounded-2xl p-8 md:p-10 hover:border-brand-blue/50 transition-all duration-300 group"
               >
                  <div className="p-4 bg-brand-blue/10 border border-brand-blue/20 rounded-xl text-brand-blue w-fit mb-8">
                     <Clock size={32} />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">{t.features.cards.deadlines.title}</h3>
                  <p className="text-gray-400">{t.features.cards.deadlines.desc}</p>
               </motion.div>

               {/* Row 2 - Wide Cards */}
               <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                  className="lg:col-span-2 tech-card rounded-2xl p-8 md:p-10 hover:border-white/30 transition-all duration-300 flex flex-col justify-between group"
               >
                  <div className="flex flex-col md:flex-row md:items-start gap-6">
                     <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-white shrink-0">
                        <Network size={32} />
                     </div>
                     <div>
                        <h3 className="text-2xl font-bold text-white mb-3">{t.features.cards.collab.title}</h3>
                        <p className="text-gray-400 text-lg">{t.features.cards.collab.desc}</p>
                     </div>
                  </div>
                  <div className="mt-8 h-1 bg-white/5 w-full rounded-full overflow-hidden relative">
                     <div className="absolute top-0 left-0 h-full w-1/3 bg-brand-purple blur-[2px] animate-border-flow"></div>
                  </div>
               </motion.div>

               <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 }}
                  className="lg:col-span-2 tech-card rounded-2xl p-8 md:p-10 hover:border-white/30 transition-all duration-300 group"
               >
                  <div className="flex flex-col md:flex-row md:items-start gap-6">
                     <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-white shrink-0">
                        <ShieldCheck size={32} />
                     </div>
                     <div>
                        <h3 className="text-2xl font-bold text-white mb-3">{t.benefits.portal.title}</h3>
                        <p className="text-gray-400 text-lg">{t.benefits.portal.desc}</p>
                     </div>
                  </div>
                  <div className="mt-8 flex justify-end">
                     <span className="text-xs font-mono text-gray-500 border border-white/10 px-3 py-1 rounded bg-black">ENCRYPTION: AES-256</span>
                  </div>
               </motion.div>
            </div>

            {/* COMPARISON TABLE */}
            <motion.div
               initial={{ opacity: 0, y: 40 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               className="max-w-5xl mx-auto"
            >
               <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">Blex vs. Traditional Software</h2>
                  <p className="text-gray-400">Why leading firms are switching to the new standard.</p>
               </div>

               <div className="rounded-2xl border border-white/10 bg-[#0a0a0c] overflow-hidden">
                  <table className="w-full">
                     <thead>
                        <tr className="border-b border-white/10 bg-white/5">
                           <th className="p-6 text-left text-sm font-mono text-gray-400 uppercase tracking-wider w-1/2">Feature</th>
                           <th className="p-6 text-center text-lg font-bold text-white w-1/4 bg-brand-purple/10 border-x border-brand-purple/20">Blex</th>
                           <th className="p-6 text-center text-sm font-bold text-gray-500 w-1/4">Legacy Tools</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-white/5">
                        {[
                           { name: "Native AI Paralegal", blex: true, legacy: false },
                           { name: "Bank-Grade Security", blex: true, legacy: "Partial" },
                           { name: "Client Portal included", blex: true, legacy: false },
                           { name: "Modern UX/UI", blex: true, legacy: false },
                           { name: "Cloud-Native", blex: true, legacy: "On-Premise" },
                           { name: "Auto-Updates", blex: true, legacy: false },
                        ].map((row, i) => (
                           <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                              <td className="p-6 text-gray-300 font-medium">{row.name}</td>
                              <td className="p-6 text-center bg-brand-purple/5 border-x border-brand-purple/10">
                                 <div className="flex justify-center">
                                    <div className="w-8 h-8 rounded-full bg-brand-purple flex items-center justify-center shadow-[0_0_10px_rgba(124,58,237,0.4)]">
                                       <Check size={18} className="text-white" />
                                    </div>
                                 </div>
                              </td>
                              <td className="p-6 text-center">
                                 {row.legacy === false ? (
                                    <div className="flex justify-center">
                                       <X size={20} className="text-gray-600" />
                                    </div>
                                 ) : (
                                    <span className="text-gray-500 text-sm">{row.legacy}</span>
                                 )}
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </motion.div>

         </div>
      </div>
   );
};
