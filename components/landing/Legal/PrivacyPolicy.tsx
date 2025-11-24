import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface Props {
  onBack: () => void;
}

export const PrivacyPolicy: React.FC<Props> = ({ onBack }) => {
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
        <h1 className="text-3xl font-display font-bold text-white mb-2">{t.legal.privacyTitle}</h1>
        <p className="text-gray-500 text-sm mb-10">{t.legal.lastUpdated}</p>

        <div className="prose prose-invert max-w-none prose-headings:font-display prose-a:text-brand-purple">
          <h3>1. Data Collection</h3>
          <p>
            We collect information you provide directly to us when you create an account, subscribe to our newsletter,
            or communicate with us. This includes contact details, billing information, and legal case data entered into the system.
          </p>

          <h3>2. Use of Information</h3>
          <p>
            We use your information to operate, maintain, and improve Blex. Specifically, to provide the SaaS functionality,
            process transactions, and send related information including confirmations and invoices.
          </p>

          <h3>3. Data Security</h3>
          <p>
            Blex employs industry-standard AES-256 encryption for data at rest and TLS 1.3 for data in transit.
            We conduct regular security audits. However, no internet transmission is 100% secure.
          </p>

          <h3>4. User Rights</h3>
          <p>
            You have the right to access, correct, or delete your personal data. You may also object to processing
            or request data portability. Contact privacy@blex.io for requests.
          </p>

          <h3>5. International Transfers</h3>
          <p>
            Your information may be transferred to, stored, and processed in a country different from your own.
            We ensure appropriate safeguards are in place (Standard Contractual Clauses).
          </p>
        </div>
      </div>
    </div>
  );
};