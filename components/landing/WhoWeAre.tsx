/* eslint-disable @next/next/no-img-element */
import React from "react"
import { motion } from "framer-motion"
import { useLanguage } from "./context/LanguageContext"
import { Lightbulb, Eye, Award, Users, ArrowLeft } from "lucide-react"
import type { View } from "./types"

interface WhoWeAreProps {
  onNavigate?: (view: View) => void
}

export const WhoWeAre: React.FC<WhoWeAreProps> = ({ onNavigate }) => {
  const { t } = useLanguage()

  const values = [
    { key: "innovation", icon: Lightbulb, color: "text-brand-cyan", bg: "bg-brand-cyan/10" },
    { key: "transparency", icon: Eye, color: "text-brand-purple", bg: "bg-brand-purple/10" },
    { key: "mastery", icon: Award, color: "text-brand-blue", bg: "bg-brand-blue/10" },
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative min-h-screen bg-[#020204] py-32"
    >
      <div className="tech-grid pointer-events-none absolute inset-0 opacity-30" />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        {onNavigate && (
          <button
            onClick={() => onNavigate("home")}
            className="group mb-12 flex items-center gap-2 text-gray-400 transition-colors hover:text-white"
          >
            <div className="rounded-full border border-white/5 bg-white/5 p-2 group-hover:bg-white/10">
              <ArrowLeft size={16} />
            </div>
            <span className="text-sm font-medium">{t.auth.backToHome}</span>
          </button>
        )}

        <div className="mb-24 grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <h2 className="font-display text-4xl font-bold text-white md:text-5xl">{t.whoWeAre.title}</h2>
            <div className="relative mt-8 overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0c] p-8 shadow-2xl">
              <div className="absolute left-0 top-0 h-full w-1 bg-brand-purple" />
              <p className="relative z-10 text-xl font-light leading-relaxed text-gray-300 md:text-2xl">
                “{t.whoWeAre.mission}”
              </p>
              <div className="absolute -right-10 -bottom-10 h-40 w-40 bg-brand-purple/20 blur-[60px] transition-all group-hover:bg-brand-purple/30" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 gap-6"
          >
            {values.map((v) => (
              <div
                key={v.key}
                className="tech-card flex items-start gap-5 rounded-xl p-6 transition-colors hover:border-white/20"
              >
                <div className={`border border-white/5 ${v.bg} ${v.color} rounded-lg p-3`}>
                  <v.icon size={24} />
                </div>
                <div>
                  <h3 className="mb-2 text-lg font-bold text-white">{t.whoWeAre.values[v.key].title}</h3>
                  <p className="text-sm text-gray-400">{t.whoWeAre.values[v.key].desc}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-[#0a0a0c] to-[#050507] p-8 text-center md:p-12"
        >
          <div className="tech-grid absolute inset-0 opacity-20" />

          <div className="relative z-10">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5">
              <Users className="text-white" size={32} />
            </div>
            <h3 className="mb-4 text-3xl font-bold text-white">{t.whoWeAre.team.title}</h3>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-400">{t.whoWeAre.team.desc}</p>
            <div className="flex justify-center gap-4">
              <div className="flex -space-x-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-[#0a0a0c] bg-gray-800"
                  >
                    <img
                      src={`https://images.unsplash.com/photo-${1500000000000 + i}?auto=format&fit=crop&w=100&h=100`}
                      alt="Team member avatar"
                      className="h-full w-full object-cover opacity-60"
                    />
                  </div>
                ))}
                <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#0a0a0c] bg-brand-purple text-xs font-bold text-white">
                  +12
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
