import React from 'react';
import { Moon, Sun, Accessibility, Cookie } from 'lucide-react';

interface GovHeaderProps {
    userEmail: string;
    isAdmin: boolean;
    onLogout: () => void;
    isDarkMode: boolean;
    toggleDarkMode: () => void;
    onMenuToggle: () => void;
}

export const GovHeader: React.FC<GovHeaderProps> = ({
    userEmail,
    isAdmin,
    onLogout,
    isDarkMode,
    toggleDarkMode,
    onMenuToggle
}) => {
    return (
        <header className="bg-white dark:bg-[#1e1e1e] border-b border-gray-200 dark:border-[#333] shadow-sm sticky top-0 z-[100] transition-colors duration-200">
            {/* Top Header */}
            <div className="flex justify-between items-center px-4 md:px-8 py-3 border-b border-gray-100 dark:border-[#333]">
                <div className="flex items-center gap-4">
                    <img
                        className="h-5 md:h-6"
                        src="https://novoportal.itaguai.rj.gov.br/@@obter_logo_portal/logo25.png"
                        alt="Prefeitura de Itaguaí"
                    />
                    <div className="w-px h-6 bg-gray-200 dark:bg-[#333]"></div>
                    <span className="text-sm md:text-base text-gray-700 dark:text-gray-300">Estado do Rio de Janeiro</span>
                </div>

                <div className="flex items-center gap-3 md:gap-5">
                    <a href="https://novoportal.itaguai.rj.gov.br/paginas/jornal-oficial" target="_blank" className="hidden sm:block text-xs md:text-sm text-[#005A9C] dark:text-[#66b3ff] font-medium hover:underline">Jornal Oficial</a>
                    <div className="hidden sm:block w-px h-4 bg-gray-200 dark:bg-[#333]"></div>
                    <a href="https://portal.transparencia.itaguai.rj.gov.br/" target="_blank" className="hidden sm:block text-xs md:text-sm text-[#005A9C] dark:text-[#66b3ff] font-medium hover:underline">Transparência</a>
                    <div className="hidden sm:block w-px h-4 bg-gray-200 dark:bg-[#333]"></div>

                    <button onClick={toggleDarkMode} className="text-[#1452b5] dark:text-[#66b3ff] p-1" title="Modo Noturno">
                        {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                    <button className="text-[#1452b5] dark:text-[#66b3ff] p-1" title="Acessibilidade">
                        <Accessibility size={18} />
                    </button>
                    <button className="text-[#1452b5] dark:text-[#66b3ff] p-1" title="Privacidade">
                        <Cookie size={18} />
                    </button>
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
                    <span className="text-gray-300 dark:text-[#333]">|</span>
                    <span className="font-bold text-gray-800 dark:text-gray-200 uppercase whitespace-nowrap">TELA ADMINISTRATIVA</span>
                    <span className="text-gray-300 dark:text-[#333]">|</span>
                    <div className="flex items-center gap-1">
                        <span className="text-gray-600 dark:text-gray-400">Unidade Escolar:</span>
                        <span className="font-bold text-[#005A9C] dark:text-[#66b3ff] cursor-pointer" contentEditable>SMEDU</span>
                    </div>
                </div>

                <div className="ml-auto relative group">
                    <div className="flex items-center gap-2 cursor-pointer">
                        <i className="fa-solid fa-user-circle text-2xl text-[#005A9C] dark:text-[#66b3ff]"></i>
                        <span className="hidden md:inline font-medium text-gray-700 dark:text-gray-300">{isAdmin ? 'Administrador' : 'Usuário'}</span>
                    </div>

                    <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-[#1e1e1e] border border-gray-100 dark:border-[#333] shadow-lg rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                        <ul className="py-2">
                            <li className="border-b border-gray-50 dark:border-[#333] last:border-0">
                                <a href="#" className="flex items-center gap-3 px-4 py-3 text-xs md:text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#333]">
                                    <i className="fa-solid fa-user text-[#005A9C] text-base"></i>
                                    <span className="truncate">{userEmail || 'Meu Perfil'}</span>
                                </a>
                            </li>
                            <li>
                                <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 text-xs md:text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-[#331111] text-left">
                                    <i className="fa-solid fa-right-from-bracket text-red-500 text-base"></i>
                                    <span className="font-medium">Sair</span>
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </header>
    );
};
