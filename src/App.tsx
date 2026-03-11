import { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabaseClient';
import { LanguageProvider, useT } from './lib/LanguageContext';
import { Sidebar } from './components/Sidebar';
import { Lancamentos } from './views/Lancamentos';
import { UnidadeEscolar } from './views/UnidadeEscolar';
import { Usuarios } from './views/Usuarios';
import { Transferencias } from './views/Transferencias';
import { DashboardAdmin } from './views/DashboardAdmin';
import { CadastrosUniformes } from './views/CadastrosUniformes';
import { BackupRestauracao } from './views/BackupRestauracao';
import { Sobre } from './views/Sobre';
import { Recebimentos } from './views/Recebimentos';
import { ControleRecebimento } from './views/ControleRecebimento';
import { Login } from './views/Login';
import { GovHeader } from './components/GovHeader';
import { GovFooter } from './components/GovFooter';
import { CadastroModelos } from './views/CadastroModelos';
import { InstallPrompt } from './components/InstallPrompt';
import { BottomNav } from './components/BottomNav';
import { AuditLogs } from './views/AuditLogs';
import { UpdateModal } from './components/UpdateModal';
import { StatusInventario } from './views/StatusInventario';


function App() {
  const { t } = useT();
  const [session, setSession] = useState<Session | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [activeView, setActiveView] = useState('lancamentos');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      localStorage.setItem('theme', 'light');
      return false;
    }
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userRole, setUserRole] = useState<string>('Operador');
  const [userName, setUserName] = useState<string>('');
  const [escolaNome, setEscolaNome] = useState<string>('SMEDU');

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    let isMounted = true;
    let currentUser = '';

    // Carrega sessão existente ao iniciar
    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      setSession(data.session);
      const newUserId = data.session?.user?.id;
      if (newUserId) {
        currentUser = newUserId;
        loadUserRole(newUserId, data.session?.user?.email);
      } else {
        setLoadingSession(false);
      }
    });

    // Escuta mudanças de autenticação em tempo real
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!isMounted) return;
      setSession(newSession);
      const newUserId = newSession?.user?.id;

      // Só recarrega roles se o usuário mudou (evita fetch em token refresh)
      if (newUserId && newUserId !== currentUser) {
        currentUser = newUserId;
        loadUserRole(newSession.user.id, newSession.user.email);
      } else if (!newUserId) {
        currentUser = '';
        setUserRole('Operador');
        setLoadingSession(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loadUserRole = async (userId: string, userEmail?: string) => {
    setLoadingSession(true);
    let foundEscolaNome = false;

    try {
      // Tenta carregar do profiles
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role, nome, email_escola')
        .eq('id', userId)
        .maybeSingle();

      if (!error && profile) {
        if (profile.role) {
          setUserRole(profile.role);
          if (profile.role === 'Super Administrador' || profile.role === 'admin' || profile.role === 'Diretor') {
            setActiveView('controle-recebimento');
          }
        }
        if (profile.nome) setUserName(profile.nome);

        if (profile.email_escola) {
          const { data: escola } = await supabase
            .from('escolas')
            .select('nome')
            .eq('email', profile.email_escola)
            .maybeSingle();

          if (escola && escola.nome) {
            setEscolaNome(escola.nome);
            foundEscolaNome = true;
          }
        }
      } else {
        // Fallback para caso haja profiles antigas ou apenas roles
        const { data: profileOld, error: oldError } = await supabase
          .from('profiles')
          .select('role, nome')
          .eq('id', userId)
          .maybeSingle();

        if (!oldError && profileOld) {
          if (profileOld.role) {
            setUserRole(profileOld.role);
            if (profileOld.role === 'Super Administrador' || profileOld.role === 'admin' || profileOld.role === 'Diretor') {
              setActiveView('controle-recebimento');
            }
          }
          if (profileOld.nome) setUserName(profileOld.nome);
        }
      }

      // Se ainda não encontrou o nome da escola pelo perfil criado,
      // tenta buscar a escola pelo e-mail de login, sendo comum a escola logar
      // com o seu próprio endereço cadastrado na base "escolas".
      if (!foundEscolaNome && userEmail) {
        const { data: escolaFallback, error: fallbackError } = await supabase
          .from('escolas')
          .select('nome')
          .eq('email', userEmail)
          .maybeSingle();

        if (!fallbackError && escolaFallback && escolaFallback.nome) {
          setEscolaNome(escolaFallback.nome);
          foundEscolaNome = true;
        }
      }
    } catch (err) {
      console.warn('Erro silencioso ao carregar role/escola:', err);
    }

    if (!foundEscolaNome) {
      setEscolaNome('SMEDU');
    }

    setLoadingSession(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserRole('Operador');
    setUserName('');
  };

  // Tela de carregamento enquanto verifica sessão
  if (loadingSession) {
    return (
      <LanguageProvider>
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-[#121212]">
          <div className="flex flex-col items-center gap-3 text-gray-500">
            <svg className="animate-spin text-[#005A9C]" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            <span className="text-sm">{t.common.verificandoSessao}</span>
          </div>
        </div>
      </LanguageProvider>
    );
  }

  // Sem sessão → exibe Login
  if (!session) {
    return (
      <LanguageProvider>
        <Login onLoginSuccess={() => {/* onAuthStateChange cuida do redirect */ }} />
      </LanguageProvider>
    );
  }

  const userEmail = session.user?.email ?? '';
  const isAdmin = userRole === 'Super Administrador' || userRole === 'admin';

  const renderView = () => {
    const adminViews = [
      'admin-dashboard',
      'status-inventario',
      'controle-recebimento',
      'recebimentos',
      'transferencias',
      'config-escola',
      'config-usuarios',
      'config-uniformes',
      'config-modelos',
      'config-backup',
      'config-sobre',
      'config-audit'
    ];
    if (!isAdmin && adminViews.includes(activeView)) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3 py-24">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <p className="text-lg font-semibold text-gray-500">{t.common.acessoRestrito}</p>
          <p className="text-sm">{t.common.moduloExclusivo}</p>
        </div>
      );
    }

    switch (activeView) {
      case 'lancamentos': return <Lancamentos />;
      case 'recebimentos': return <Recebimentos />;
      case 'transferencias': return <Transferencias />;
      case 'admin-dashboard': return <DashboardAdmin />;
      case 'status-inventario': return <StatusInventario />;
      case 'controle-recebimento': return <ControleRecebimento />;
      case 'config-escola': return <UnidadeEscolar />;
      case 'config-usuarios': return <Usuarios />;
      case 'config-uniformes': return <CadastrosUniformes />;
      case 'config-modelos': return <CadastroModelos />;
      case 'config-backup': return <BackupRestauracao />;
      case 'config-audit': return <AuditLogs />;
      case 'config-sobre': return <Sobre />;
      default: return <Lancamentos />;
    }
  };

  return (
    <LanguageProvider>
      <div className="flex flex-col min-h-screen bg-[#f2f2f2] dark:bg-[#121212] transition-colors duration-200">
        {/* Sidebar Navigation - Fixed Overlay with Push logic on Desktop */}
        <div className={`
          fixed inset-y-0 left-0 z-[110] transition-all duration-300 ease-in-out bg-white dark:bg-[#1e1e1e] w-full lg:w-72
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
            userName={userName}
            schoolName={escolaNome}
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
                <main className="p-4 md:p-8 flex-1 pb-24 md:pb-8">
                  <div className="mx-auto w-full">
                    {renderView()}
                  </div>
                </main>
                <GovFooter />
              </div>
            </div>
          </div>
          <BottomNav activeView={activeView} setActiveView={setActiveView} isAdmin={isAdmin} />
          <InstallPrompt />
          <UpdateModal isAdmin={isAdmin} currentVersion="2.0.4" />
        </div>
      </div>
    </LanguageProvider>
  );
}

export default App;
