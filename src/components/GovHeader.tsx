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
    activeView: string;
}
export const GovHeader: React.FC<GovHeaderProps> = ({
    userEmail, userName, schoolName, isAdmin, onLogout, isDarkMode, toggleDarkMode, onMenuToggle, activeView
}) => {
    const { t, lang, setLang } = useT();
    const [langOpen, setLangOpen] = useState(false);

    const handleLang = (l: Lang) => { setLang(l); setLangOpen(false); };

    return (
        <header className="bg-white dark:bg-zinc-950 border-b border-gray-100 dark:border-zinc-800 shadow-sm sticky top-0 z-[100] transition-all duration-300">
            {/* Row 1: Logo & Top Actions */}
            <div className="flex flex-col md:flex-row justify-between items-center px-4 md:px-8 py-3 gap-4">
                <div className="flex items-center gap-2 md:gap-3">
                    <img
                        className="h-8 md:h-12 object-contain"
                        src="https://upload.wikimedia.org/wikipedia/commons/6/63/Bras%C3%A3o_de_Armas_de_Itagua%C3%AD.jpg"
                        alt="Brasão de Itaguaí"
                    />
                    <div className="w-px h-6 md:h-8 bg-gray-200 dark:bg-zinc-800"></div>
                    <span className="text-xs md:text-base font-extrabold text-[#084D8E] dark:text-[#66b3ff] leading-tight">
                        Secretaria Municipal de Educação
                    </span>
                </div>

                <div className="flex items-center gap-3 md:gap-6">
                    <div className="hidden lg:flex items-center gap-4">
                        <a href="https://novoportal.itaguai.rj.gov.br/paginas/jornal-oficial" target="_blank" className="text-[11px] md:text-xs text-[#084D8E] dark:text-[#66b3ff] font-bold hover:underline uppercase tracking-wider">{t.header.jornal}</a>
                        <div className="w-px h-3 bg-gray-200 dark:bg-zinc-800"></div>
                        <a href="https://portal.transparencia.itaguai.rj.gov.br/" target="_blank" className="text-[11px] md:text-xs text-[#084D8E] dark:text-[#66b3ff] font-bold hover:underline uppercase tracking-wider">{t.header.transparencia}</a>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* ── Language Selector ── */}
                        <div className="relative">
                            <button
                                onClick={() => setLangOpen(!langOpen)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900 text-[10px] font-black text-gray-600 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-800 transition-all"
                            >
                                <span>{LANG_LABELS[lang]}</span>
                                <ChevronDown size={12} className={`transition-transform duration-200 ${langOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {langOpen && (
                                <div className="absolute top-full right-0 mt-1.5 w-24 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl shadow-xl overflow-hidden z-50">
                                    {(['pt', 'en', 'es'] as Lang[]).filter(l => l !== lang).map(l => (
                                        <button key={l} onClick={() => handleLang(l)} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-600 dark:text-zinc-300 hover:bg-blue-50 dark:hover:bg-zinc-800">
                                            <span>{LANG_FLAGS[l]}</span> <span>{LANG_LABELS[l]}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Theme Toggle */}
                        <button
                            onClick={toggleDarkMode}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50/50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 text-gray-500 hover:bg-white transition-all shadow-sm"
                        >
                            {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
                        </button>

                        {/* Profile */}
                        <div className="relative group">
                            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-[#005A9C] text-white shadow-lg shadow-blue-500/20 hover:scale-105 transition-all">
                                <i className="fa-solid fa-user text-xs"></i>
                            </button>
                            <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-zinc-900 shadow-2xl rounded-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible translate-y-2 group-hover:translate-y-0 transition-all duration-300 z-50 overflow-hidden border border-gray-100 dark:border-zinc-800">
                                <div className="px-4 py-3 border-b border-gray-50 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/30">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{isAdmin ? 'Administrador' : 'Gestor Escolar'}</p>
                                    <p className="text-xs font-bold text-gray-800 dark:text-white truncate">{userName || userEmail}</p>
                                </div>
                                <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-left font-bold">
                                    <i className="fa-solid fa-right-from-bracket"></i>
                                    <span>{t.header.sair}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-[#f8fafc] dark:bg-zinc-900/50 border-t border-gray-100 dark:border-zinc-800/50 px-4 md:px-8 py-2 md:py-3">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-4">
                    <div className="flex items-start md:items-center gap-3 md:gap-4 w-full md:w-auto">
                        <button
                            onClick={onMenuToggle}
                            className="p-1.5 md:p-2 text-[#005A9C] dark:text-[#66b3ff] hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all"
                        >
                            <i className="fa-solid fa-bars text-lg md:text-xl"></i>
                        </button>
                        <div className="flex flex-col md:flex-row md:items-center gap-0.5 md:gap-2 text-sm flex-1">
                            <div className="flex items-center gap-2">
                                <span className="font-medium text-[#005A9C] dark:text-[#66b3ff] hidden sm:inline">Uniforme Escolar</span>
                                <span className="text-gray-300 dark:text-zinc-700 hidden sm:inline">|</span>
                                <span className="font-black text-zinc-600 dark:text-zinc-400 uppercase tracking-tight text-[10px] md:text-xs">Tela Administrativa</span>
                            </div>
                            
                            {activeView === 'status-inventario' && (
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-300 dark:text-zinc-700 hidden md:inline">|</span>
                                    <span className="font-black text-[#005A9C] dark:text-[#66b3ff] uppercase tracking-tight text-[10px] md:text-xs leading-tight">
                                        STATUS DO INVENTÁRIO DOS UNIFORMES - SOBRANDO OU FALTANDO
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center">
                        <span className="text-[9px] md:text-xs font-bold text-gray-400 uppercase tracking-widest">Unidade Escolar:</span>
                        <div className="px-2 md:px-3 py-0.5 md:py-1 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg shadow-sm">
                            <span className="text-[10px] md:text-sm font-black text-[#005A9C] dark:text-[#66b3ff] uppercase">
                                {schoolName || 'SMEDU'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};
