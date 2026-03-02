import React, { useState } from 'react';
import {
  LayoutDashboard,
  Settings,
  School,
  Users,
  Shirt,
  Database,
  Info,
  ArrowLeftRight,
  BarChart3,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  isAdmin?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, isAdmin = false }) => {
  const [isConfigOpen, setIsConfigOpen] = useState(true);

  const menuItems = [
    { id: 'lancamentos', label: 'Lançamentos', icon: LayoutDashboard },
    { id: 'transferencias', label: 'Transferências', icon: ArrowLeftRight },
    ...(isAdmin ? [{ id: 'admin-dashboard', label: 'Administrador', icon: BarChart3 }] : []),
  ];

  const configItems = [
    { id: 'config-uniformes', label: 'Cadastros Uniformes', icon: Shirt },
    { id: 'config-escola', label: 'Unidade Escolar', icon: School },
    { id: 'config-usuarios', label: 'Usuários', icon: Users },
    { id: 'config-backup', label: 'Backup e Restauração', icon: Database },
    { id: 'config-sobre', label: 'Sobre o Sistema', icon: Info },
  ];

  return (
    <aside className="w-64 bg-blue-900 text-white flex flex-col h-full shadow-xl">
      <div className="p-6 flex items-center space-x-3 border-b border-blue-800">
        <School size={28} className="text-blue-300" />
        <h1 className="text-xl font-bold tracking-tight">SMEDU-Uniforme</h1>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => setActiveView(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-blue-800 text-white font-medium' : 'text-blue-100 hover:bg-blue-800/50'
                    }`}
                >
                  <Icon size={20} className={isActive ? 'text-blue-300' : 'text-blue-300/70'} />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}

          {/* Configurações Dropdown — apenas Admin */}
          {isAdmin && (
            <li className="pt-4">
              <button
                onClick={() => setIsConfigOpen(!isConfigOpen)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-blue-100 hover:bg-blue-800/50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <Settings size={20} className="text-blue-300/70" />
                  <span className="font-medium">Configurações</span>
                </div>
                {isConfigOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>

              {isConfigOpen && (
                <ul className="mt-1 space-y-1 pl-11 pr-3">
                  {configItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeView === item.id;
                    return (
                      <li key={item.id}>
                        <button
                          onClick={() => setActiveView(item.id)}
                          className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm transition-colors ${isActive ? 'bg-blue-800 text-white font-medium' : 'text-blue-200 hover:bg-blue-800/50'
                            }`}
                        >
                          <Icon size={16} className={isActive ? 'text-blue-300' : 'text-blue-300/70'} />
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

      <div className="p-4 border-t border-blue-800 text-xs text-blue-300/60 text-center">
        Versão 1.0.0
      </div>
    </aside>
  );
};
