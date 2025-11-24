import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface Props {
  onBack: () => void;
}

export const TermsOfService: React.FC<Props> = ({ onBack }) => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 max-w-4xl mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      <div className="tech-card p-10 rounded-2xl bg-[#0a0a0c]">
        <h1 className="text-3xl font-display font-bold text-white mb-2">{t.legal.termsTitle}</h1>
        <p className="text-gray-500 text-sm mb-10">{t.legal.lastUpdated}</p>

        <div className="prose prose-invert max-w-none prose-headings:font-display prose-a:text-brand-purple">
          <h3>1. Acceptance of Terms</h3>
          <p>
            By accessing or using Blex, you agree to be bound by these Terms of Service. If you do not agree,
            do not use our services.
          </p>

          <h3>2. Subscription & Payments</h3>
          <p>
            Services are billed on a subscription basis (monthly or annually). You agree to provide accurate billing info.
            Accounts may be suspended for non-payment.
          </p>

          <h3>3. Acceptable Use</h3>
          <p>
            You agree not to misuse the Blex platform. You are responsible for all activity under your account.
            Any illegal use related to legal practice is strictly prohibited.
          </p>

          <h3>4. Intellectual Property</h3>
          <p>
            The service and its original content (excluding user-provided data) are and will remain the exclusive
            property of Blex Inc.
          </p>

          <h3>5. Limitation of Liability</h3>
          <p>
            Blex is a software tool, not a law firm. We are not liable for legal outcomes or advice provided by
            users of our software to their clients.
          </p>

          <h3>6. Termination</h3>
          <p>
            We may terminate or suspend your account immediately, without prior notice or liability, for any reason
            whatsoever, including without limitation if you breach the Terms.
          </p>
        </div>
      </div>
    </div>
  );
};