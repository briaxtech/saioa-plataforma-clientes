
/* eslint-disable @next/next/no-img-element */
import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from './context/LanguageContext';
import {
   LayoutDashboard, Briefcase, Users, Calendar, FileText, CreditCard, Settings,
   MoreVertical, Bell, Search, Plus, ArrowUpRight, Clock, CheckCircle2, AlertCircle, File
} from 'lucide-react';

export const ProductShowcase: React.FC = () => {
   const { t } = useLanguage();

   return (
      <section className="py-24 bg-[#020204] relative overflow-hidden">
         {/* Background Ambience */}
         <div className="absolute inset-0 tech-grid opacity-30 pointer-events-none" />
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-brand-purple/10 blur-[120px] rounded-full pointer-events-none" />

         <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center mb-20">
               <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-3xl md:text-5xl font-display font-bold text-white mb-6"
               >
                  {t.showcase.title}
               </motion.h2>
               <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                  className="text-gray-400 text-lg max-w-2xl mx-auto"
               >
                  {t.showcase.subtitle}
               </motion.p>
            </div>

            {/* MAIN DASHBOARD MOCKUP */}
            <motion.div
               initial={{ opacity: 0, y: 50, rotateX: 5 }}
               whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
               viewport={{ once: true }}
               transition={{ duration: 0.8 }}
               className="relative rounded-2xl border border-white/10 bg-[#050505]/80 backdrop-blur-xl shadow-2xl overflow-hidden max-w-6xl mx-auto"
            >
               {/* Window Controls & Header */}
               <div className="h-12 bg-[#0a0a0c] border-b border-white/5 flex items-center justify-between px-4">
                  <div className="flex gap-2">
                     <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                     <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                     <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-1.5 bg-black/50 border border-white/5 rounded-full text-xs text-gray-500 font-mono">
                     <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                     app.blex.io/dashboard
                  </div>
                  <div className="flex items-center gap-4 text-gray-400">
                     <Bell size={16} className="hover:text-white cursor-pointer" />
                     <div className="w-6 h-6 rounded-full bg-gradient-purple border border-white/10"></div>
                  </div>
               </div>

               <div className="flex min-h-[600px]">
                  {/* SIDEBAR */}
                  <div className="hidden md:flex w-64 flex-col bg-[#08080a] border-r border-white/5 p-4">
                     <div className="mb-8 flex items-center gap-2 px-2">
                        <div className="w-8 h-8 bg-brand-purple rounded-lg flex items-center justify-center">
                           <Briefcase size={16} className="text-white" />
                        </div>
                        <span className="font-display font-bold text-white text-lg">Blex</span>
                     </div>

                     <div className="space-y-1">
                        <SidebarItem icon={LayoutDashboard} label="Dashboard" active />
                        <SidebarItem icon={Briefcase} label="Cases" />
                        <SidebarItem icon={Users} label="Clients" />
                        <SidebarItem icon={Calendar} label="Deadlines" />
                        <SidebarItem icon={FileText} label="Documents" />
                        <SidebarItem icon={CreditCard} label="Payments" />
                        <div className="pt-4 mt-4 border-t border-white/5">
                           <SidebarItem icon={Settings} label="Settings" />
                        </div>
                     </div>

                     {/* AI Status in Sidebar */}
                     <div className="mt-auto p-4 rounded-xl bg-gradient-to-br from-brand-purple/10 to-transparent border border-brand-purple/20">
                        <div className="flex items-center gap-2 mb-2">
                           <div className="w-2 h-2 bg-brand-cyan rounded-full animate-pulse"></div>
                           <span className="text-xs font-bold text-brand-cyan">Lexy Active</span>
                        </div>
                        <p className="text-[10px] text-gray-400">Processing 3 new documents...</p>
                     </div>
                  </div>

                  {/* MAIN CONTENT AREA */}
                  <div className="flex-1 bg-[#050505] p-6 md:p-8 overflow-y-auto">

                     <div className="flex justify-between items-end mb-8">
                        <div>
                           <h3 className="text-2xl font-bold text-white">Dashboard</h3>
                           <p className="text-sm text-gray-500">Welcome back, María.</p>
                        </div>
                        <div className="hidden md:flex gap-3">
                           <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white hover:bg-white/10 transition">Export Report</button>
                           <button className="px-4 py-2 bg-brand-purple text-white rounded-lg text-sm font-bold shadow-neon-purple hover:scale-105 transition flex items-center gap-2">
                              <Plus size={16} /> New Case
                           </button>
                        </div>
                     </div>

                     {/* STATS GRID */}
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <StatCard
                           title="Active Cases"
                           value="8"
                           icon={Briefcase}
                           color="text-brand-blue"
                           bg="bg-brand-blue/10"
                           border="border-brand-blue/20"
                        />
                        <StatCard
                           title="Upcoming Deadlines"
                           value="4"
                           icon={Clock}
                           color="text-yellow-500"
                           bg="bg-yellow-500/10"
                           border="border-yellow-500/20"
                           alert
                        />
                        <StatCard
                           title="Pending Docs"
                           value="12"
                           icon={FileText}
                           color="text-brand-purple"
                           bg="bg-brand-purple/10"
                           border="border-brand-purple/20"
                        />
                        <StatCard
                           title="Outstanding"
                           value="€8.750"
                           icon={CreditCard}
                           color="text-green-500"
                           bg="bg-green-500/10"
                           border="border-green-500/20"
                        />
                     </div>

                     <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* UPCOMING DEADLINES (Table Style) */}
                        <div className="lg:col-span-2 rounded-xl border border-white/10 bg-[#0a0a0c] overflow-hidden">
                           <div className="p-4 border-b border-white/5 flex justify-between items-center">
                              <h4 className="font-bold text-white text-sm">Próximos Plazos</h4>
                              <MoreVertical size={16} className="text-gray-500 cursor-pointer" />
                           </div>
                           <div className="p-2">
                              <table className="w-full text-left border-collapse">
                                 <thead>
                                    <tr className="text-[10px] text-gray-500 uppercase tracking-wider font-mono border-b border-white/5">
                                       <th className="p-3 font-normal">Caso</th>
                                       <th className="p-3 font-normal">Cliente</th>
                                       <th className="p-3 font-normal">Fecha</th>
                                       <th className="p-3 font-normal">Estado</th>
                                    </tr>
                                 </thead>
                                 <tbody className="text-sm">
                                    <TableRow id="AR-24-001" client="Ana Martínez" date="15/08/2024" status="Urgent" />
                                    <TableRow id="AR-24-001" client="Ana Martínez" date="10/09/2024" status="Normal" />
                                    <TableRow id="NA-24-002" client="Carlos Ruiz" date="30/07/2024" status="Critical" />
                                    <TableRow id="US-24-005" client="Tech Corp" date="02/08/2024" status="Normal" />
                                 </tbody>
                              </table>
                           </div>
                        </div>

                        {/* RECENT ACTIVITY (List Style) */}
                        <div className="rounded-xl border border-white/10 bg-[#0a0a0c] overflow-hidden flex flex-col">
                           <div className="p-4 border-b border-white/5">
                              <h4 className="font-bold text-white text-sm">Actividad Reciente</h4>
                           </div>
                           <div className="p-4 space-y-4">
                              <ActivityItem
                                 icon={Bell}
                                 color="text-brand-cyan"
                                 bg="bg-brand-cyan/10"
                                 title="Nuevo mensaje en caso AR-24-001"
                                 time="hace 2 horas"
                              />
                              <ActivityItem
                                 icon={Bell}
                                 color="text-brand-cyan"
                                 bg="bg-brand-cyan/10"
                                 title="Nuevo mensaje en caso NA-24-002"
                                 time="hace 2 horas"
                              />
                              <ActivityItem
                                 icon={File}
                                 color="text-brand-purple"
                                 bg="bg-brand-purple/10"
                                 title="Documento subido en caso AR-24-001"
                                 time="hace 4 horas"
                              />
                              <ActivityItem
                                 icon={CheckCircle2}
                                 color="text-green-500"
                                 bg="bg-green-500/10"
                                 title="Tarea completada: Revisión"
                                 time="hace 5 horas"
                              />
                           </div>
                        </div>
                     </div>

                  </div>
               </div>
            </motion.div>

            {/* Floating Elements for Depth */}
            <motion.div
               initial={{ opacity: 0, x: 50 }}
               whileInView={{ opacity: 1, x: 0 }}
               transition={{ delay: 0.5, duration: 0.8 }}
               className="hidden lg:block absolute -right-4 top-1/3 w-64 p-4 rounded-xl border border-white/10 bg-black/80 backdrop-blur-xl shadow-2xl z-20"
            >
               <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-brand-purple flex items-center justify-center">
                     <img
                       src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=100"
                       alt="Lexy AI avatar"
                       className="w-full h-full object-cover rounded-full"
                     />
                  </div>
                  <div>
                     <div className="text-xs font-bold text-white">Lexy AI Analysis</div>
                     <div className="text-[10px] text-brand-cyan">Suggestion Ready</div>
                  </div>
               </div>
               <p className="text-xs text-gray-300 leading-relaxed">
                  He detectado que el pasaporte de <span className="text-white font-bold">Carlos Ruiz</span> vence en 3 meses. ¿Deseas enviar un recordatorio automático?
               </p>
               <div className="mt-3 flex gap-2">
                  <button className="flex-1 py-1.5 bg-brand-purple text-[10px] font-bold text-white rounded hover:bg-brand-purple/80">Enviar</button>
                  <button className="flex-1 py-1.5 bg-white/10 text-[10px] text-white rounded hover:bg-white/20">Ignorar</button>
               </div>
            </motion.div>

         </div>
      </section>
   );
};

// Sub-components for cleaner code
const SidebarItem = ({ icon: Icon, label, active = false }: any) => (
   <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 group ${active ? 'bg-white/10 text-white border border-white/5' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
      <Icon size={18} className={active ? 'text-brand-purple' : 'group-hover:text-white'} />
      <span className="text-sm font-medium">{label}</span>
      {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-purple shadow-[0_0_8px_rgba(124,58,237,0.8)]"></div>}
   </div>
);

const StatCard = ({ title, value, icon: Icon, color, bg, border, alert }: any) => (
   <div className="p-5 rounded-xl bg-[#0a0a0c] border border-white/10 relative overflow-hidden group hover:border-white/20 transition-colors">
      <div className="flex justify-between items-start mb-4">
         <span className="text-gray-400 text-xs font-medium uppercase tracking-wider">{title}</span>
         <div className={`p-2 rounded-lg ${bg} ${border} border ${color}`}>
            <Icon size={16} />
         </div>
      </div>
      <div className="flex items-end gap-2">
         <span className="text-3xl font-mono font-bold text-white">{value}</span>
         {alert && <span className="flex h-2 w-2 relative mb-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
         </span>}
      </div>
   </div>
);

const TableRow = ({ id, client, date, status }: any) => (
   <tr className="border-b border-white/5 hover:bg-white/5 transition-colors group cursor-pointer">
      <td className="p-3 font-bold text-white group-hover:text-brand-purple transition-colors">{id}</td>
      <td className="p-3 text-gray-300">
         <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-gray-700 text-[10px] flex items-center justify-center text-white">{client.charAt(0)}</div>
            {client}
         </div>
      </td>
      <td className="p-3 text-gray-400 font-mono text-xs">{date}</td>
      <td className="p-3">
         <span className={`text-[10px] px-2 py-0.5 rounded border ${status === 'Critical' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
               status === 'Urgent' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                  'bg-green-500/10 text-green-500 border-green-500/20'
            }`}>
            {status}
         </span>
      </td>
   </tr>
);

const ActivityItem = ({ icon: Icon, color, bg, title, time }: any) => (
   <div className="flex gap-3 items-start">
      <div className={`mt-0.5 p-1.5 rounded-full ${bg} ${color} border border-white/5`}>
         <Icon size={12} />
      </div>
      <div>
         <p className="text-xs text-gray-200 font-medium leading-tight mb-0.5">{title}</p>
         <p className="text-[10px] text-gray-500">{time}</p>
      </div>
   </div>
);
