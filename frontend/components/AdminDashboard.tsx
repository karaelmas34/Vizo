
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import type { AdminDashboardView, DashboardView } from '../App';
import AdminOverview from './admin/AdminOverview';
import UserManagement from './admin/UserManagement';
import Analytics from './admin/Analytics';

type View = 'home' | 'creating' | 'dashboard' | 'pricing' | 'features' | 'buyCredits' | 'admin';

interface AdminDashboardProps {
    activeView: AdminDashboardView;
    setActiveView: (view: AdminDashboardView) => void;
    onNavigate: (view: View, subView?: DashboardView | AdminDashboardView) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ activeView, setActiveView, onNavigate }) => {
    const { t } = useLanguage();

    const menuItems: { name: string; view: AdminDashboardView; icon: string; }[] = [
        { name: t('admin_overview'), view: 'overview', icon: '📊' },
        { name: t('admin_user_management'), view: 'users', icon: '👥' },
        { name: t('admin_analytics'), view: 'analytics', icon: '📈' },
        { name: t('admin_settings'), view: 'settings', icon: '⚙️' },
    ];

    const renderContent = () => {
        switch (activeView) {
            case 'users':
                return <UserManagement />;
            case 'analytics':
                return <Analytics />;
            case 'overview':
            default:
                return <AdminOverview />;
        }
    };

    return (
        <div className="w-full max-w-7xl mx-auto bg-gray-800/50 rounded-lg border border-gray-700 flex min-h-[600px] overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 bg-gray-900/40 p-6 flex-flex-col">
                <h2 className="text-xl font-bold mb-8 text-cyan-400">{t('admin_panel_title')}</h2>
                <nav className="flex flex-col space-y-2">
                    {menuItems.map((item) => (
                        <button 
                            key={item.view}
                            onClick={() => setActiveView(item.view)}
                            className={`flex items-center space-x-3 px-4 py-2 rounded-md text-gray-300 hover:bg-cyan-500 hover:text-white transition-colors w-full text-left ${activeView === item.view ? 'bg-cyan-600 text-white' : ''}`}
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

export default AdminDashboard;
