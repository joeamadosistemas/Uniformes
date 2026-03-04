import React, { useState, useEffect } from 'react';
import { School, CheckCircle2, Clock, Search, Filter, BarChart3, ArrowUpRight, AlertCircle, Loader2, FileText, RefreshCw } from 'lucide-react';
import { supabase, supabaseAdmin } from '../lib/supabaseClient';
import { useT } from '../lib/LanguageContext';
import { EscolaCadastro } from '../types';
import { SEGMENTOS_ENSINO } from '../constants';
import { exportarControleRecebimentoPDF } from '../utils/exportUtils';

interface EscolaStatus extends EscolaCadastro {
    jaLancou: boolean;
    dataUltimoLancamento?: string;
}

export const ControleRecebimento: React.FC = () => {
    const { t } = useT();
    const [escolas, setEscolas] = useState<EscolaStatus[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'todos' | 'concluido' | 'pendente'>('todos');
    const [filterSegmento, setFilterSegmento] = useState<string>('todos');
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchStatusEscolas();
    }, []);

    const fetchStatusEscolas = async () => {
        try {
            setLoading(true);
            setRefreshing(true);

            // 1. Buscar todas as escolas
            const { data: todasEscolas, error: errorEscolas } = await supabase
                .from('escolas')
                .select('*')
                .eq('ativo', true)
                .order('nome', { ascending: true });

            if (errorEscolas) throw errorEscolas;

            // 2. Buscar e-mails únicos de escolas que já lançaram recebimentos
            // Usamos supabaseAdmin se disponível para garantir que o administrador veja todos os registros (bypass RLS)
            const client = supabaseAdmin || supabase;
            const { data: lancamentos, error: errorLancamentos } = await client
                .from('recebimentos')
                .select('escola, data_recebimento')
                .order('data_recebimento', { ascending: false })
                .limit(10000);

            if (errorLancamentos) {
                console.warn('Tabela recebimentos ainda não disponível para controle total.');
            }

            const escolasComLancamento = new Map<string, string>(); // email -> data
            if (lancamentos) {
                lancamentos.forEach(l => {
                    const emailKey = (l.escola || '').toLowerCase().trim();
                    const dataAtual = l.data_recebimento;
                    const dataExistente = escolasComLancamento.get(emailKey);
                    if (!dataExistente || new Date(dataAtual) > new Date(dataExistente)) {
                        escolasComLancamento.set(emailKey, dataAtual);
                    }
                });
            }

            const mappedEscolas: EscolaStatus[] = todasEscolas.map(esc => {
                const emailKey = (esc.email || '').toLowerCase().trim();
                return {
                    ...esc,
                    jaLancou: escolasComLancamento.has(emailKey),
                    dataUltimoLancamento: escolasComLancamento.get(emailKey)
                };
            });

            setEscolas(mappedEscolas);

        } catch (error) {
            console.error('Erro ao buscar status das escolas:', error);
        } finally {
            setLoading(false);
        }
    };

    const escolasFiltradas = escolas.filter(esc => {
        const matchesSearch = esc.nome.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'todos' ||
            (filterStatus === 'concluido' && esc.jaLancou) ||
            (filterStatus === 'pendente' && !esc.jaLancou);

        let matchesSegmento = true;
        if (filterSegmento !== 'todos') {
            matchesSegmento = Array.isArray(esc.segmentos) && esc.segmentos.includes(filterSegmento);
        }

        return matchesSearch && matchesStatus && matchesSegmento;
    });

    const handleExportPDF = () => {
        exportarControleRecebimentoPDF(escolasFiltradas);
    };

    const totalEscolas = escolas.length;
    const totalLancaram = escolas.filter(e => e.jaLancou).length;
    const totalPendentes = totalEscolas - totalLancaram;
    const percentualConcluido = totalEscolas > 0 ? (totalLancaram / totalEscolas) * 100 : 0;

    return (
        <div className="space-y-8 pb-20">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl text-blue-600 dark:text-blue-400">
                            <School size={24} />
                        </div>
                        <BarChart3 className="text-gray-300 dark:text-zinc-700" size={20} />
                    </div>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">{t.dashboardControle.totalUnidades}</p>
                    <h3 className="text-3xl font-black text-gray-800 dark:text-white">{totalEscolas}</h3>
                </div>

                <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-2xl text-green-600 dark:text-green-400">
                            <CheckCircle2 size={24} />
                        </div>
                        <ArrowUpRight className="text-gray-300 dark:text-zinc-700" size={20} />
                    </div>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">{t.dashboardControle.informaram}</p>
                    <h3 className="text-3xl font-black text-green-600 dark:text-green-400">{totalLancaram}</h3>
                </div>

                <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-2xl text-amber-600 dark:text-amber-400">
                            <Clock size={24} />
                        </div>
                        <AlertCircle className="text-gray-300 dark:text-zinc-700" size={20} />
                    </div>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">{t.dashboardControle.aguardando}</p>
                    <h3 className="text-3xl font-black text-amber-600 dark:text-amber-400">{totalPendentes}</h3>
                </div>

                <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl text-indigo-600 dark:text-indigo-400">
                            <BarChart3 size={24} />
                        </div>
                        <div className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">{percentualConcluido.toFixed(1)}%</div>
                    </div>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">{t.dashboardControle.taxaAdesao}</p>
                    <div className="w-full bg-gray-100 dark:bg-zinc-800 h-2 rounded-full mt-4 overflow-hidden">
                        <div
                            className="bg-indigo-600 h-full transition-all duration-1000"
                            style={{ width: `${percentualConcluido}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* List Control */}
            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-gray-50 dark:border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder={t.dashboardControle.buscarEscola}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-medium dark:text-white"
                        />
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Filter size={18} className="text-gray-400" />
                            <select
                                value={filterSegmento}
                                onChange={(e) => setFilterSegmento(e.target.value)}
                                className="bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 dark:text-zinc-300 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                            >
                                <option value="todos">TODOS OS SEGMENTOS</option>
                                {SEGMENTOS_ENSINO.map(seg => (
                                    <option key={seg} value={seg}>
                                        {seg.replace('CONJUNTO UNIFORMA ESCOLAR ', '')}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-zinc-800 p-1 rounded-xl border border-slate-200 dark:border-zinc-700">
                            <button
                                onClick={() => setFilterStatus('todos')}
                                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === 'todos' ? 'bg-[#005A9C] text-white shadow-md' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
                            >
                                {t.dashboardControle.todos}
                            </button>
                            <button
                                onClick={() => setFilterStatus('concluido')}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === 'concluido' ? 'bg-green-600 text-white' : 'bg-slate-50 dark:bg-zinc-800 text-gray-500 hover:bg-slate-100'}`}
                            >
                                {t.dashboardControle.concluido}
                            </button>
                            <button
                                onClick={() => setFilterStatus('pendente')}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === 'pendente' ? 'bg-amber-600 text-white' : 'bg-slate-50 dark:bg-zinc-800 text-gray-500 hover:bg-slate-100'}`}
                            >
                                {t.dashboardControle.pendente}
                            </button>
                        </div>

                        <button
                            onClick={fetchStatusEscolas}
                            disabled={refreshing}
                            className="flex items-center gap-2 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-300 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
                            title="Atualizar lista"
                        >
                            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                        </button>

                        <button
                            onClick={handleExportPDF}
                            disabled={loading || escolasFiltradas.length === 0}
                            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-red-600/10 active:scale-95 ml-2"
                        >
                            <FileText size={16} /> PDF
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-zinc-800/30">
                                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.dashboardControle.unidadeEscolar}</th>
                                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.dashboardControle.etapasAtendidas}</th>
                                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">{t.dashboardControle.status}</th>
                                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">{t.dashboardControle.ultimoLancamento}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-zinc-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <Loader2 size={48} className="animate-spin text-blue-500 opacity-20" />
                                            <p className="text-sm font-medium text-gray-400">{t.dashboardControle.sincronizando}</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : escolasFiltradas.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <School size={48} className="text-gray-200 dark:text-zinc-800" />
                                            <p className="text-sm font-medium text-gray-400">{t.dashboardControle.nenhumaEscola}</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                escolasFiltradas.map((esc) => (
                                    <tr key={esc.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-all group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2 h-10 rounded-full ${esc.jaLancou ? 'bg-green-500' : 'bg-amber-500'}`}></div>
                                                <div>
                                                    <p className="font-bold text-gray-800 dark:text-zinc-100">{esc.nome}</p>
                                                    <p className="text-xs text-gray-400 font-medium">{esc.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-wrap gap-1 max-w-xs">
                                                {esc.segmentos && esc.segmentos.map(seg => (
                                                    <span key={seg} className="px-2 py-0.5 bg-slate-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 rounded text-[9px] font-black uppercase tracking-tight">
                                                        {seg.replace('CONJUNTO UNIFORMA ESCOLAR ', '')}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            {esc.jaLancou ? (
                                                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-900/30">
                                                    <CheckCircle2 size={12} className="mr-1.5" /> {t.dashboardControle.concluido}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30">
                                                    <Clock size={12} className="mr-1.5" /> {t.dashboardControle.pendente}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <p className="text-sm font-bold text-gray-600 dark:text-zinc-400">
                                                {esc.dataUltimoLancamento ? new Date(esc.dataUltimoLancamento).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                                            </p>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {!loading && (
                    <div className="bg-slate-50 dark:bg-zinc-800/30 px-8 py-4 flex items-center justify-between border-t border-gray-100 dark:border-zinc-800">
                        <p className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest">
                            {t.dashboardControle.mostrandoUnidades.replace('{count}', escolasFiltradas.length.toString()).replace('{total}', escolas.length.toString())}
                        </p>
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span className="text-[10px] font-bold text-gray-400 mr-4">{t.dashboardControle.legendaRecebido}</span>
                            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                            <span className="text-[10px] font-bold text-gray-400">{t.dashboardControle.legendaPendente}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
