

import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import type { DashboardView } from '../App';
import DashboardHome from './dashboard/DashboardHome';
import MyCreations from './dashboard/MyCreations';
import ProfileSettings from './dashboard/ProfileSettings';
import Billing from './dashboard/Billing';

type View = 'home' | 'creating' | 'dashboard' | 'pricing' | 'features' | 'buyCredits' | 'admin';

interface DashboardProps {
    activeView: DashboardView;
    setActiveView: (view: DashboardView) => void;
    onNavigate: (view: View, subView?: DashboardView) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ activeView, setActiveView, onNavigate }) => {
    const { t } = useLanguage();

    const menuItems: { name: string; view: DashboardView; icon: string; }[] = [
        { name: t('profile_dashboard'), view: 'dashboard', icon: '📊' },
        { name: t('profile_creations'), view: 'creations', icon: '🎨' },
        { name: t('profile_settings'), view: 'settings', icon: '⚙️' },
        { name: t('profile_billing'), view: 'billing', icon: '💳' },
    ];

    const renderContent = () => {
        switch (activeView) {
            case 'creations':
                return <MyCreations onNavigate={onNavigate} />;
            case 'settings':
                return <ProfileSettings />;
            case 'billing':
                return <Billing onNavigate={onNavigate} />;
            case 'dashboard':
            default:
                return <DashboardHome />;
        }
    };

    return (
        <div className="w-full max-w-7xl mx-auto bg-gray-800/50 rounded-lg border border-gray-700 flex min-h-[600px] overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 bg-gray-900/40 p-6 flex-flex-col">
                <h2 className="text-xl font-bold mb-8 text-white">{t('dashboard_title')}</h2>
                <nav className="flex flex-col space-y-2">
                    {menuItems.map((item) => (
                        <button 
                            key={item.view}
                            onClick={() => setActiveView(item.view)}
                            className={`flex items-center space-x-3 px-4 py-2 rounded-md text-gray-300 hover:bg-indigo-500 hover:text-white transition-colors w-full text-left ${activeView === item.view ? 'bg-indigo-600 text-white' : ''}`}
                        >
                            <span>{item.icon}</span>
                            <span>{item.name}</span>
                        </button>
                    ))}
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-10">
                {renderContent()}
            </main>
        </div>
    );
};

export default Dashboard;