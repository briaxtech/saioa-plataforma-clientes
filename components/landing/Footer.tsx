
import React from 'react';
import { Briefcase, Twitter, Linkedin, Github } from 'lucide-react';
import { useLanguage } from './context/LanguageContext';
import { View } from './types';

interface FooterProps {
  onNavigate: (view: View) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { t } = useLanguage();

  return (
    <footer className="bg-[#050505] border-t border-white/10 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-gradient-purple rounded-lg flex items-center justify-center">
                <Briefcase className="text-white w-5 h-5" />
              </div>
              <span className="text-xl font-display font-bold text-white">Blex</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              {t.footer.desc}
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors"><Twitter size={20} /></a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors"><Linkedin size={20} /></a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors"><Github size={20} /></a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Product</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><button onClick={() => onNavigate('home')} className="hover:text-brand-purple transition-colors">Features</button></li>
              <li><button onClick={() => onNavigate('home')} className="hover:text-brand-purple transition-colors">Pricing</button></li>
              <li><a href="#" className="hover:text-brand-purple transition-colors">API</a></li>
              <li><a href="#" className="hover:text-brand-purple transition-colors">Integrations</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Resources</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><a href="#" className="hover:text-brand-purple transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-brand-purple transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-brand-purple transition-colors">Community</a></li>
              <li><a href="#" className="hover:text-brand-purple transition-colors">Help Center</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Company</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><button onClick={() => onNavigate('who-we-are')} className="hover:text-brand-purple transition-colors">About / Who We Are</button></li>
              <li><a href="#" className="hover:text-brand-purple transition-colors">Careers</a></li>
              <li><button onClick={() => onNavigate('privacy')} className="hover:text-brand-purple transition-colors">Legal</button></li>
              <li><button onClick={() => onNavigate('contact')} className="hover:text-brand-purple transition-colors">Contact</button></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <p>{t.footer.copyright}</p>
          <div className="flex gap-6">
            <button onClick={() => onNavigate('privacy')} className="hover:text-white">Privacy Policy</button>
            <button onClick={() => onNavigate('terms')} className="hover:text-white">Terms of Service</button>
          </div>
        </div>
      </div>
    </footer>
  );
};
