import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Lancamentos } from './views/Lancamentos';
import { UnidadeEscolar } from './views/UnidadeEscolar';
import { Usuarios } from './views/Usuarios';
import { Transferencias } from './views/Transferencias';
import { DashboardAdmin } from './views/DashboardAdmin';
import { CadastrosUniformes } from './views/CadastrosUniformes';
import { PlaceholderView } from './views/PlaceholderView';
import { UserCircle } from 'lucide-react';

function App() {
  const [activeView, setActiveView] = useState('lancamentos');

  const renderView = () => {
    switch (activeView) {
      case 'lancamentos':
        return <Lancamentos />;
      case 'transferencias':
        return <Transferencias />;
      case 'admin-dashboard':
        return <DashboardAdmin />;
      case 'config-escola':
        return <UnidadeEscolar />;
      case 'config-usuarios':
        return <Usuarios />;
      case 'config-uniformes':
        return <CadastrosUniformes />;
      case 'config-backup':
        return <PlaceholderView title="Backup e Restauração" />;
      case 'config-sobre':
        return <PlaceholderView title="Sobre o Sistema" />;
      default:
        return <Lancamentos />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar activeView={activeView} setActiveView={setActiveView} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-8 shadow-sm z-10">
          <h2 className="text-lg font-semibold text-gray-700 capitalize">
            {activeView.replace('config-', '').replace('-', ' ')}
          </h2>
          <div className="flex items-center space-x-3 text-sm">
            <div className="text-right">
              <p className="font-medium text-gray-800">Administrador</p>
              <p className="text-gray-500 text-xs">Acesso Total</p>
            </div>
            <UserCircle size={36} className="text-gray-400" />
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">
            {renderView()}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
