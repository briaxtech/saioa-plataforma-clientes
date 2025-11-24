
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from './context/LanguageContext';
import { Quote, ChevronLeft, ChevronRight, Star } from 'lucide-react';

export const Testimonials: React.FC = () => {
  const { t } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoplay, setAutoplay] = useState(true);

  const items = t.testimonials.items;

  // Generic avatars for the testimonials based on index
  const avatars = [
    "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200&h=200", // Javier
    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200&h=200"  // Valentina
  ];

  useEffect(() => {
    if (!autoplay) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [autoplay, items.length]);

  const next = () => {
    setAutoplay(false);
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  const prev = () => {
    setAutoplay(false);
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  return (
    <section className="py-32 bg-[#020204] border-t border-white/5 relative overflow-hidden">
      {/* Tech Grid Overlay */}
      <div className="absolute inset-0 tech-grid pointer-events-none opacity-50" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-display font-bold mb-4 text-white"
          >
            {t.testimonials.title}
          </motion.h2>
        </div>

        <div className="relative max-w-5xl mx-auto">
          {/* Controls */}
          <div className="flex justify-end gap-2 mb-4 md:absolute md:top-1/2 md:-left-20 md:-translate-y-1/2 md:block">
            <button onClick={prev} className="p-3 border border-white/10 bg-[#0a0a0c] hover:border-brand-purple/50 text-white rounded-lg transition-colors">
              <ChevronLeft size={20} />
            </button>
          </div>
          <div className="hidden md:block absolute md:top-1/2 md:-right-20 md:-translate-y-1/2">
            <button onClick={next} className="p-3 border border-white/10 bg-[#0a0a0c] hover:border-brand-purple/50 text-white rounded-lg transition-colors">
              <ChevronRight size={20} />
            </button>
          </div>

          <div
            className="min-h-[350px] md:min-h-[300px] relative"
            onMouseEnter={() => setAutoplay(false)}
            onMouseLeave={() => setAutoplay(true)}
          >
            <AnimatePresence mode='wait'>
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0"
              >
                <div className="bg-[#050507] border border-white/10 rounded-2xl p-8 md:p-12 h-full flex flex-col md:flex-row gap-8 items-center shadow-2xl relative">
                  {/* Decorative corner accent */}
                  <div className="absolute top-0 right-0 w-20 h-20 border-t border-r border-white/10 rounded-tr-2xl opacity-50"></div>

                  {/* Avatar Image */}
                  <div className="shrink-0 relative">
                    <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-br from-white/20 to-transparent">
                      <img
                        src={avatars[currentIndex % avatars.length]}
                        alt={items[currentIndex].author}
                        className="w-full h-full rounded-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
                      />
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-[#0a0a0c] p-2 rounded-full border border-white/10 text-brand-purple">
                      <Quote size={16} fill="currentColor" />
                    </div>
                  </div>

                  <div className="flex-1 text-center md:text-left">
                    <div className="flex gap-1 justify-center md:justify-start mb-6">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} className="text-brand-purple fill-brand-purple" />
                      ))}
                    </div>
                    <p className="text-xl md:text-2xl font-light text-gray-200 mb-6 leading-relaxed">
                      "{items[currentIndex].quote}"
                    </p>
                    <div>
                      <div className="font-bold text-white text-lg font-display uppercase tracking-wider">{items[currentIndex].author}</div>
                      <div className="text-sm text-gray-500 font-mono mt-1">{items[currentIndex].role} • {items[currentIndex].country}</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Lines Progress */}
          <div className="flex justify-center gap-2 mt-8">
            {items.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setAutoplay(false);
                  setCurrentIndex(idx);
                }}
                className={`h-1 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-12 bg-brand-purple' : 'w-4 bg-white/10 hover:bg-white/30'
                  }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
