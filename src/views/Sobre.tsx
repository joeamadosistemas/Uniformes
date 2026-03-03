import React from 'react';
import {
    ShieldCheck,
    FileSpreadsheet,
    Database,
    LayoutDashboard,
    School,
    Users,
    History
} from 'lucide-react';

export const Sobre: React.FC = () => {
    const recursos = [
        {
            icon: <LayoutDashboard className="text-blue-500" size={24} />,
            title: "Painel de Controle Inteligente",
            description: "Visualização consolidada de métricas essenciais, permitindo que gestores identifiquem instantaneamente excedentes ou carências de uniformes em toda a rede municipal."
        },
        {
            icon: <School className="text-emerald-500" size={24} />,
            title: "Gestão Unificada de Unidades",
            description: "Controle detalhado das 69 unidades escolares, com filtragem avançada por segmentos de ensino (Creche ao EJA) e monitoramento de status ativo/inativo."
        },
        {
            icon: <Users className="text-violet-500" size={24} />,
            title: "Segurança de Nível Administrativo",
            description: "Sistema robusto de autenticação integrado ao Supabase Auth, com hierarquia de permissões (Admin/Usuário) e gestão centralizada de credenciais e perfis."
        },
        {
            icon: <FileSpreadsheet className="text-orange-500" size={24} />,
            title: "Relatórios Institucionais de Elite",
            description: "Motor de exportação para PDF e Excel com identidade visual oficial de Itaguaí, incluindo o Brasão de Armas e cabeçalhos governamentais padronizados."
        },
        {
            icon: <Database className="text-cyan-500" size={24} />,
            title: "Arquitetura Cloud Escalável",
            description: "Infraestrutura moderna utilizando Supabase para persistência de dados em tempo real, garantindo integridade, backups automáticos e alta disponibilidade."
        },
        {
            icon: <ShieldCheck className="text-rose-500" size={24} />,
            title: "Conformidade e Acessibilidade",
            description: "Interface projetada sob as premissas do Design System governamental, oferecendo modo noturno, contraste otimizado e navegação responsiva."
        }
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-12 pb-12 animate-in fade-in duration-700">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#005A9C] to-[#003d6b] p-8 md:p-16 text-white text-center space-y-6 shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl -ml-32 -mb-32"></div>

                <div className="relative inline-flex p-3 bg-white/10 backdrop-blur-md rounded-2xl mb-4 border border-white/20">
                    <School size={32} className="text-blue-100" />
                </div>

                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
                    Sistema de Gestão de Uniformes Escolares
                </h1>
                <p className="text-blue-100 text-lg md:text-xl max-w-3xl mx-auto font-light leading-relaxed">
                    Uma plataforma de alta performance desenvolvida para a Secretaria Municipal de Educação de Itaguaí,
                    unindo inovação tecnológica à eficiência na gestão de recursos educacionais.
                </p>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {recursos.map((item, index) => (
                    <div
                        key={index}
                        className="group bg-white dark:bg-[#1e1e1e] p-8 rounded-2xl border border-gray-100 dark:border-[#333] hover:border-blue-200 dark:hover:border-blue-900 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                    >
                        <div className="mb-5 p-3 bg-gray-50 dark:bg-black/20 rounded-xl inline-block group-hover:scale-110 transition-transform duration-300">
                            {item.icon}
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-3">{item.title}</h3>
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm">
                            {item.description}
                        </p>
                    </div>
                ))}
            </div>

            {/* Footer Info */}
            <div className="bg-slate-50 dark:bg-[#1a1a1a] rounded-2xl p-8 border border-slate-200 dark:border-[#333] flex flex-col md:flex-row items-center gap-8 justify-between">
                <div className="space-y-2">
                    <h4 className="text-lg font-bold text-[#005A9C] dark:text-[#66b3ff] flex items-center gap-2">
                        <History size={20} />
                        Versão do Sistema: 2.0.4
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Última atualização: Março de 2026 • Desenvolvido com foco em excelência operacional.
                    </p>
                </div>
                <div className="flex items-center gap-6">
                    <div className="text-center">
                        <p className="text-2xl font-black text-gray-800 dark:text-gray-100">69</p>
                        <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Unidades</p>
                    </div>
                    <div className="w-px h-8 bg-gray-200 dark:bg-[#333]"></div>
                    <div className="text-center">
                        <p className="text-2xl font-black text-gray-800 dark:text-gray-100">100%</p>
                        <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Cloud</p>
                    </div>
                    <div className="w-px h-8 bg-gray-200 dark:bg-[#333]"></div>
                    <div className="text-center">
                        <p className="text-2xl font-black text-[#005A9C] dark:text-[#66b3ff]">PDF</p>
                        <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Reports</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
