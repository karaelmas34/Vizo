
import React, { createContext, useState, useContext, ReactNode } from 'react';
import translations, { Language, TranslationKey } from '../i18n';

interface LanguageContextType {
    language: Language;
    setLanguage: (language: Language) => void;
    t: (key: TranslationKey, options?: { [key: string]: string | number }) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState<Language>('tr');

    const t = (key: TranslationKey, options?: { [key: string]: string | number }): string => {
        let text = translations[language][key] || translations['en'][key] || key;
        if (options) {
            Object.keys(options).forEach(k => {
                text = text.replace(new RegExp(`{{${k}}}`, 'g'), String(options[k]));
            });
        }
        return text;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = (): LanguageContextType => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
