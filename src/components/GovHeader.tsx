import React, { useState } from 'react';
import { Moon, Sun, Accessibility, Cookie, ChevronDown } from 'lucide-react';
import { useT } from '../lib/LanguageContext';
import type { Lang } from '../lib/i18n';

const LANG_FLAGS: Record<Lang, string> = { pt: '🇧🇷', en: '🇺🇸', es: '🇪🇸' };
const LANG_LABELS: Record<Lang, string> = { pt: 'PT', en: 'EN', es: 'ES' };

interface GovHeaderProps {
    userEmail: string;
    userName?: string;
    isAdmin: boolean;
    onLogout: () => void;
    isDarkMode: boolean;
    toggleDarkMode: () => void;
    onMenuToggle: () => void;
}

export const GovHeader: React.FC<GovHeaderProps> = ({
    userEmail, userName, isAdmin, onLogout, isDarkMode, toggleDarkMode, onMenuToggle
}) => {
    const { t, lang, setLang } = useT();
    const [langOpen, setLangOpen] = useState(false);

    const handleLang = (l: Lang) => { setLang(l); setLangOpen(false); };

    return (
        <header className="bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-gray-100 dark:border-zinc-800 shadow-sm sticky top-0 z-[100] transition-all duration-300">
            {/* Top Header */}
            <div className="flex justify-between items-center px-4 md:px-8 py-2 border-b border-gray-50 dark:border-zinc-800/50">
                <div className="flex items-center gap-4">
                    <img
                        className="h-5 md:h-6"
                        src="https://novoportal.itaguai.rj.gov.br/@@obter_logo_portal/logo25.png"
                        alt="Prefeitura de Itaguaí"
                    />
                    <div className="w-px h-6 bg-gray-100 dark:bg-zinc-800"></div>
                    <span className="text-xs md:text-sm font-medium text-gray-500 dark:text-zinc-400">Estado do Rio de Janeiro</span>
                </div>

                <div className="flex items-center gap-3 md:gap-4">
                    <a href="https://novoportal.itaguai.rj.gov.br/paginas/jornal-oficial" target="_blank" className="hidden sm:block text-xs md:text-sm text-[#005A9C] dark:text-[#66b3ff] font-medium hover:underline">{t.header.jornal}</a>
                    <div className="hidden sm:block w-px h-4 bg-gray-200 dark:bg-[#333]"></div>
                    <a href="https://portal.transparencia.itaguai.rj.gov.br/" target="_blank" className="hidden sm:block text-xs md:text-sm text-[#005A9C] dark:text-[#66b3ff] font-medium hover:underline">{t.header.transparencia}</a>
                    <div className="hidden sm:block w-px h-4 bg-gray-200 dark:bg-[#333]"></div>

                    {/* ── Language Selector ── */}
                    <div className="relative">
                        <button
                            onClick={() => setLangOpen(!langOpen)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-bold text-[#005A9C] dark:text-[#66b3ff] hover:bg-blue-50 dark:hover:bg-zinc-800 transition-all"
                            title={t.header.selecionarIdioma}
                        >
                            <span>{LANG_FLAGS[lang]}</span>
                            <span>{LANG_LABELS[lang]}</span>
                            <ChevronDown size={13} className={`transition-transform duration-200 ${langOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {langOpen && (
                            <div className="absolute top-full right-0 mt-1.5 w-24 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl shadow-xl overflow-hidden z-50">
                                {(['pt', 'en', 'es'] as Lang[]).filter(l => l !== lang).map(l => (
                                    <button
                                        key={l}
                                        onClick={() => handleLang(l)}
                                        className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-semibold text-gray-600 dark:text-zinc-300 hover:bg-blue-50 dark:hover:bg-zinc-800 transition-colors"
                                    >
                                        <span>{LANG_FLAGS[l]}</span>
                                        <span>{LANG_LABELS[l]}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={toggleDarkMode}
                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-[#005A9C] dark:text-[#66b3ff] hover:scale-110 active:scale-95 transition-all duration-200"
                        title={t.header.alternarTema}
                    >
                        {isDarkMode ? <Sun size={18} className="animate-in spin-in duration-500" /> : <Moon size={18} className="animate-in spin-in duration-500" />}
                    </button>
                    <button className="text-[#1452b5] dark:text-[#66b3ff] p-1" title={t.header.acessibilidade}><Accessibility size={18} /></button>
                    <button className="text-[#1452b5] dark:text-[#66b3ff] p-1" title={t.header.privacidade}><Cookie size={18} /></button>
                </div>
            </div>

            {/* Bottom Header */}
            <div className="header-bottom flex items-center px-4 md:px-8 py-3 gap-4">
                <i
                    id="menu-toggle"
                    className="fa-solid fa-bars menu-icon text-[#005A9C] dark:text-[#66b3ff] text-2xl cursor-pointer"
                    onClick={onMenuToggle}
                ></i>
                <div className="department-info flex flex-wrap items-center text-xs md:text-sm gap-2">
                    <a href="#" className="font-bold text-[#005A9C] dark:text-[#66b3ff] hover:underline whitespace-nowrap">Secretaria Municipal de Educação</a>
                    <a href="#" className="text-[#005A9C] dark:text-[#66b3ff] hover:underline whitespace-nowrap">Portal SESME-C</a>
                    <span className="text-gray-300 dark:text-[#333]">|</span>
                    <a href="#" className="text-[#005A9C] dark:text-[#66b3ff] hover:underline whitespace-nowrap">Uniforme Escolar</a>
                    <span className="text-gray-200 dark:text-zinc-800">|</span>
                    <span className="font-bold text-zinc-900 dark:text-white uppercase tracking-tight whitespace-nowrap">{t.header.telaAdministrativa}</span>
                    <span className="text-gray-300 dark:text-[#333]">|</span>
                    <div className="flex items-center gap-1">
                        <span className="text-gray-600 dark:text-gray-400">{t.header.unidadeEscolar}:</span>
                        <span className="font-bold text-[#005A9C] dark:text-[#66b3ff] cursor-pointer" contentEditable>SMEDU</span>
                    </div>
                </div>

                <div className="ml-auto relative group">
                    <div className="flex items-center gap-2 cursor-pointer">
                        <i className="fa-solid fa-user-circle text-2xl text-[#005A9C] dark:text-[#66b3ff]"></i>
                        <span className="hidden md:inline font-medium text-gray-700 dark:text-gray-300">
                            {isAdmin ? t.header.administrador : t.header.usuario}
                        </span>
                    </div>

                    <div className="absolute top-full right-0 mt-2 w-64 glass shadow-2xl rounded-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible translate-y-2 group-hover:translate-y-0 transition-all duration-300 z-50 overflow-hidden">
                        <ul className="py-2">
                            <li className="border-b border-gray-50 dark:border-[#333] last:border-0">
                                <a href="#" className="flex items-center gap-3 px-4 py-3 text-xs md:text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#333]">
                                    <i className="fa-solid fa-user text-[#005A9C] text-base"></i>
                                    <span className="truncate font-medium">{userName || userEmail || t.header.meuPerfil}</span>
                                </a>
                            </li>
                            <li>
                                <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 text-xs md:text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-[#331111] text-left">
                                    <i className="fa-solid fa-right-from-bracket text-red-500 text-base"></i>
                                    <span className="font-medium">{t.header.sair}</span>
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </header>
    );
};
