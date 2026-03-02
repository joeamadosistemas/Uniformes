import React, { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabaseClient';
import { Sidebar } from './components/Sidebar';
import { Lancamentos } from './views/Lancamentos';
import { UnidadeEscolar } from './views/UnidadeEscolar';
import { Usuarios } from './views/Usuarios';
import { Transferencias } from './views/Transferencias';
import { DashboardAdmin } from './views/DashboardAdmin';
import { CadastrosUniformes } from './views/CadastrosUniformes';
import { PlaceholderView } from './views/PlaceholderView';
import { Login } from './views/Login';
import { UserCircle, LogOut } from 'lucide-react';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [activeView, setActiveView] = useState('lancamentos');

  useEffect(() => {
    // Carrega sessão existente ao iniciar
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoadingSession(false);
    });

    // Escuta mudanças de autenticação em tempo real
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // onAuthStateChange definirá session como null automaticamente
  };

  // Tela de carregamento enquanto verifica sessão
  if (loadingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <svg className="animate-spin" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          <span className="text-sm">Verificando sessão...</span>
        </div>
      </div>
    );
  }

  // Sem sessão → exibe Login
  if (!session) {
    return <Login onLoginSuccess={() => {/* onAuthStateChange cuida do redirect */ }} />;
  }

  const userEmail = session.user?.email ?? '';
  const isAdmin = userEmail === 'cpdinfra@edu.itaguai.rj.gov.br';

  const renderView = () => {
    // Bloqueia views restritas para não-admins
    const adminViews = ['admin-dashboard', 'config-escola', 'config-usuarios', 'config-uniformes', 'config-backup', 'config-sobre'];
    if (!isAdmin && adminViews.includes(activeView)) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3 py-24">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <p className="text-lg font-semibold text-gray-500">Acesso Restrito</p>
          <p className="text-sm">Este módulo é exclusivo para Administradores.</p>
        </div>
      );
    }

    switch (activeView) {
      case 'lancamentos': return <Lancamentos />;
      case 'transferencias': return <Transferencias />;
      case 'admin-dashboard': return <DashboardAdmin />;
      case 'config-escola': return <UnidadeEscolar />;
      case 'config-usuarios': return <Usuarios />;
      case 'config-uniformes': return <CadastrosUniformes />;
      case 'config-backup': return <PlaceholderView title="Backup e Restauração" />;
      case 'config-sobre': return <PlaceholderView title="Sobre o Sistema" />;
      default: return <Lancamentos />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar activeView={activeView} setActiveView={setActiveView} isAdmin={isAdmin} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-8 shadow-sm z-10">
          <h2 className="text-lg font-semibold text-gray-700 capitalize">
            {activeView.replace('config-', '').replace('-', ' ')}
          </h2>
          <div className="flex items-center space-x-3 text-sm">
            <div className="text-right">
              <p className="font-medium text-gray-800">{isAdmin ? 'Administrador' : 'Escola'}</p>
              <p className="text-gray-500 text-xs truncate max-w-[200px]">{userEmail}</p>
            </div>
            <UserCircle size={36} className="text-gray-400" />
            <button
              onClick={handleLogout}
              title="Sair do Sistema"
              className="ml-1 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors duration-150 focus:outline-none"
            >
              <LogOut size={20} />
            </button>
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
