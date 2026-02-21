'use client';
import React, { createContext, useContext, useState, useCallback } from 'react';
import { translations, type TranslationKey } from '@/data/translations';

type Language = 'en' | 'ta';

interface LanguageContextType {
    language: Language;
    toggleLanguage: () => void;
    t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType>({
    language: 'en',
    toggleLanguage: () => { },
    t: (key) => key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguage] = useState<Language>('en');

    const toggleLanguage = () => setLanguage(prev => (prev === 'en' ? 'ta' : 'en'));

    const t = useCallback(
        (key: TranslationKey): string => {
            return translations[language][key] || translations['en'][key] || key;
        },
        [language]
    );

    return (
        <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export const useLanguage = () => useContext(LanguageContext);
