import React, { useState, useEffect } from 'react';
import { X, Share, Download } from 'lucide-react';

export const InstallPrompt: React.FC = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Detect se já está instalado (Standalone)
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
        if (isStandalone) {
            return; // Já está instalado, não exibe banner
        }

        // Detectar iOS
        const ua = window.navigator.userAgent;
        const isIOSDevice = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
        setIsIOS(isIOSDevice);

        if (isIOSDevice) {
            // Exibe banner do iOS após 2 segundos
            setTimeout(() => setShowPrompt(true), 2000);
            return;
        }

        // Listener para o Android (Chrome/Edge)
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault(); // Impede o chrome de mostrar a barra feia padrão na parte de baixo
            setDeferredPrompt(e); // Guarda o evento para disparar ao clicar no botão
            setShowPrompt(true); // Exibe o nosso banner customizado bonitão
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setShowPrompt(false);
            }
            setDeferredPrompt(null);
        }
    };

    const handleDismiss = () => {
        setShowPrompt(false);
    };

    if (!showPrompt) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 animate-in slide-in-from-bottom-5 duration-500">
            <div className="mx-auto max-w-sm w-full bg-white/90 dark:bg-zinc-900/95 backdrop-blur-xl border border-gray-200 dark:border-zinc-800 shadow-2xl rounded-2xl p-4 flex gap-4 items-center relative">
                <button
                    onClick={handleDismiss}
                    className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                >
                    <X size={16} />
                </button>

                <div className="w-12 h-12 flex-shrink-0 bg-gray-100 rounded-xl overflow-hidden shadow-inner border border-gray-200 dark:border-zinc-800">
                    <img src="/unifsmedu-icon.png" alt="UnifSMEDU Logo" className="w-full h-full object-cover" />
                </div>

                <div className="flex-1">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">UnifSMEDU</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
                        {isIOS ? 'Instale o app na nova Tela de Início' : 'Instalar o aplicativo no dispositivo'}
                    </p>

                    {isIOS ? (
                        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[#005A9C] dark:text-[#66b3ff] bg-blue-50 dark:bg-zinc-800/50 p-2 rounded-lg border border-blue-100 dark:border-zinc-700/50">
                            Toque em <Share size={12} className="inline-block" /> Compartilhar &gt; <b>Adicionar à Tela de Início</b>
                        </div>
                    ) : (
                        <button
                            onClick={handleInstallClick}
                            className="mt-2 w-full py-1.5 px-3 bg-[#005A9C] dark:bg-[#1452b5] text-white text-xs font-bold rounded-lg shadow-sm active:scale-95 transition-all text-center flex justify-center items-center gap-2"
                        >
                            <Download size={14} /> Instalar
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
