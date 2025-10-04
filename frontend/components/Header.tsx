import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import ProfileDropdown from './ProfileDropdown';
import type { DashboardView } from '../App';

interface HeaderProps {
    onLogoClick: () => void;
    onLoginClick: () => void;
    onNavigate: (view: 'home' | 'creating' | 'dashboard' | 'pricing' | 'features' | 'buyCredits' | 'admin', subView?: DashboardView) => void;
}

const CreditsIcon: React.FC = () => (
    <svg className="w-5 h-5 text-yellow-400" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6h1.5V6zm-.75 10.5a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
    </svg>
);


const VizoAILogo: React.FC = () => (
    <div className="flex items-center space-x-2">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
            <path d="M2 7L12 12L22 7" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
            <path d="M12 12V22" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
            <path d="M7 4.5L17 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <span className="text-2xl font-bold">VizoAI</span>
    </div>
);

const LanguageSelector: React.FC = () => {
    const { language, setLanguage, t } = useLanguage();

    const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setLanguage(e.target.value as 'tr' | 'en');
    };

    return (
        <div className="relative">
            <select
                value={language}
                onChange={handleLanguageChange}
                className="bg-gray-700 border border-gray-600 rounded-md py-2 pl-3 pr-8 text-sm font-medium text-white appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                aria-label={t('language_selector_label')}
            >
                <option value="tr">Türkçe</option>
                <option value="en">English</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-300">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
        </div>
    );
};


const Header: React.FC<HeaderProps> = ({ onLogoClick, onLoginClick, onNavigate }) => {
  const { t } = useLanguage();
  const { isAuthenticated, user } = useAuth();

  return (
    <header className="w-full">
      <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
        <button onClick={onLogoClick} className="cursor-pointer" aria-label={t('home_button_label')}>
          <VizoAILogo />
        </button>
        <div className="flex items-center space-x-6 text-sm font-medium text-gray-300">
          <button onClick={() => onNavigate('features')} className="hover:text-white transition-colors">{t('features')}</button>
          <button onClick={() => onNavigate('pricing')} className="hover:text-white transition-colors">{t('pricing')}</button>
          {isAuthenticated && user ? (
            <>
                <div className="flex items-center space-x-4 bg-gray-800/50 px-3 py-1.5 rounded-full">
                     <button
                        onClick={() => onNavigate('buyCredits')}
                        title={t('header_tooltip_premium_tokens')}
                        className="flex items-center space-x-2 rounded-md hover:bg-gray-700/50 p-1 -m-1 transition-colors"
                    >
                        <CreditsIcon />
                        <span className="text-xs font-semibold text-gray-300">{t('user_tokens')}</span>
                        <span className="font-bold text-white">{user.role === 'admin' ? '∞' : user.credits}</span>
                    </button>
                </div>
                <ProfileDropdown onNavigate={onNavigate} />
            </>
          ) : (
            <>
              <button onClick={onLoginClick} className="hover:text-white transition-colors">{t('login')}</button>
              <button onClick={onLoginClick} className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2 rounded-md transition-colors">
                {t('start_free')}
              </button>
            </>
          )}
          <LanguageSelector />
        </div>
      </nav>
    </header>
  );
};

export default Header;
