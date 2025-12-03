import React from "react"
import { motion } from "framer-motion"
import { useLanguage } from "./context/LanguageContext"
import { ArrowLeft, Briefcase, Mail, Lock, ChevronRight } from "lucide-react"
import type { View } from "./types"

interface LoginProps {
  onNavigate: (view: View) => void
}

export const Login: React.FC<LoginProps> = ({ onNavigate }) => {
  const { t } = useLanguage()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative flex min-h-screen items-center justify-center px-6 pb-12 pt-24"
    >
      <div className="absolute left-6 top-24 md:left-12">
        <button
          onClick={() => onNavigate("home")}
          className="group flex items-center gap-2 text-gray-400 transition-colors hover:text-white"
        >
          <div className="rounded-full border border-white/5 bg-white/5 p-2 group-hover:bg-white/10">
            <ArrowLeft size={16} />
          </div>
          <span className="text-sm font-medium">{t.auth.backToHome}</span>
        </button>
      </div>

      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="bg-gradient-purple shadow-neon-purple mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-xl">
            <Briefcase className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-display font-bold text-white">{t.auth.loginTitle}</h1>
          <p className="text-gray-400">{t.auth.loginSubtitle}</p>
        </div>

        <div className="tech-card rounded-2xl bg-[#0a0a0c] p-8">
          <form className="space-y-6">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">
                {t.auth.emailLabel}
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="email"
                  className="w-full rounded-lg border border-white/10 bg-[#050507] py-3 pl-12 pr-4 text-white transition-colors focus:border-brand-purple focus:outline-none"
                  placeholder="name@firm.com"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">
                {t.auth.passwordLabel}
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="password"
                  className="w-full rounded-lg border border-white/10 bg-[#050507] py-3 pl-12 pr-4 text-white transition-colors focus:border-brand-purple focus:outline-none"
                  placeholder="********"
                />
              </div>
            </div>

            <button className="shadow-neon-purple flex w-full items-center justify-center gap-2 rounded-lg bg-brand-purple py-3 font-bold text-white transition-all hover:scale-[1.01] hover:bg-brand-purple/90">
              {t.auth.loginButton}
              <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" />
            </button>
          </form>

          <div className="mt-6 border-t border-white/10 pt-6 text-center">
            <p className="text-sm text-gray-500">
              Do not have an account?{" "}
              <button onClick={() => onNavigate("signup")} className="font-bold text-white hover:underline">
                Sign up
              </button>
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
