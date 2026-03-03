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
  Info
} from 'lucide-react';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  isAdmin?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, isAdmin = false, onClose }) => {
  const [isConfigOpen, setIsConfigOpen] = useState(true);

  const menuItems = [
    { id: 'lancamentos', label: 'Lançamentos', icon: LayoutDashboard },
    { id: 'transferencias', label: 'Transferências', icon: ArrowLeftRight },
    ...(isAdmin ? [{ id: 'admin-dashboard', label: 'Administrador', icon: FileText }] : []),
  ];

  const configItems = [
    { id: 'config-uniformes', label: 'Cadastros Uniformes', icon: Shirt },
    { id: 'config-escola', label: 'Unidade Escolar', icon: School },
    { id: 'config-usuarios', label: 'Usuários', icon: Users },
    { id: 'config-backup', label: 'Backup e Restauração', icon: Database },
    { id: 'config-sobre', label: 'Sobre o Sistema', icon: Info },
  ];

  return (
    <aside className="w-72 bg-white dark:bg-[#1e1e1e] text-gray-800 dark:text-gray-200 flex flex-col h-full shadow-2xl border-r border-gray-100 dark:border-[#333] transition-all duration-300">
      {/* Header com Botão Fechar */}
      <div className="p-4 flex items-center justify-between bg-[#005A9C] text-white">
        <h1 className="text-lg font-bold">Uniforme Escolar</h1>
        {onClose && (
          <button onClick={onClose} className="hover:bg-white/10 p-1 rounded transition-colors">
            <X size={24} />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto bg-white dark:bg-[#1e1e1e]">
        <ul>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <li key={item.id} className="border-b border-gray-100 dark:border-[#2a2a2a]">
                <button
                  onClick={() => setActiveView(item.id)}
                  className={`w-full flex items-center group px-5 py-4 transition-all ${isActive ? 'bg-gray-50/50' : 'hover:bg-gray-50'
                    }`}
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <Icon size={20} className={isActive ? 'text-[#005A9C] dark:text-[#66b3ff]' : 'text-[#005A9C]/70'} />
                    <span className={`text-sm ${isActive ? 'text-[#005A9C] dark:text-[#66b3ff] font-bold' : 'text-gray-600'}`}>
                      {item.label}
                    </span>
                  </div>
                  <ChevronRight size={16} className={`${isActive ? 'text-[#005A9C]' : 'text-gray-300'} group-hover:translate-x-0.5 transition-transform`} />
                </button>
              </li>
            );
          })}

          {/* Configurações Importantes Dropdown */}
          <li className="mt-2">
            <button
              onClick={() => setIsConfigOpen(!isConfigOpen)}
              className="w-full flex items-center justify-between px-5 py-4 transition-colors hover:bg-gray-50 group border-b border-gray-100 dark:border-[#2a2a2a]"
            >
              <div className="flex items-center space-x-4">
                <Settings size={22} className="text-[#d94e4e]" />
                <span className="font-bold text-[#005A9C] dark:text-[#66b3ff]">Configurações</span>
              </div>
              <ChevronDown size={18} className={`text-gray-400 transition-transform ${isConfigOpen ? '' : '-rotate-90'}`} />
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
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-100 dark:border-[#333] text-[10px] text-gray-400 text-center bg-gray-50/30">
        Versão 1.0.0
      </div>
    </aside>
  );
};
