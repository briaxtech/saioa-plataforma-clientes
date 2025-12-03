/* eslint-disable @next/next/no-img-element */
import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useLanguage } from "./context/LanguageContext"
import { Quote, ChevronLeft, ChevronRight, Star } from "lucide-react"

export const Testimonials: React.FC = () => {
  const { t } = useLanguage()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [autoplay, setAutoplay] = useState(true)

  const items = t.testimonials.items

  const avatars = [
    "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200&h=200",
    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200&h=200",
  ]

  useEffect(() => {
    if (!autoplay) return
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length)
    }, 8000)
    return () => clearInterval(timer)
  }, [autoplay, items.length])

  const next = () => {
    setAutoplay(false)
    setCurrentIndex((prev) => (prev + 1) % items.length)
  }

  const prev = () => {
    setAutoplay(false)
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length)
  }

  return (
    <section className="relative overflow-hidden border-t border-white/5 bg-[#020204] py-32">
      <div className="tech-grid pointer-events-none absolute inset-0 opacity-50" />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <div className="mb-16 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-4xl font-bold text-white md:text-5xl"
          >
            {t.testimonials.title}
          </motion.h2>
        </div>

        <div className="relative mx-auto max-w-5xl">
          <div className="mb-4 flex justify-end gap-2 md:absolute md:-left-20 md:top-1/2 md:block md:-translate-y-1/2">
            <button
              onClick={prev}
              className="rounded-lg border border-white/10 bg-[#0a0a0c] p-3 text-white transition-colors hover:border-brand-purple/50"
              aria-label="Anterior testimonio"
            >
              <ChevronLeft size={20} />
            </button>
          </div>
          <div className="absolute hidden md:-right-20 md:top-1/2 md:block md:-translate-y-1/2">
            <button
              onClick={next}
              className="rounded-lg border border-white/10 bg-[#0a0a0c] p-3 text-white transition-colors hover:border-brand-purple/50"
              aria-label="Siguiente testimonio"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <div
            className="relative min-h-[350px] md:min-h-[300px]"
            onMouseEnter={() => setAutoplay(false)}
            onMouseLeave={() => setAutoplay(true)}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0"
              >
                <div className="relative flex h-full flex-col items-center gap-8 rounded-2xl border border-white/10 bg-[#050507] p-8 shadow-2xl md:flex-row md:p-12">
                  <div className="absolute right-0 top-0 h-20 w-20 rounded-tr-2xl border-t border-r border-white/10 opacity-50" />

                  <div className="relative shrink-0">
                    <div className="h-24 w-24 rounded-full bg-gradient-to-br from-white/20 to-transparent p-1">
                      <img
                        src={avatars[currentIndex % avatars.length]}
                        alt={`Foto de ${items[currentIndex].author}`}
                        className="h-full w-full rounded-full object-cover transition-all duration-500 grayscale hover:grayscale-0"
                      />
                    </div>
                    <div className="absolute -bottom-2 -right-2 rounded-full border border-white/10 bg-[#0a0a0c] p-2 text-brand-purple">
                      <Quote size={16} fill="currentColor" />
                    </div>
                  </div>

                  <div className="flex-1 text-center md:text-left">
                    <div className="mb-6 flex justify-center gap-1 md:justify-start">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} className="fill-brand-purple text-brand-purple" />
                      ))}
                    </div>
                    <p className="mb-6 text-xl font-light leading-relaxed text-gray-200 md:text-2xl">
                      “{items[currentIndex].quote}”
                    </p>
                    <div>
                      <div className="font-display text-lg font-bold uppercase tracking-wider text-white">
                        {items[currentIndex].author}
                      </div>
                      <div className="mt-1 font-mono text-sm text-gray-500">
                        {items[currentIndex].role} · {items[currentIndex].country}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-8 flex justify-center gap-2">
            {items.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setAutoplay(false)
                  setCurrentIndex(idx)
                }}
                className={`h-1 rounded-full transition-all duration-300 ${
                  idx === currentIndex ? "w-12 bg-brand-purple" : "w-4 bg-white/10 hover:bg-white/30"
                }`}
                aria-label={`Ver testimonio ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
