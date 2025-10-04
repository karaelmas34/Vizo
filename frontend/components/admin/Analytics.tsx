
import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

const Analytics: React.FC = () => {
    const { t } = useLanguage();

    return (
        <div>
            <h1 className="text-3xl font-bold text-white mb-6">{t('admin_analytics')}</h1>
            <div className="grid grid-cols-1 gap-6">
                <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-700 h-96 flex items-center justify-center">
                     <p className="text-gray-500">Charts and detailed analytics will be displayed here.</p>
                </div>
                 <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-700 h-64 flex items-center justify-center">
                     <p className="text-gray-500">More reports will be available soon.</p>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
