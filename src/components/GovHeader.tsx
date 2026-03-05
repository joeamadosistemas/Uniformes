import React, { useState } from 'react';
import { Moon, Sun, ChevronDown } from 'lucide-react';
import { useT } from '../lib/LanguageContext';
import type { Lang } from '../lib/i18n';

const LANG_FLAGS: Record<Lang, string> = { pt: '🇧🇷', en: '🇺🇸', es: '🇪🇸' };
const LANG_LABELS: Record<Lang, string> = { pt: 'PT', en: 'EN', es: 'ES' };

interface GovHeaderProps {
    userEmail: string;
    userName?: string;
    schoolName?: string;
    isAdmin: boolean;
    onLogout: () => void;
    isDarkMode: boolean;
    toggleDarkMode: () => void;
    onMenuToggle: () => void;
}

export const GovHeader: React.FC<GovHeaderProps> = ({
    userEmail, userName, schoolName, isAdmin, onLogout, isDarkMode, toggleDarkMode, onMenuToggle
}) => {
    const { t, lang, setLang } = useT();
    const [langOpen, setLangOpen] = useState(false);

    const handleLang = (l: Lang) => { setLang(l); setLangOpen(false); };

    return (
        <header className="bg-white dark:bg-zinc-950 border-b border-gray-100 dark:border-zinc-800 shadow-sm sticky top-0 z-[100] transition-all duration-300">
            {/* Top Row: Logo & Controls */}
            <div className="flex justify-between items-start px-4 md:px-8 pt-4 pb-2">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <img
                            className="h-10 md:h-12 object-contain"
                            src="https://upload.wikimedia.org/wikipedia/commons/6/63/Bras%C3%A3o_de_Armas_de_Itagua%C3%AD.jpg"
                            alt="Brasão de Itaguaí"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2 md:gap-4">
                    <a href="https://novoportal.itaguai.rj.gov.br/paginas/jornal-oficial" target="_blank" className="hidden sm:block text-xs md:text-sm text-[#005A9C] dark:text-[#66b3ff] font-medium hover:underline">{t.header.jornal}</a>
                    <div className="hidden sm:block w-px h-4 bg-gray-200 dark:bg-[#333]"></div>
                    <a href="https://portal.transparencia.itaguai.rj.gov.br/" target="_blank" className="hidden sm:block text-xs md:text-sm text-[#005A9C] dark:text-[#66b3ff] font-medium hover:underline">{t.header.transparencia}</a>
                    <div className="hidden sm:block w-px h-4 bg-gray-200 dark:bg-[#333]"></div>

                    {/* ── Language Selector ── */}
                    <div className="relative">
                        <button
                            onClick={() => setLangOpen(!langOpen)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-[10px] md:text-xs font-bold text-[#005A9C] dark:text-[#66b3ff] hover:bg-blue-50 dark:hover:bg-zinc-800 transition-all"
                            title={t.header.selecionarIdioma}
                        >
                            <span>{LANG_LABELS[lang]}</span>
                            <ChevronDown size={14} className={`transition-transform duration-200 ${langOpen ? 'rotate-180' : ''}`} />
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
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-[#005A9C] dark:text-[#66b3ff] hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all duration-200 shadow-sm"
                        title={t.header.alternarTema}
                    >
                        {isDarkMode ? <Sun size={16} className="animate-in spin-in duration-500" /> : <Moon size={16} className="animate-in spin-in duration-500" />}
                    </button>

                    {/* User Profile Dropdown */}
                    <div className="relative group">
                        <button className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-50 dark:bg-zinc-900 border border-blue-100 dark:border-zinc-800 text-[#005A9C] dark:text-[#66b3ff] hover:bg-blue-100 dark:hover:bg-zinc-800 transition-all shadow-sm">
                            <i className="fa-solid fa-user text-xs"></i>
                        </button>
                        <div className="absolute top-full right-0 mt-2 w-56 glass shadow-xl rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible translate-y-2 group-hover:translate-y-0 transition-all duration-300 z-50 overflow-hidden origin-top-right">
                            <ul className="py-2">
                                <li className="border-b border-gray-100 dark:border-[#333]">
                                    <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 truncate">
                                        <span className="font-bold block text-gray-700 dark:text-gray-200">{userName || userEmail || t.header.meuPerfil}</span>
                                        {isAdmin ? t.header.administrador : t.header.usuario}
                                    </div>
                                </li>
                                <li>
                                    <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 text-left transition-colors">
                                        <i className="fa-solid fa-right-from-bracket"></i>
                                        <span className="font-medium">{t.header.sair}</span>
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Department Name */}
            <div className="px-4 md:px-8 pb-3">
                <span className="text-[13px] md:text-sm font-bold text-[#005A9C] dark:text-[#66b3ff] leading-none block">Secretaria Municipal de Educação</span>
            </div>

            {/* Bottom Row: Path & School */}
            <div className="flex flex-col md:flex-row md:items-center justify-between px-4 md:px-8 pb-4 pt-2 gap-2 relative z-40">
                <div className="flex items-center gap-3">
                    <i
                        id="menu-toggle"
                        className="fa-solid fa-bars menu-icon text-[#005A9C] dark:text-[#66b3ff] text-2xl cursor-pointer hover:bg-blue-50 p-1.5 rounded-lg transition-colors"
                        onClick={onMenuToggle}
                    ></i>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                            <span className="text-[13px] md:text-sm text-[#005A9C] dark:text-[#66b3ff] whitespace-nowrap">Uniforme Escolar</span>
                            <span className="text-gray-300 dark:text-zinc-600">|</span>
                            <span className="text-[12px] md:text-xs font-black text-zinc-900 dark:text-white uppercase tracking-tight">TELA ADMINISTRATIVA</span>
                        </div>
                    </div>
                </div>

                {/* School Unit Display */}
                <div className="pl-11 md:pl-0 mt-1 md:mt-0 flex justify-start md:justify-end w-full md:w-auto">
                    <div className="flex items-center gap-3">
                        <span className="text-[11px] md:text-xs text-gray-500 dark:text-gray-400">Unidade Escolar:</span>
                        <span className="text-[12px] md:text-sm font-bold text-[#005A9C] dark:text-[#66b3ff] cursor-pointer" contentEditable suppressContentEditableWarning>
                            {schoolName || 'CPD'}
                        </span>
                    </div>
                </div>
            </div>
        </header>
    );
};
