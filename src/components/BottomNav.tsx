import React from 'react';
import { Package, ClipboardList, ArrowLeftRight } from 'lucide-react';
import { useT } from '../lib/LanguageContext';

interface Props {
    activeView: string;
    setActiveView: (view: string) => void;
}

export const BottomNav: React.FC<Props> = ({ activeView, setActiveView }) => {
    const { t } = useT();

    const navItems = [
        { id: 'recebimentos', label: 'Recebimentos', icon: Package },
        { id: 'lancamentos', label: 'Inventário', icon: ClipboardList },
        { id: 'transferencias', label: 'Transferências', icon: ArrowLeftRight },
    ];

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white dark:bg-[#1e1e1e] border-t border-gray-200 dark:border-zinc-800 pb-safe">
            <div className="flex justify-around items-center h-16 px-2">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeView === item.id;

                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveView(item.id)}
                            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${isActive
                                ? 'text-[#005A9C] dark:text-[#66b3ff]'
                                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                                }`}
                        >
                            <div className={`p-1 rounded-full transition-all duration-300 ${isActive ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                            </div>
                            <span className={`text-[10px] font-medium ${isActive ? 'font-bold' : ''}`}>
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
