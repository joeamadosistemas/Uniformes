import React from 'react';
import { Package, ClipboardList, ArrowLeftRight } from 'lucide-react';

interface Props {
    activeView: string;
    setActiveView: (view: string) => void;
}

export const BottomNav: React.FC<Props> = ({ activeView, setActiveView }) => {
    const navItems = [
        { id: 'recebimentos', label: 'Recebimentos', icon: Package },
        { id: 'lancamentos', label: 'Inventário', icon: ClipboardList },
        { id: 'transferencias', label: 'Transferências', icon: ArrowLeftRight },
    ];

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-[#5193EB] dark:bg-[#1452b5] shadow-[0_-4px_20px_rgba(0,0,0,0.15)] rounded-t-3xl border-t border-white/20">
            <div className="flex justify-around items-center h-[76px] px-2 pb-2">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeView === item.id;

                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveView(item.id)}
                            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-300 ${isActive
                                ? 'text-white'
                                : 'text-white/60 hover:text-white/80'
                                }`}
                        >
                            <Icon size={28} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'drop-shadow-sm' : ''} />
                            <span className={`text-[11px] tracking-wide text-center leading-tight ${isActive ? 'font-black drop-shadow-sm' : 'font-medium'}`}>
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
