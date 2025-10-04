
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const Footer: React.FC = () => {
  const { t } = useLanguage();
  return (
    <footer className="w-full bg-black bg-opacity-20">
      <div className="container mx-auto px-4 py-6 text-center text-gray-500 text-sm">
        <p>&copy; {new Date().getFullYear()} VizoAI. {t('footer_rights')}</p>
        <p>{t('footer_tagline')}</p>
      </div>
    </footer>
  );
};

export default Footer;