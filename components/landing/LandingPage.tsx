"use client"

import React, { useState, useEffect } from "react"
import { LanguageProvider } from "./context/LanguageContext"
import { Header } from "./Header"
import { Hero } from "./Hero"
import { ProductShowcase } from "./ProductShowcase"
import { Features } from "./Features"
import { Pricing } from "./Pricing"
import { WhoWeAre } from "./WhoWeAre"
import { Footer } from "./Footer"
import { ChatWidget } from "./ChatWidget"
import { Testimonials } from "./Testimonials"
import { FAQ } from "./FAQ"
import { CookieBanner } from "./CookieBanner"
import { Login } from "./Login"
import { Signup } from "./Signup"
import { Contact } from "./Contact"
import { PrivacyPolicy } from "./Legal/PrivacyPolicy"
import { TermsOfService } from "./Legal/TermsOfService"
import type { View } from "./types"

const LandingPage: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>("home")

  useEffect(() => {
    const hash = window.location.hash.substring(1)
    if (hash === "who-we-are") setCurrentView("who-we-are")
  }, [])

  const handleNavigate = (view: View) => {
    setCurrentView(view)
    window.scrollTo(0, 0)
  }

  const renderView = () => {
    switch (currentView) {
      case "solutions":
        return <Features />
      case "login":
        return <Login onNavigate={handleNavigate} />
      case "signup":
        return <Signup onNavigate={handleNavigate} />
      case "contact":
        return <Contact />
      case "who-we-are":
        return <WhoWeAre onNavigate={handleNavigate} />
      case "privacy":
        return <PrivacyPolicy onBack={() => handleNavigate("home")} />
      case "terms":
        return <TermsOfService onBack={() => handleNavigate("home")} />
      case "home":
      default:
        return (
          <>
            <Hero />
            <ProductShowcase />
            <Pricing />
            <Testimonials />
            <FAQ />

            <section
              id="cta"
              className="relative overflow-hidden border-t border-white/5 bg-[#020204] px-4 py-24 text-center md:py-32"
            >
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent to-brand-purple/10 opacity-30" />
              <div className="relative z-10 mx-auto max-w-4xl">
                <h2 className="text-3xl font-display font-bold tracking-tight text-glow text-white md:text-5xl">
                  Ready to modernize your firm?
                </h2>
                <p className="mx-auto mb-8 mt-6 max-w-2xl text-lg text-gray-400 md:mb-10 md:text-xl">
                  Do not let another client slip through the cracks. Let Lexy handle the details.
                </p>
                <button
                  onClick={() => handleNavigate("signup")}
                  className="w-full rounded-lg border border-brand-purple/50 bg-brand-purple px-10 py-4 text-lg font-bold text-white shadow-neon-purple transition-all hover:scale-105 hover:bg-brand-purple/90 md:w-auto"
                >
                  Start Free 14-Day Trial
                </button>
                <p className="mt-6 text-xs uppercase tracking-widest text-gray-500">No credit card required - cancel anytime</p>
              </div>
            </section>
          </>
        )
    }
  }

  return (
    <LanguageProvider>
      <div className="landing-scroll min-h-screen bg-[#020204] font-sans text-white selection:bg-brand-purple selection:text-white">
        <div className="tech-grid fixed inset-0 pointer-events-none z-0" />

        <div className="relative z-10">
          <Header onNavigate={handleNavigate} />
          <main>{renderView()}</main>
          <Footer onNavigate={handleNavigate} />
        </div>
        <ChatWidget />
        <CookieBanner />
      </div>
    </LanguageProvider>
  )
}

export default LandingPage
