import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';

type View = 'home' | 'creating' | 'dashboard' | 'pricing' | 'features' | 'buyCredits' | 'admin';

interface BillingProps {
    onNavigate: (view: View) => void;
}

const Billing: React.FC<BillingProps> = ({ onNavigate }) => {
    const { user } = useAuth();
    const { t } = useLanguage();
    
    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white">{t('billing_title')}</h1>
                <p className="mt-1 text-gray-400">{t('billing_subtitle')}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-700 flex flex-col justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-white mb-4">{t('billing_current_plan')}</h2>
                        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                            <p className="text-2xl font-bold text-indigo-400 capitalize">{user?.role === 'admin' ? 'Admin' : 'User'}</p>
                            <p className="text-gray-400 mt-1">
                                {t('step4_available_tokens', { tokens: user?.role === 'admin' ? '∞' : user?.credits || 0 })}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={() => onNavigate('pricing')}
                        className="mt-6 bg-purple-600 hover:bg-purple-500 text-white font-semibold px-4 py-2 rounded-md transition-colors w-full"
                    >
                        {t('billing_upgrade_button')}
                    </button>
                </div>
                <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-700">
                    <h2 className="text-xl font-semibold text-white mb-4">{t('billing_history')}</h2>
                    <p className="text-gray-500">No payment history found.</p>
                </div>
            </div>
        </div>
    );
};

export default Billing;
