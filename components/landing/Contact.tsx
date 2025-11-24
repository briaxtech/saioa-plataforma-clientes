
import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from './context/LanguageContext';
import { MapPin, Mail, Phone, Send } from 'lucide-react';

export const Contact: React.FC = () => {
   const { t } = useLanguage();

   return (
      <motion.div
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         className="min-h-screen pt-32 pb-20 px-6 relative"
      >
         <div className="absolute inset-0 tech-grid opacity-30 pointer-events-none" />

         <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
               <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">{t.contactPage.title}</h1>
               <p className="text-xl text-gray-400">{t.contactPage.subtitle}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
               {/* Info Column */}
               <div className="space-y-8">
                  <div className="tech-card rounded-2xl p-8">
                     <h3 className="text-2xl font-bold text-white mb-6">{t.contactPage.infoTitle}</h3>

                     <div className="space-y-6">
                        <div className="flex items-start gap-4">
                           <div className="p-3 bg-white/5 rounded-lg text-brand-cyan border border-white/10">
                              <Mail size={24} />
                           </div>
                           <div>
                              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Email</p>
                              <p className="text-white text-lg">hello@blex.io</p>
                              <p className="text-white text-lg">support@blex.io</p>
                           </div>
                        </div>

                        <div className="flex items-start gap-4">
                           <div className="p-3 bg-white/5 rounded-lg text-brand-purple border border-white/10">
                              <MapPin size={24} />
                           </div>
                           <div>
                              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">HQ</p>
                              <p className="text-white text-lg">Tech District, 142</p>
                              <p className="text-gray-400">Barcelona, Spain</p>
                           </div>
                        </div>

                        <div className="flex items-start gap-4">
                           <div className="p-3 bg-white/5 rounded-lg text-brand-blue border border-white/10">
                              <Phone size={24} />
                           </div>
                           <div>
                              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Sales</p>
                              <p className="text-white text-lg">+34 930 000 000</p>
                              <p className="text-gray-400 text-sm">Mon-Fri, 9am - 6pm CET</p>
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Map Placeholder - Real Image */}
                  <div className="rounded-2xl border border-white/10 bg-[#0a0a0c] h-64 relative overflow-hidden group">
                     <img
                        src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=1000"
                        alt="Office Location Map"
                        className="absolute inset-0 w-full h-full object-cover opacity-60 grayscale group-hover:grayscale-0 transition-all duration-500"
                     />
                     <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                     <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-brand-purple/20 border border-brand-purple/50 text-white px-4 py-2 rounded-full backdrop-blur-md text-sm font-bold flex items-center gap-2 shadow-lg">
                           <MapPin size={16} className="fill-brand-purple" />
                           Barcelona HQ
                        </div>
                     </div>
                  </div>
               </div>

               {/* Form Column */}
               <div className="tech-card rounded-2xl p-8 md:p-10 bg-[#0a0a0c]">
                  <form className="space-y-6">
                     <div className="grid grid-cols-2 gap-6">
                        <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t.contactPage.name}</label>
                           <input type="text" className="w-full bg-[#050507] border border-white/10 rounded-lg py-3 px-4 text-white focus:border-brand-cyan focus:outline-none transition-colors" />
                        </div>
                        <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t.contactPage.email}</label>
                           <input type="email" className="w-full bg-[#050507] border border-white/10 rounded-lg py-3 px-4 text-white focus:border-brand-cyan focus:outline-none transition-colors" />
                        </div>
                     </div>

                     <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Subject</label>
                        <select className="w-full bg-[#050507] border border-white/10 rounded-lg py-3 px-4 text-white focus:border-brand-cyan focus:outline-none transition-colors appearance-none">
                           <option>Sales Inquiry</option>
                           <option>Technical Support</option>
                           <option>Partnership</option>
                        </select>
                     </div>

                     <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t.contactPage.message}</label>
                        <textarea rows={6} className="w-full bg-[#050507] border border-white/10 rounded-lg py-3 px-4 text-white focus:border-brand-cyan focus:outline-none transition-colors resize-none"></textarea>
                     </div>

                     <button className="w-full py-4 bg-brand-cyan hover:bg-brand-cyan/90 text-black font-bold rounded-lg shadow-neon-cyan transition-all flex items-center justify-center gap-2 group hover:scale-[1.02]">
                        {t.contactPage.submit}
                        <Send size={18} className="group-hover:translate-x-1 transition-transform" />
                     </button>
                  </form>
               </div>
            </div>
         </div>
      </motion.div>
   );
};