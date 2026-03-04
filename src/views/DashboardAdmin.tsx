import React, { useState, useEffect } from 'react';
import {
    Building2,
    AlertCircle,
    CheckCircle2,
    Package,
    TrendingDown,
    TrendingUp,
    FileText,
    Download,
    Search
} from 'lucide-react';
import { EscolaCadastro, RegistroUniforme } from '../types';
import { exportarRelatorioEscolas, exportarResumoEstoque } from '../utils/exportUtils';
import { useT } from '../lib/LanguageContext';

export const DashboardAdmin: React.FC = () => {
    const { t } = useT();
    const [activeTab, setActiveTab] = useState<'informaram' | 'faltam' | 'qtd-faltando' | 'qtd-sobrando'>('informaram');
    const [escolas, setEscolas] = useState<EscolaCadastro[]>([]);
    const [registros, setRegistros] = useState<RegistroUniforme[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedYear, setSelectedYear] = useState<number>(2026);

    useEffect(() => {
        const escolasSalvas = localStorage.getItem('@Uniformes:escolas');
        const registrosSalvos = localStorage.getItem('@Uniformes:registros');

        if (escolasSalvas) setEscolas(JSON.parse(escolasSalvas));
        if (registrosSalvos) setRegistros(JSON.parse(registrosSalvos));
    }, []);

    // Cálculos
    const registrosNoAno = registros.filter(r => r.data_registro.startsWith(selectedYear.toString()));

    const escolasQueInformaram = escolas.filter(escola =>
        registrosNoAno.some(r => r.escola === escola.nome)
    );

    const escolasQueFaltam = escolas.filter(escola =>
        !registrosNoAno.some(r => r.escola === escola.nome)
    );

    const resumoPorEscola = escolasQueInformaram.map(escola => {
        const registrosEscola = registrosNoAno.filter(r => r.escola === escola.nome);
        const totalFaltando = registrosEscola.reduce((acc, curr) => acc + (curr.qtd_faltando || 0), 0);
        const totalSobrando = registrosEscola.reduce((acc, curr) => acc + (curr.qtd_sobrando || 0), 0);
        return {
            escola: escola.nome,
            totalFaltando,
            totalSobrando,
            email: escola.email
        };
    });

    const totalGeralFaltando = resumoPorEscola.reduce((acc, curr) => acc + curr.totalFaltando, 0);
    const totalGeralSobrando = resumoPorEscola.reduce((acc, curr) => acc + curr.totalSobrando, 0);

    const handleExportPDF = () => {
        if (activeTab === 'informaram') {
            exportarRelatorioEscolas(escolasQueInformaram.map(e => ({ nome: e.nome, email: e.email, status: t.dashboard.jaInformaram })), t.dashboard.unidadesInformaram);
        } else if (activeTab === 'faltam') {
            exportarRelatorioEscolas(escolasQueFaltam.map(e => ({ nome: e.nome, email: e.email, status: t.dashboard.unidadesPendentes })), t.dashboard.unidadesPendentes);
        } else if (activeTab === 'qtd-faltando') {
            exportarResumoEstoque(resumoPorEscola, t.dashboard.qtdTotalFaltando);
        } else if (activeTab === 'qtd-sobrando') {
            exportarResumoEstoque(resumoPorEscola, t.dashboard.qtdTotalSobrando);
        }
    };

    return (
        <div className="space-y-8 pb-20">
            {/* Top Bar with Year and Export Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 px-4 py-2 rounded-2xl shadow-sm">
                    <span className="text-xs font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest">Ano:</span>
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="bg-transparent border-none text-sm font-black text-[#005A9C] dark:text-[#66b3ff] focus:ring-0 cursor-pointer"
                    >
                        <option value={2026}>2026</option>
                        <option value={2025}>2025</option>
                        <option value={2024}>2024</option>
                    </select>
                </div>

                <div className="flex items-center space-x-3">
                    <button
                        onClick={handleExportPDF}
                        className="flex items-center px-4 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm font-bold text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-all shadow-sm"
                    >
                        <FileText size={18} className="mr-2 text-red-500" />
                        PDF
                    </button>
                    <button className="flex items-center px-4 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm font-bold text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-all shadow-sm">
                        <Download size={18} className="mr-2 text-green-500" />
                        Excel
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-6">
                <div className="bg-[#005A9C] dark:bg-[#1452b5] p-4 md:p-6 rounded-3xl border border-transparent shadow-lg shadow-blue-500/20 space-y-3 relative overflow-hidden">
                    <div className="p-2 md:p-3 bg-white/20 text-white rounded-xl w-fit backdrop-blur-sm shadow-inner shrink-0 relative z-10">
                        <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-[10px] md:text-xs font-bold text-white/80 uppercase tracking-wider">{t.dashboard.unidadesInformaram}</p>
                        <h4 className="text-2xl md:text-3xl font-black text-white">{escolasQueInformaram.length}</h4>
                    </div>
                    <div className="text-[9px] md:text-[10px] text-blue-900 font-bold bg-white/80 px-2 flex items-center h-5 md:h-6 rounded w-fit relative z-10">
                        {((escolasQueInformaram.length / (escolas.length || 1)) * 100).toFixed(0)}% {t.dashboard.jaInformaram.toLowerCase()}
                    </div>
                </div>

                <div className="bg-[#eef2ff] dark:bg-zinc-800/80 p-4 md:p-6 rounded-3xl border border-blue-100 dark:border-zinc-700 shadow-sm space-y-3 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-red-400/10 rounded-bl-full -z-10"></div>
                    <div className="p-2 md:p-3 bg-white dark:bg-zinc-700 text-red-500 rounded-xl w-fit shadow-sm shrink-0 relative z-10">
                        <AlertCircle className="w-5 h-5 md:w-6 md:h-6" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-[10px] md:text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">{t.dashboard.unidadesPendentes}</p>
                        <h4 className="text-2xl md:text-3xl font-black text-gray-800 dark:text-white">{escolasQueFaltam.length}</h4>
                    </div>
                    <div className="text-[9px] md:text-[10px] text-red-600 font-bold bg-red-50 px-2 flex items-center h-5 md:h-6 rounded w-fit relative z-10">
                        {((escolasQueFaltam.length / (escolas.length || 1)) * 100).toFixed(0)}% {t.dashboard.unidadesPendentes.toLowerCase()}
                    </div>
                </div>

                <div className="bg-[#eef2ff] dark:bg-zinc-800/80 p-4 md:p-6 rounded-3xl border border-blue-100 dark:border-zinc-700 shadow-sm space-y-3 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-orange-400/10 rounded-bl-full -z-10"></div>
                    <div className="p-2 md:p-3 bg-white dark:bg-zinc-700 text-orange-500 rounded-xl w-fit shadow-sm shrink-0 relative z-10">
                        <TrendingDown className="w-5 h-5 md:w-6 md:h-6" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-[10px] md:text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">{t.dashboard.qtdTotalFaltando}</p>
                        <h4 className="text-2xl md:text-3xl font-black text-gray-800 dark:text-white">{totalGeralFaltando}</h4>
                    </div>
                    <p className="text-[9px] md:text-[10px] text-gray-400 font-medium relative z-10">{t.dashboard.subtitulo}</p>
                </div>

                <div className="bg-[#eef2ff] dark:bg-zinc-800/80 p-4 md:p-6 rounded-3xl border border-blue-100 dark:border-zinc-700 shadow-sm space-y-3 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-400/10 rounded-bl-full -z-10"></div>
                    <div className="p-2 md:p-3 bg-white dark:bg-zinc-700 text-emerald-500 rounded-xl w-fit shadow-sm shrink-0 relative z-10">
                        <TrendingUp className="w-5 h-5 md:w-6 md:h-6" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-[10px] md:text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">{t.dashboard.qtdTotalSobrando}</p>
                        <h4 className="text-2xl md:text-3xl font-black text-gray-800 dark:text-white">{totalGeralSobrando}</h4>
                    </div>
                    <p className="text-[9px] md:text-[10px] text-gray-400 font-medium relative z-10">{t.dashboard.subtitulo}</p>
                </div>
            </div>

            {/* Tabs Layout */}
            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden">
                <div className="border-b border-gray-50 px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex space-x-1 bg-gray-100/50 p-1 rounded-xl">
                        <button
                            onClick={() => setActiveTab('informaram')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'informaram' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {t.dashboard.jaInformaram}
                        </button>
                        <button
                            onClick={() => setActiveTab('faltam')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'faltam' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {t.dashboard.faltamInformar}
                        </button>
                        <button
                            onClick={() => setActiveTab('qtd-faltando')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'qtd-faltando' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {t.dashboard.qtdTotalFaltando}
                        </button>
                        <button
                            onClick={() => setActiveTab('qtd-sobrando')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'qtd-sobrando' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {t.dashboard.qtdTotalSobrando}
                        </button>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder={t.escolas.buscarEscola}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-64 transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.escolas.nomeEscola}</th>
                                {(activeTab === 'informaram' || activeTab === 'faltam') && (
                                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.dashboard.contatoEmail}</th>
                                )}
                                {activeTab === 'qtd-faltando' && (
                                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.dashboard.qtdTotalFaltando}</th>
                                )}
                                {activeTab === 'qtd-sobrando' && (
                                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.dashboard.qtdTotalSobrando}</th>
                                )}
                                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">{t.common.status}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-sm">
                            {activeTab === 'informaram' && escolasQueInformaram
                                .filter(e => e.nome.toLowerCase().includes(searchTerm.toLowerCase()))
                                .map(e => (
                                    <tr key={e.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                                    <Building2 size={16} />
                                                </div>
                                                <span className="font-bold text-gray-700">{e.nome}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-4 text-gray-500">{e.email}</td>
                                        <td className="px-8 py-4 text-right">
                                            <span className="px-2 py-1 bg-green-50 text-green-600 text-[9px] font-bold rounded uppercase tracking-wider">{t.dashboard.jaInformaram}</span>
                                        </td>
                                    </tr>
                                ))}

                            {activeTab === 'faltam' && escolasQueFaltam
                                .filter(e => e.nome.toLowerCase().includes(searchTerm.toLowerCase()))
                                .map(e => (
                                    <tr key={e.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-4 text-gray-700 font-bold">{e.nome}</td>
                                        <td className="px-8 py-4 text-gray-500">{e.email}</td>
                                        <td className="px-8 py-4 text-right">
                                            <span className="px-2 py-1 bg-red-50 text-red-600 text-[9px] font-bold rounded uppercase tracking-wider">{t.dashboard.unidadesPendentes}</span>
                                        </td>
                                    </tr>
                                ))}

                            {(activeTab === 'qtd-faltando' || activeTab === 'qtd-sobrando') && resumoPorEscola
                                .filter(d => d.escola.toLowerCase().includes(searchTerm.toLowerCase()))
                                .map(d => (
                                    <tr key={d.escola} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-4">
                                            <p className="font-bold text-gray-700">{d.escola}</p>
                                            <p className="text-[10px] text-gray-400">{d.email}</p>
                                        </td>
                                        <td className="px-8 py-4">
                                            <div className="flex items-center space-x-4">
                                                {activeTab === 'qtd-faltando' ? (
                                                    <div className="flex items-center">
                                                        <span className={`text-lg font-black ${d.totalFaltando > 0 ? 'text-red-600' : 'text-gray-300'}`}>
                                                            {d.totalFaltando}
                                                        </span>
                                                        <span className="ml-1 text-[10px] text-gray-400 font-bold">unid.</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center">
                                                        <span className={`text-lg font-black ${d.totalSobrando > 0 ? 'text-emerald-600' : 'text-gray-300'}`}>
                                                            {d.totalSobrando}
                                                        </span>
                                                        <span className="ml-1 text-[10px] text-gray-400 font-bold">unid.</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-4 text-right">
                                            <span className="px-2 py-1 bg-blue-50 text-blue-600 text-[9px] font-bold rounded uppercase tracking-wider">{t.dashboard.verDetalhes}</span>
                                        </td>
                                    </tr>
                                ))}

                            {((activeTab === 'informaram' && escolasQueInformaram.length === 0) ||
                                (activeTab === 'faltam' && escolasQueFaltam.length === 0)) && (
                                    <tr>
                                        <td colSpan={3} className="px-8 py-20 text-center text-gray-400 font-medium">
                                            <Package size={48} className="mx-auto mb-4 opacity-20" />
                                            {t.transferencias.semTransferencias}
                                        </td>
                                    </tr>
                                )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
