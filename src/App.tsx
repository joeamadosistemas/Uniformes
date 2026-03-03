import { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabaseClient';
import { Sidebar } from './components/Sidebar';
import { Lancamentos } from './views/Lancamentos';
import { UnidadeEscolar } from './views/UnidadeEscolar';
import { Usuarios } from './views/Usuarios';
import { Transferencias } from './views/Transferencias';
import { DashboardAdmin } from './views/DashboardAdmin';
import { CadastrosUniformes } from './views/CadastrosUniformes';
import { BackupRestauracao } from './views/BackupRestauracao';
import { Sobre } from './views/Sobre';
import { Login } from './views/Login';
import { GovHeader } from './components/GovHeader';
import { GovFooter } from './components/GovFooter';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [activeView, setActiveView] = useState('lancamentos');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [userRole, setUserRole] = useState<string>('Operador');

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    // Carrega sessão existente ao iniciar
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) loadUserRole(data.session.user.id);
      else setLoadingSession(false);
    });

    // Escuta mudanças de autenticação em tempo real
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) loadUserRole(newSession.user.id);
      else { setUserRole('Operador'); setLoadingSession(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserRole = async (userId: string) => {
    setLoadingSession(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
    if (!error && data?.role) setUserRole(data.role);
    setLoadingSession(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserRole('Operador');
  };

  // Tela de carregamento enquanto verifica sessão
  if (loadingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-[#121212]">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <svg className="animate-spin text-[#005A9C]" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
  const isAdmin = userRole === 'Super Administrador' || userRole === 'admin';

  const renderView = () => {
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
      case 'config-backup': return <BackupRestauracao />;
      case 'config-sobre': return <Sobre />;
      default: return <Lancamentos />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f2f2f2] dark:bg-[#121212] transition-colors duration-200">
      {/* Sidebar Navigation - Fixed Overlay with Push logic on Desktop */}
      <div className={`
        fixed inset-y-0 left-0 z-[110] transition-all duration-300 ease-in-out bg-white dark:bg-[#1e1e1e] w-72
        ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full shadow-none'}
      `}>
        <Sidebar
          activeView={activeView}
          setActiveView={(view) => {
            setActiveView(view);
            if (window.innerWidth < 1024) setIsSidebarOpen(false);
          }}
          isAdmin={isAdmin}
          onClose={() => setIsSidebarOpen(false)}
        />
      </div>

      {/* Main Container */}
      <div className={`flex flex-col flex-1 min-h-screen transition-all duration-300 ${isSidebarOpen ? 'lg:pl-72' : 'pl-0'}`}>
        <GovHeader
          userEmail={userEmail}
          isAdmin={isAdmin}
          onLogout={handleLogout}
          isDarkMode={isDarkMode}
          toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
          onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Overlay only for mobile/tablet when sidebar is open */}
          {isSidebarOpen && (
            <div
              className="lg:hidden fixed inset-0 bg-black/40 z-[105] transition-opacity duration-300"
              onClick={() => setIsSidebarOpen(false)}
            ></div>
          )}

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <div className="flex-1 overflow-y-auto flex flex-col">
              <main className="p-4 md:p-8 flex-1">
                <div className="mx-auto w-full">
                  <h2 className="text-2xl font-bold text-[#005A9C] dark:text-[#66b3ff] mb-6 capitalize border-b pb-2">
                    {activeView.replace('config-', '').replace('-', ' ')}
                  </h2>
                  {renderView()}
                </div>
              </main>
              <GovFooter />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
