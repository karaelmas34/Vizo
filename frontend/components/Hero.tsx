
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface HeroProps {
  onStart: () => void;
}

const Hero: React.FC<HeroProps> = ({ onStart }) => {
  const { t } = useLanguage();
  return (
    <div className="text-center max-w-4xl mx-auto">
      <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight">
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-500">
          {t('hero_title')}
        </span>
      </h1>
      <p className="mt-6 text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
        {t('hero_subtitle')}
      </p>
      <div className="mt-10">
        <button 
          onClick={onStart}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-lg px-8 py-4 rounded-lg transition-transform transform hover:scale-105 shadow-lg shadow-indigo-500/30">
          {t('hero_cta')}
        </button>
      </div>
    </div>
  );
};

export default Hero;
