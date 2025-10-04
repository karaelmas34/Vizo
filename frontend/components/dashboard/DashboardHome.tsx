
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';

const DashboardHome: React.FC = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    
    return (
        <div>
            <div className="text-left">
                <h1 className="text-4xl font-bold text-white">
                    {t('dashboard_welcome', { name: user?.name || '' })}
                </h1>
                <p className="mt-2 text-lg text-gray-400">
                    {t('dashboard_subtitle')}
                </p>
            </div>

            {/* Placeholder for future content */}
            <div className="mt-8 p-8 border-2 border-dashed border-gray-600 rounded-lg h-96 flex items-center justify-center">
                <p className="text-gray-500">Your creations and statistics will appear here.</p>
            </div>
        </div>
    );
};

export default DashboardHome;
