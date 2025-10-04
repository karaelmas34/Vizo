

import React, { useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import CreationWizard from './components/CreationWizard';
import Footer from './components/Footer';
import JobDock from './components/JobDock';
import AuthModal from './components/AuthModal';
import Dashboard from './components/Dashboard';
import Pricing from './components/Pricing';
import Features from './components/Features';
import AdminDashboard from './components/AdminDashboard';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import type { User } from './types';

type View = 'home' | 'creating' | 'dashboard' | 'pricing' | 'features' | 'buyCredits' | 'admin';
export type DashboardView = 'dashboard' | 'creations' | 'settings' | 'billing';
export type AdminDashboardView = 'overview' | 'users' | 'analytics' | 'settings';


const CreditPackage: React.FC<{ count: number; price: string; bestValue?: boolean }> = ({ count, price, bestValue }) => {
    const { t } = useLanguage();
    return (
        <div className={`relative bg-gray-800/50 p-6 rounded-lg border border-gray-700 text-center flex flex-col ${bestValue ? 'border-2 border-purple-500' : ''}`}>
             {bestValue && (
                <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2">
                    <span className="bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase">{t('plan_best_value')}</span>
                </div>
            )}
            <div className="flex-grow">
                <h3 className="text-2xl font-bold text-indigo-400">{t('buy_credits_package_title', { count })}</h3>
                <p className="mt-4 text-4xl font-extrabold">{price}</p>
            </div>
            <button className="mt-6 w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-md transition-colors shadow-lg shadow-indigo-500/30">
                {t('buy_credits_cta', { price })}
            </button>
        </div>
    );
};

const BuyCredits: React.FC = () => {
    const { t } = useLanguage();
    
    return (
        <div className="w-full max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                {t('buy_credits_title')}
            </h1>
            <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
                {t('buy_credits_subtitle')}
            </p>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
                <CreditPackage count={25} price="$5" />
                <CreditPackage count={60} price="$10" />
                <CreditPackage count={150} price="$20" bestValue />
            </div>
        </div>
    );
};

const AppContent: React.FC = () => {
    const [view, setView] = useState<View>('home');
    const [dashboardView, setDashboardView] = useState<DashboardView>('dashboard');
    const [adminDashboardView, setAdminDashboardView] = useState<AdminDashboardView>('overview');
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const { isAuthenticated, user } = useAuth();

    const handleStart = () => {
        if (isAuthenticated) {
            setView('creating');
        } else {
            setIsAuthModalOpen(true);
        }
    };
    
    const handleAuthSuccess = (loggedInUser: User) => {
        setIsAuthModalOpen(false);
        if (loggedInUser.role === 'admin' || loggedInUser.role === 'premium') {
            setView('admin');
        } else {
            setView('creating');
        }
    }

    const resetToHome = () => {
        setView('home');
    };

    const navigateTo = (newView: View, subView?: DashboardView | AdminDashboardView) => {
        setView(newView);
        if (newView === 'dashboard' && subView) {
            setDashboardView(subView as DashboardView);
        } else if (newView === 'dashboard') {
            setDashboardView('dashboard');
        } else if (newView === 'admin' && subView) {
            setAdminDashboardView(subView as AdminDashboardView);
        } else if (newView === 'admin') {
            setAdminDashboardView('overview');
        }
    }

    const renderView = () => {
        switch (view) {
            case 'creating':
                return <CreationWizard onStartNew={resetToHome} />;
            case 'dashboard':
                return <Dashboard activeView={dashboardView} setActiveView={(v) => navigateTo('dashboard', v)} onNavigate={navigateTo} />;
            case 'pricing':
                return <Pricing onStart={handleStart} />;
            case 'features':
                return <Features />;
            case 'buyCredits':
                return <BuyCredits />;
            case 'admin':
                return <AdminDashboard activeView={adminDashboardView} setActiveView={(v) => navigateTo('admin', v)} onNavigate={navigateTo} />;
            case 'home':
            default:
                return <Hero onStart={handleStart} />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-900/40 via-gray-900 to-black -z-10"></div>
            <Header onLogoClick={resetToHome} onLoginClick={() => setIsAuthModalOpen(true)} onNavigate={navigateTo} />
            <main className="flex-grow container mx-auto px-4 py-8 md:py-16 flex items-center justify-center">
                {renderView()}
            </main>
            <JobDock />
            <Footer />
            {isAuthModalOpen && <AuthModal onClose={() => setIsAuthModalOpen(false)} onSuccess={handleAuthSuccess} />}
        </div>
    );
}


function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;