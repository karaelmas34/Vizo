

import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

type View = 'home' | 'creating' | 'dashboard' | 'pricing' | 'features' | 'buyCredits' | 'admin';

interface MyCreationsProps {
    onNavigate: (view: View) => void;
}

const MyCreations: React.FC<MyCreationsProps> = ({ onNavigate }) => {
    const { t } = useLanguage();
    
    // Mock data for creations
    const creations = [
        { id: 1, title: 'Mountain Adventure', thumbnail: 'https://via.placeholder.com/300x200.png/1f2937/ffffff?text=Video+1' },
        { id: 2, title: 'City at Night', thumbnail: 'https://via.placeholder.com/300x200.png/1f2937/ffffff?text=Video+2' },
        { id: 3, title: 'Forest Story', thumbnail: 'https://via.placeholder.com/300x200.png/1f2937/ffffff?text=Video+3' },
    ];

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white">{t('creations_title')}</h1>
                    <p className="mt-1 text-gray-400">{t('creations_subtitle')}</p>
                </div>
                <button 
                    onClick={() => onNavigate('creating')}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2 rounded-md transition-colors"
                >
                    {t('creations_new')}
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {creations.map(creation => (
                    <div key={creation.id} className="bg-gray-900/50 rounded-lg overflow-hidden border border-gray-700 group">
                        <img src={creation.thumbnail} alt={creation.title} className="w-full h-40 object-cover" />
                        <div className="p-4">
                            <h3 className="font-semibold text-white">{creation.title}</h3>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MyCreations;