import { useState, useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCcw } from 'lucide-react';
import { APP_VERSION } from '../version';

export function ReloadPrompt() {
    const [availableVersion, setAvailableVersion] = useState<string | null>(null);

    const {
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r) {
            console.log('SW Registered: ' + r);
            if (r) {
                setInterval(() => {
                    r.update();
                }, 60 * 60 * 1000);
            }
        },
        onRegisterError(error) {
            console.log('SW registration error', error);
        },
    });

    useEffect(() => {
        if (needRefresh) {
            // Fetch version.json from public folder to get the new version number
            fetch('/version.json?t=' + Date.now())
                .then(res => res.json())
                .then(data => {
                    if (data && data.version) {
                        setAvailableVersion(data.version);
                    }
                })
                .catch(err => console.error('Erro ao buscar versão:', err));
        }
    }, [needRefresh]);

    const close = () => {
        setNeedRefresh(false);
    };

    if (!needRefresh) return null;

    return (
        <div className="fixed bottom-4 right-4 z-[9999] flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl bg-white p-5 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] border border-gray-100 dark:bg-zinc-800 dark:border-white/10 dark:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)] max-w-sm animate-in slide-in-from-bottom-5">
            <div className="flex flex-col gap-1 flex-1">
                <p className="text-sm font-black text-zinc-900 dark:text-white flex items-center gap-2 uppercase tracking-tight">
                    <RefreshCcw size={16} className="text-[#005A9C] dark:text-[#66b3ff]" />
                    Atualização Disponível!
                </p>
                <div className="flex flex-col mt-1">
                    <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                        Versão Instalada: <span className="text-zinc-700 dark:text-gray-200">{APP_VERSION}</span>
                    </p>
                    {availableVersion && (
                        <p className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest mt-0.5 animate-pulse">
                            Nova Versão: {availableVersion}
                        </p>
                    )}
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2 leading-tight">
                    Clique em atualizar para carregar as melhorias recentes e limpar o cache.
                </p>
            </div>
            <div className="flex flex-col gap-2 shrink-0 w-full sm:w-auto mt-4 sm:mt-0">
                <button
                    onClick={() => updateServiceWorker(true)}
                    className="w-full bg-[#005A9C] hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                >
                    Atualizar
                </button>
                <button
                    onClick={close}
                    className="w-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-[10px] font-black uppercase tracking-widest transition-colors py-1"
                >
                    AGORA NÃO
                </button>
            </div>
        </div>
    );
}
