import React from 'react';
import {
    ShieldCheck,
    FileSpreadsheet,
    Database,
    LayoutDashboard,
    School,
    Users,
    History,
    FileText,
    Package,
    ClipboardList,
    ArrowLeftRight,
    Settings,
    Search
} from 'lucide-react';
import { useT } from '../lib/LanguageContext';

export const Sobre: React.FC = () => {
    const { t } = useT();

    const recursos = [
        {
            icon: <LayoutDashboard className="text-blue-500" size={24} />,
            title: t.sobre.recurso1T,
            description: t.sobre.recurso1D
        },
        {
            icon: <School className="text-emerald-500" size={24} />,
            title: t.sobre.recurso2T,
            description: t.sobre.recurso2D
        },
        {
            icon: <Users className="text-violet-500" size={24} />,
            title: t.sobre.recurso3T,
            description: t.sobre.recurso3D
        },
        {
            icon: <FileSpreadsheet className="text-orange-500" size={24} />,
            title: t.sobre.recurso4T,
            description: t.sobre.recurso4D
        },
        {
            icon: <Database className="text-cyan-500" size={24} />,
            title: t.sobre.recurso5T,
            description: t.sobre.recurso5D
        },
        {
            icon: <ShieldCheck className="text-rose-500" size={24} />,
            title: t.sobre.recurso6T,
            description: t.sobre.recurso6D
        }
    ];

    const modulos = [
        {
            icon: <FileText className="text-blue-500" />,
            title: t.sobre.modulo1T,
            description: t.sobre.modulo1D,
            color: 'blue'
        },
        {
            icon: <Search className="text-amber-500" />,
            title: t.sobre.modulo2T,
            description: t.sobre.modulo2D,
            color: 'amber'
        },
        {
            icon: <Package className="text-emerald-500" />,
            title: t.sobre.modulo3T,
            description: t.sobre.modulo3D,
            color: 'emerald'
        },
        {
            icon: <ClipboardList className="text-violet-500" />,
            title: t.sobre.modulo4T,
            description: t.sobre.modulo4D,
            color: 'violet'
        },
        {
            icon: <ArrowLeftRight className="text-orange-500" />,
            title: t.sobre.modulo5T,
            description: t.sobre.modulo5D,
            color: 'orange'
        },
        {
            icon: <Settings className="text-slate-500" />,
            title: t.sobre.modulo6T,
            description: t.sobre.modulo6D,
            color: 'slate'
        }
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-16 pb-20 animate-in fade-in duration-700">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#005A9C] via-[#004a80] to-[#003d6b] p-10 md:p-20 text-white text-center space-y-8 shadow-2xl border border-white/10">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-[100px] -mr-48 -mt-48 transition-all duration-1000"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-400/5 rounded-full blur-[100px] -ml-48 -mb-48 transition-all duration-1000"></div>

                <div className="relative inline-flex p-5 bg-white rounded-[2rem] mb-4 shadow-2xl border border-white/20 w-28 h-28 items-center justify-center animate-in zoom-in duration-1000">
                    <img
                        src="https://upload.wikimedia.org/wikipedia/commons/6/63/Bras%C3%A3o_de_Armas_de_Itagua%C3%AD.jpg"
                        alt="Brasão de Itaguaí"
                        className="w-full h-full object-contain scale-110"
                    />
                </div>

                <div className="space-y-4 max-w-4xl mx-auto">
                    <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
                        {t.sobre.tituloHero}
                    </h1>
                    <p className="text-blue-100/80 text-lg md:text-2xl font-medium leading-relaxed">
                        {t.sobre.subtituloHero}
                    </p>
                </div>
            </div>

            {/* Módulos Section - NEW */}
            <div className="space-y-10">
                <div className="text-center space-y-3">
                    <h2 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white flex items-center justify-center gap-3">
                        <Package className="text-[#005A9C]" size={32} />
                        {t.sobre.modulosT}
                    </h2>
                    <div className="w-24 h-1.5 bg-gradient-to-r from-[#005A9C] to-blue-400 mx-auto rounded-full"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {modulos.map((mod, idx) => (
                        <div key={idx} className="group relative bg-white dark:bg-zinc-900 border border-gray-100 dark:border-white/5 p-8 rounded-[2rem] hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 hover:-translate-y-2">
                            <div className={`w-14 h-14 rounded-2xl bg-${mod.color}-500/10 dark:bg-${mod.color}-500/5 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-sm`}>
                                {React.cloneElement(mod.icon as React.ReactElement, { size: 28, strokeWidth: 2.5 } as any)}
                            </div>
                            <h3 className="text-xl font-black text-slate-800 dark:text-white mb-3 tracking-tight">
                                {mod.title}
                            </h3>
                            <p className="text-slate-500 dark:text-zinc-400 text-sm leading-relaxed font-medium">
                                {mod.description}
                            </p>
                            <div className={`absolute bottom-6 right-8 w-1 h-8 rounded-full bg-${mod.color}-500/20 group-hover:h-12 transition-all duration-500`}></div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Features Grid - Refined */}
            <div className="space-y-10 pt-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {recursos.map((item, index) => (
                        <div
                            key={index}
                            className="group bg-slate-50/50 dark:bg-zinc-900/40 backdrop-blur-sm p-8 rounded-[2rem] border border-gray-100 dark:border-white/5 hover:bg-white dark:hover:bg-zinc-900 transition-all duration-300 hover:shadow-xl"
                        >
                            <div className="mb-5 p-3 bg-white dark:bg-black/20 rounded-xl inline-block shadow-sm group-hover:scale-110 transition-transform duration-300 border border-gray-100 dark:border-white/5">
                                {item.icon}
                            </div>
                            <h4 className="text-lg font-black text-slate-800 dark:text-gray-100 mb-2">{item.title}</h4>
                            <p className="text-gray-500 dark:text-gray-400 leading-relaxed text-sm font-medium">
                                {item.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer Statistics Bar */}
            <div className="bg-[#005A9C] dark:bg-blue-600 rounded-[2.5rem] p-1 shadow-2xl overflow-hidden">
                <div className="bg-white/5 dark:bg-black/5 backdrop-blur-md px-10 py-12 flex flex-col lg:flex-row items-center gap-12 justify-between">
                    <div className="space-y-3 text-center lg:text-left">
                        <div className="flex items-center justify-center lg:justify-start gap-3">
                            <div className="p-2 bg-white/10 rounded-lg">
                                <History size={24} className="text-white" />
                            </div>
                            <h4 className="text-2xl font-black text-white uppercase tracking-tight">
                                {t.sobre.versao}: 2.0.4
                            </h4>
                        </div>
                        <p className="text-blue-100/60 text-sm font-bold uppercase tracking-widest pl-1">
                            {t.sobre.ultimaAtu}
                        </p>
                    </div>

                    <div className="grid grid-cols-3 gap-10 lg:gap-16">
                        <div className="text-center group">
                            <p className="text-4xl md:text-5xl font-black text-white group-hover:scale-110 transition-transform cursor-default">65</p>
                            <p className="text-[10px] md:text-xs uppercase font-black text-blue-100/40 tracking-[0.2em] mt-2">{t.sobre.unidades}</p>
                        </div>
                        <div className="w-px h-16 bg-white/10 self-center hidden sm:block"></div>
                        <div className="text-center group">
                            <p className="text-4xl md:text-5xl font-black text-white group-hover:scale-110 transition-transform cursor-default">100%</p>
                            <p className="text-[10px] md:text-xs uppercase font-black text-blue-100/40 tracking-[0.2em] mt-2">{t.sobre.cloud}</p>
                        </div>
                        <div className="w-px h-16 bg-white/10 self-center hidden sm:block"></div>
                        <div className="text-center group">
                            <p className="text-4xl md:text-5xl font-black text-white group-hover:scale-110 transition-transform cursor-default">PDF</p>
                            <p className="text-[10px] md:text-xs uppercase font-black text-blue-100/40 tracking-[0.2em] mt-2">{t.sobre.reports}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
