
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface LoadingScreenProps {
  message: string;
}

const VizoAILogoSpinner: React.FC = () => (
    <div className="relative w-24 h-24">
        <div className="absolute inset-0 border-4 border-indigo-500/30 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-t-indigo-500 rounded-full animate-spin"></div>
        <div className="absolute inset-2 flex items-center justify-center">
             <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-indigo-400">
                <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                <path d="M2 7L12 12L22 7" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                <path d="M12 12V22" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
            </svg>
        </div>
    </div>
);

const LoadingScreen: React.FC<LoadingScreenProps> = ({ message }) => {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-gray-800/50 rounded-lg border border-gray-700 min-h-[400px]">
      <VizoAILogoSpinner />
      <h2 className="text-3xl font-bold mt-8">{t('loading_title')}</h2>
      <p className="text-gray-300 text-lg mt-2">{message}</p>
    </div>
  );
};

export default LoadingScreen;