import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Lang, Translations, translations } from './i18n';

interface LanguageContextValue {
    lang: Lang;
    setLang: (l: Lang) => void;
    t: Translations;
}

const LanguageContext = createContext<LanguageContextValue>({
    lang: 'pt',
    setLang: () => { },
    t: translations.pt,
});

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [lang, setLangState] = useState<Lang>(() => {
        const saved = localStorage.getItem('@Uniformes:lang') as Lang | null;
        return (saved && ['pt', 'en', 'es'].includes(saved)) ? saved : 'pt';
    });

    const setLang = (l: Lang) => {
        setLangState(l);
        localStorage.setItem('@Uniformes:lang', l);
        // Atualiza o atributo lang do HTML para leitores de tela
        document.documentElement.lang = l;
    };

    useEffect(() => {
        document.documentElement.lang = lang;
    }, [lang]);

    return (
        <LanguageContext.Provider value={{ lang, setLang, t: translations[lang] }}>
            {children}
        </LanguageContext.Provider>
    );
};

/** Hook para acessar as traduções do idioma atual. */
export const useT = () => useContext(LanguageContext);
