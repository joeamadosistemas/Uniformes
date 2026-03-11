import React, { useState } from 'react';
import {
  ArrowLeftRight,
  Settings,
  School,
  Users,
  Database,
  ChevronDown,
  ChevronRight,
  X,
  LayoutDashboard,
  FileText,
  Shirt,
  ClipboardList,
  Info,
  Layers,
  History,
  BarChart3
} from 'lucide-react';
import { useT } from '../lib/LanguageContext';
import { APP_VERSION } from '../version';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  isAdmin?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, isAdmin = false, onClose }) => {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const { t } = useT();

  const menuItems = [
    { id: 'lancamentos', label: t.sidebar.lancamentos, icon: LayoutDashboard },
    ...(isAdmin ? [
      { id: 'status-inventario', label: t.sidebar.statusInventario, icon: BarChart3 },
      { id: 'recebimentos', label: t.sidebar.recebimentos, icon: ClipboardList },
      { id: 'controle-recebimento', label: t.sidebar.controleRecebimento, icon: ClipboardList },
      { id: 'admin-dashboard', label: 'Dashboard', icon: FileText },
      { id: 'transferencias', label: t.sidebar.transferencias, icon: ArrowLeftRight },
    ] : []),
  ];


  const configItems = [
    { id: 'config-uniformes', label: t.sidebar.cadastrosUniformes, icon: Shirt },
    { id: 'config-modelos', label: t.sidebar.cadastroModelos, icon: Layers },
    { id: 'config-escola', label: t.sidebar.unidadeEscolar, icon: School },
    { id: 'config-usuarios', label: t.sidebar.usuarios, icon: Users },
    { id: 'config-audit', label: t.sidebar.auditLogs, icon: History },
    { id: 'config-backup', label: t.sidebar.backupRestauracao, icon: Database },
    { id: 'config-sobre', label: t.sidebar.sobreSistema, icon: Info },
  ];

  return (
    <aside className="w-72 bg-white dark:bg-zinc-950 text-gray-800 dark:text-zinc-200 flex flex-col h-full shadow-2xl border-r border-gray-100 dark:border-zinc-900 transition-all duration-300">
      {/* Header */}
      <div className="p-6 flex items-center justify-between bg-gradient-to-br from-[#005A9C] to-[#004a80] text-white shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-inner p-1.5">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/6/63/Bras%C3%A3o_de_Armas_de_Itagua%C3%AD.jpg"
              alt="Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-lg font-extrabold tracking-tight">Uniforme Escolar</h1>
        </div>
        {onClose && (
          <button onClick={onClose} className="hover:bg-white/10 p-1 rounded transition-colors">
            <X size={24} />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-4 bg-white dark:bg-zinc-950">
        <ul className="grid grid-cols-3 gap-2 px-2 md:grid-cols-1 md:flex md:flex-col md:px-0">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <li key={item.id} className="md:px-3 md:mb-1">
                <button
                  onClick={() => setActiveView(item.id)}
                  className={`w-full flex flex-col md:flex-row items-center md:px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                    ? 'bg-[#005A9C]/10 text-[#005A9C] dark:bg-[#66b3ff]/10 dark:text-[#66b3ff]'
                    : 'text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-900 hover:text-gray-900 dark:hover:text-white'
                    }`}
                >
                  <div className="flex flex-col md:flex-row items-center md:space-x-4 flex-1">
                    <Icon className={`w-6 h-6 md:w-5 md:h-5 mb-1.5 md:mb-0 ${isActive ? 'text-[#005A9C] dark:text-[#66b3ff]' : 'text-gray-400 group-hover:text-[#005A9C] dark:group-hover:text-[#66b3ff]'}`} />
                    <span className={`text-[10px] md:text-sm text-center leading-tight font-medium ${isActive ? 'font-bold' : ''}`}>
                      {item.label}
                    </span>
                  </div>
                  <ChevronRight size={14} className={`hidden md:block ${isActive ? 'opacity-100' : 'opacity-0'} group-hover:opacity-100 group-hover:translate-x-1 transition-all`} />
                </button>
              </li>
            );
          })}

          {/* Mobile Only: Flattened Config Items for the 3x4 Grid */}
          {isAdmin && configItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <li key={`mobile-${item.id}`} className="md:hidden">
                <button
                  onClick={() => setActiveView(item.id)}
                  className={`w-full flex flex-col items-center py-3 rounded-xl transition-all duration-200 ${isActive
                    ? 'bg-[#005A9C]/10 text-[#005A9C] dark:bg-[#66b3ff]/10 dark:text-[#66b3ff]'
                    : 'text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-900 hover:text-gray-900 dark:hover:text-white'
                    }`}
                >
                  <div className="flex flex-col items-center flex-1">
                    <Icon className={`w-6 h-6 mb-1.5 ${isActive ? 'text-[#005A9C] dark:text-[#66b3ff]' : 'text-gray-400'}`} />
                    <span className={`text-[10px] text-center leading-tight font-medium ${isActive ? 'font-bold' : ''}`}>
                      {item.label}
                    </span>
                  </div>
                </button>
              </li>
            );
          })}

          {/* Configurações Dropdown (Desktop Only) */}
          {isAdmin && (
            <li className="hidden md:block mt-4 px-3 border-t border-gray-100 dark:border-zinc-900 pt-4">
              <button
                onClick={() => setIsConfigOpen(!isConfigOpen)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all hover:bg-gray-50 dark:hover:bg-zinc-900 group"
              >
                <div className="flex items-center space-x-4">
                  <Settings size={20} className="text-gray-400 group-hover:text-[#d94e4e] transition-colors" />
                  <span className="text-sm font-bold text-gray-500 dark:text-zinc-500 uppercase tracking-widest">{t.sidebar.configuracoes}</span>
                </div>
                <ChevronDown size={16} className={`text-gray-300 transition-transform duration-300 ${isConfigOpen ? '' : '-rotate-90'}`} />
              </button>

              {isConfigOpen && (
                <ul className="bg-white/50 dark:bg-black/5">
                  {configItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeView === item.id;
                    return (
                      <li key={item.id} className="border-b border-gray-50 dark:border-[#252525] last:border-0 pl-4">
                        <button
                          onClick={() => setActiveView(item.id)}
                          className={`w-full flex items-center space-x-4 px-6 py-3.5 text-sm transition-colors ${isActive
                            ? 'text-[#005A9C] dark:text-[#66b3ff] font-bold'
                            : 'text-gray-500 hover:bg-gray-50 hover:text-[#005A9C]'
                            }`}
                        >
                          <Icon size={18} className={isActive ? 'text-[#005A9C]' : 'text-[#005A9C]/60'} />
                          <span>{item.label}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          )}
        </ul>
      </nav>

      <div className="p-6 border-t border-gray-100 dark:border-zinc-900 text-[10px] font-medium text-gray-400 dark:text-zinc-600 tracking-widest uppercase">
        {t.sidebar.versao} {APP_VERSION}
      </div>
    </aside>
  );
};
