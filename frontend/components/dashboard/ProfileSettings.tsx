
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';

const ProfileSettings: React.FC = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    
    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white">{t('settings_title')}</h1>
                <p className="mt-1 text-gray-400">{t('settings_subtitle')}</p>
            </div>
            
            <div className="max-w-2xl">
                <form className="space-y-6 bg-gray-900/50 p-6 rounded-lg border border-gray-700">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-300">{t('settings_name_label')}</label>
                        <input type="text" id="name" defaultValue={user?.name || ''} className="mt-1 w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-300">{t('settings_email_label')}</label>
                        <input type="email" id="email" defaultValue={user?.email || ''} className="mt-1 w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                    
                    <div className="border-t border-gray-700 pt-6">
                        <h3 className="text-lg font-semibold text-white">{t('auth_password_label')}</h3>
                        <div>
                            <label htmlFor="current-password" className="block text-sm font-medium text-gray-300 mt-4">{t('settings_password_current_label')}</label>
                            <input type="password" id="current-password" className="mt-1 w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-indigo-500 focus:border-indigo-500" />
                        </div>
                        <div>
                            <label htmlFor="new-password" className="block text-sm font-medium text-gray-300 mt-4">{t('settings_password_new_label')}</label>
                            <input type="password" id="new-password" className="mt-1 w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-indigo-500 focus:border-indigo-500" />
                        </div>
                    </div>
                    
                    <div>
                        <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2 rounded-md transition-colors">
                            {t('settings_save_button')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProfileSettings;
