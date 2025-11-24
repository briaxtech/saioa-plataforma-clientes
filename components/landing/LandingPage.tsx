"use client";

import React, { useState, useEffect } from 'react';
import { LanguageProvider } from './context/LanguageContext';
import { Header } from './Header';
import { Hero } from './Hero';
import { ProductShowcase } from './ProductShowcase';
import { Features } from './Features';
import { Pricing } from './Pricing';
import { WhoWeAre } from './WhoWeAre';
import { Footer } from './Footer';
import { ChatWidget } from './ChatWidget';
import { Testimonials } from './Testimonials';
import { FAQ } from './FAQ';
import { CookieBanner } from './CookieBanner';
import { Login } from './Login';
import { Signup } from './Signup';
import { Contact } from './Contact';
import { PrivacyPolicy } from './Legal/PrivacyPolicy';
import { TermsOfService } from './Legal/TermsOfService';
import { View } from './types';

const LandingPage: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('home');

  useEffect(() => {
    const hash = window.location.hash.substring(1);
    if (hash === 'who-we-are') setCurrentView('who-we-are');
  }, []);

  const handleNavigate = (view: View) => {
    setCurrentView(view);
    window.scrollTo(0, 0);
  };

  const renderView = () => {
    switch(currentView) {
      case 'solutions': return <Features />;
      case 'login': return <Login onNavigate={handleNavigate} />;
      case 'signup': return <Signup onNavigate={handleNavigate} />;
      case 'contact': return <Contact />;
      case 'who-we-are': return <WhoWeAre onNavigate={handleNavigate} />;
      case 'privacy': return <PrivacyPolicy onBack={() => handleNavigate('home')} />;
      case 'terms': return <TermsOfService onBack={() => handleNavigate('home')} />;
      case 'home':
      default:
        return (
          <>
            <Hero />
            <ProductShowcase />
            <Pricing />
            <Testimonials />
            <FAQ />

            {/* Final CTA - Dark Tech Style */}
            <section id="cta" className="py-24 md:py-32 text-center relative overflow-hidden px-4 border-t border-white/5 bg-[#020204]">
               <div className="absolute inset-0 bg-gradient-to-b from-transparent to-brand-purple/10 opacity-30 pointer-events-none" />
               <div className="relative z-10 max-w-4xl mx-auto">
                 <h2 className="text-3xl md:text-5xl font-display font-bold mb-6 md:mb-8 tracking-tight text-glow text-white">
                   Ready to modernize your firm?
                 </h2>
                 <p className="text-lg md:text-xl text-gray-400 mb-8 md:mb-10 max-w-2xl mx-auto">
                   Don't let another client slip through the cracks. Let Lexy handle the details.
                 </p>
                 <button 
                    onClick={() => handleNavigate('signup')}
                    className="w-full md:w-auto px-10 py-4 bg-brand-purple hover:bg-brand-purple/90 text-white font-bold text-lg rounded-lg shadow-neon-purple transition-all hover:scale-105 border border-brand-purple/50"
                 >
                   Start Free 14-Day Trial
                 </button>
                 <p className="mt-6 text-xs text-gray-500 uppercase tracking-widest">No credit card required • Cancel anytime</p>
               </div>
            </section>
          </>
        );
    }
  };

  return (
    <LanguageProvider>
      <div className="min-h-screen bg-[#020204] text-white font-sans selection:bg-brand-purple selection:text-white landing-scroll">
        {/* Global Tech Grid Background */}
        <div className="fixed inset-0 tech-grid pointer-events-none z-0" />
        
        <div className="relative z-10">
          <Header onNavigate={handleNavigate} />
          <main>
            {renderView()}
          </main>
          <Footer onNavigate={handleNavigate} />
        </div>
        <ChatWidget />
        <CookieBanner />
      </div>
    </LanguageProvider>
  );
};

export default LandingPage;
