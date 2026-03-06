import React, { useState, useEffect } from 'react';
import { RefreshCw, X, AlertCircle } from 'lucide-react';

interface UpdateModalProps {
    isAdmin: boolean;
    currentVersion: string;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({ isAdmin, currentVersion }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Only show for admins
        if (!isAdmin) return;

        const updateKey = `update_accepted_v_${currentVersion}`;
        const hasAccepted = localStorage.getItem(updateKey);

        if (!hasAccepted) {
            // Add a small delay for better UX
            const timer = setTimeout(() => {
                setIsVisible(true);
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [isAdmin, currentVersion]);

    const handleUpdate = () => {
        const updateKey = `update_accepted_v_${currentVersion}`;
        localStorage.setItem(updateKey, 'true');
        setIsVisible(false);

        // Force reload from server to get new assets
        window.location.reload();
    };

    const handleDismiss = () => {
        setIsVisible(false);
        // Optionally, don't set localStorage here if you want it to appear again next load,
        // or set a temporary snooze. For now, we'll force them to use the New Update button 
        // eventually, so dismissing just hides it for the current session.
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-[2rem] shadow-2xl border border-blue-100 dark:border-white/10 overflow-hidden transform animate-in slide-in-from-bottom-8 duration-500 relative">

                {/* Close Button */}
                <button
                    onClick={handleDismiss}
                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700 hover:text-slate-700 dark:hover:text-zinc-200 transition-colors z-10"
                >
                    <X size={16} />
                </button>

                {/* Header Banner */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-white/10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)' }}></div>
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg mb-4 relative z-10 animate-bounce shadow-blue-900/40">
                        <AlertCircle className="text-blue-600" size={32} />
                    </div>
                    <h2 className="text-2xl font-black text-white relative z-10 tracking-tight">Nova Atualização!</h2>
                    <p className="text-blue-100 font-medium mt-1 relative z-10">Versão {currentVersion} Disponível</p>
                </div>

                {/* Content */}
                <div className="p-8 text-center space-y-6">
                    <p className="text-slate-600 dark:text-zinc-300 font-medium text-sm leading-relaxed">
                        O sistema <strong>já</strong> aplicou novas melhorias de interface, identidade visual oficial e otimizações de navegação.
                    </p>

                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl text-xs text-blue-700 dark:text-blue-300 font-semibold border border-blue-100 dark:border-blue-800/50">
                        Por favor, atualize sua janela para garantir o carregamento das novas funcionalidades.
                    </div>

                    {/* Action */}
                    <button
                        onClick={handleUpdate}
                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all hover:-translate-y-0.5"
                    >
                        <RefreshCw size={20} className="animate-spin-slow" style={{ animationDuration: '3s' }} />
                        Atualizar Agora
                    </button>

                    <p className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase tracking-widest font-black">
                        Módulo Exclusivo para Administrador
                    </p>
                </div>

            </div>
        </div>
    );
};
