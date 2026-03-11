import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCcw } from 'lucide-react';

export function ReloadPrompt() {
    const {
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r) {
            console.log('SW Registered: ' + r);
        },
        onRegisterError(error) {
            console.log('SW registration error', error);
        },
    });

    const close = () => {
        setNeedRefresh(false);
    };

    if (!needRefresh) return null;

    return (
        <div className="fixed bottom-4 right-4 z-[9999] flex items-center justify-between gap-4 rounded-2xl bg-white p-5 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] border border-gray-100 dark:bg-zinc-800 dark:border-white/10 dark:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)] max-w-sm animate-in slide-in-from-bottom-5">
            <div className="flex flex-col gap-1">
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <RefreshCcw size={16} className="text-[#005A9C] dark:text-[#66b3ff]" />
                    Atualização Disponível!
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    Uma nova versão do sistema foi encontrada. Atualize para carregar as melhorias recentes.
                </p>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
                <button
                    onClick={() => updateServiceWorker(true)}
                    className="bg-[#005A9C] hover:bg-blue-700 dark:bg-[#005A9C] dark:hover:bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors shadow-lg shadow-blue-500/20 active:scale-95"
                >
                    Atualizar
                </button>
                <button
                    onClick={close}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-[10px] font-bold uppercase tracking-wider transition-colors"
                >
                    AGORA NÃO
                </button>
            </div>
        </div>
    );
}
