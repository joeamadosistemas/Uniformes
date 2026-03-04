import React, { useState, useEffect } from 'react';
import { School, CheckCircle2, Clock, Search, Filter, BarChart3, ArrowUpRight, AlertCircle, Loader2, FileText, RefreshCw, X, Layers } from 'lucide-react';
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
    const [selectedEscola, setSelectedEscola] = useState<EscolaStatus | null>(null);
    const [detalhesRecebimento, setDetalhesRecebimento] = useState<any[]>([]);
    const [loadingDetalhes, setLoadingDetalhes] = useState(false);
    const [showModal, setShowModal] = useState(false);

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
            setRefreshing(false);
        }
    };

    const fetchDetalhesEscola = async (escola: EscolaStatus) => {
        try {
            setLoadingDetalhes(true);
            setSelectedEscola(escola);
            setShowModal(true);

            const client = supabaseAdmin || supabase;
            const { data, error } = await client
                .from('recebimentos')
                .select('*')
                .eq('escola', escola.email)
                .order('data_recebimento', { ascending: false });

            if (error) throw error;
            setDetalhesRecebimento(data || []);
        } catch (error) {
            console.error('Erro ao buscar detalhes da escola:', error);
        } finally {
            setLoadingDetalhes(false);
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
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm transition-all hover:scale-[1.02] cursor-default">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl text-blue-600 dark:text-blue-400">
                            <School size={24} />
                        </div>
                        <BarChart3 className="text-gray-300 dark:text-zinc-700" size={20} />
                    </div>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">{t.dashboardControle.totalUnidades}</p>
                    <h3 className="text-3xl font-black text-gray-800 dark:text-white">{totalEscolas}</h3>
                </div>

                <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm transition-all hover:scale-[1.02] cursor-default">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-2xl text-green-600 dark:text-green-400">
                            <CheckCircle2 size={24} />
                        </div>
                        <ArrowUpRight className="text-gray-300 dark:text-zinc-700" size={20} />
                    </div>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">{t.dashboardControle.informaram}</p>
                    <h3 className="text-3xl font-black text-green-600 dark:text-green-400">{totalLancaram}</h3>
                </div>

                <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm transition-all hover:scale-[1.02] cursor-default">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-2xl text-amber-600 dark:text-amber-400">
                            <Clock size={24} />
                        </div>
                        <AlertCircle className="text-gray-300 dark:text-zinc-700" size={20} />
                    </div>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">{t.dashboardControle.aguardando}</p>
                    <h3 className="text-3xl font-black text-amber-600 dark:text-amber-400">{totalPendentes}</h3>
                </div>

                <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm transition-all hover:scale-[1.02] cursor-default">
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

            {/* List Table */}
            <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 shadow-xl shadow-gray-200/50 dark:shadow-none overflow-hidden">
                <div className="p-8 border-b border-gray-50 dark:border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-zinc-900">
                    <div className="relative flex-1 max-w-md group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder={t.dashboardControle.buscarEscola}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-14 pr-6 py-4 bg-gray-50 dark:bg-zinc-800/50 border border-transparent focus:border-blue-500/30 rounded-[1.25rem] focus:ring-4 focus:ring-blue-500/5 outline-none transition-all text-sm font-bold dark:text-white"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-3">
                            <div className="hidden lg:flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                <Filter size={14} /> Filtrar
                            </div>
                            <select
                                value={filterSegmento}
                                onChange={(e) => setFilterSegmento(e.target.value)}
                                className="bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-2xl px-5 py-3.5 text-[10px] font-black text-gray-700 dark:text-zinc-300 outline-none cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-700 transition-all uppercase tracking-widest"
                            >
                                <option value="todos">SEGMENTOS: TODOS</option>
                                {SEGMENTOS_ENSINO.map(seg => (
                                    <option key={seg} value={seg}>
                                        {seg.replace('CONJUNTO UNIFORMA ESCOLAR ', '')}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center gap-2 bg-gray-50 dark:bg-zinc-800 p-1.5 rounded-2xl border border-gray-100 dark:border-zinc-700">
                            {[
                                { id: 'todos', label: t.dashboardControle.todos, color: 'bg-[#005A9C]' },
                                { id: 'concluido', label: t.dashboardControle.concluido, color: 'bg-green-600' },
                                { id: 'pendente', label: t.dashboardControle.pendente, color: 'bg-amber-600' }
                            ].map(status => (
                                <button
                                    key={status.id}
                                    onClick={() => setFilterStatus(status.id as any)}
                                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === status.id ? `${status.color} text-white shadow-lg` : 'text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                                >
                                    {status.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={fetchStatusEscolas}
                                disabled={refreshing}
                                className="p-3.5 bg-gray-50 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 rounded-2xl hover:bg-gray-100 dark:hover:bg-zinc-700 transition-all active:scale-90"
                                title="Atualizar dados"
                            >
                                <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
                            </button>

                            <button
                                onClick={handleExportPDF}
                                disabled={loading || escolasFiltradas.length === 0}
                                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-red-600/20 active:scale-95"
                            >
                                <FileText size={18} /> Exportar PDF
                            </button>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-zinc-800/20">
                                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.dashboardControle.unidadeEscolar}</th>
                                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.dashboardControle.etapasAtendidas}</th>
                                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">{t.dashboardControle.status}</th>
                                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">{t.dashboardControle.ultimoLancamento}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-zinc-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-10 py-32 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest animate-pulse">{t.dashboardControle.sincronizando}</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : escolasFiltradas.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-10 py-32 text-center">
                                        <div className="flex flex-col items-center gap-4 opacity-30">
                                            <School size={80} />
                                            <p className="text-sm font-bold text-gray-400 uppercase tracking-tight">{t.dashboardControle.nenhumaEscola}</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                escolasFiltradas.map((esc) => (
                                    <tr
                                        key={esc.id}
                                        onClick={() => fetchDetalhesEscola(esc)}
                                        className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all group cursor-pointer"
                                    >
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-5">
                                                <div className={`w-1.5 h-12 rounded-full transition-all group-hover:h-14 ${esc.jaLancou ? 'bg-green-500 shadow-lg shadow-green-500/30' : 'bg-amber-500 shadow-lg shadow-amber-500/30'}`}></div>
                                                <div>
                                                    <p className="font-black text-gray-800 dark:text-zinc-100 text-base group-hover:text-[#005A9C] transition-colors uppercase tracking-tight">{esc.nome}</p>
                                                    <p className="text-xs text-gray-400 font-bold tracking-tight">{esc.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className="flex flex-wrap gap-2 max-w-sm">
                                                {esc.segmentos && esc.segmentos.map(seg => (
                                                    <span key={seg} className="px-3 py-1.5 bg-gray-50 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 rounded-xl text-[9px] font-black uppercase tracking-widest border border-gray-100 dark:border-zinc-700 shadow-sm transition-all group-hover:border-blue-500/20 group-hover:bg-white dark:group-hover:bg-zinc-700">
                                                        {seg.replace('CONJUNTO UNIFORMA ESCOLAR ', '')}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-10 py-8 text-center">
                                            {esc.jaLancou ? (
                                                <span className="inline-flex items-center px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-800/30 shadow-sm">
                                                    <CheckCircle2 size={14} className="mr-2" /> {t.dashboardControle.concluido}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800/30 shadow-sm">
                                                    <Clock size={14} className="mr-2" /> {t.dashboardControle.pendente}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-10 py-8 text-right">
                                            <p className="text-sm font-black text-gray-700 dark:text-zinc-200 tabular-nums">
                                                {esc.dataUltimoLancamento ? new Date(esc.dataUltimoLancamento).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'}
                                            </p>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                {esc.dataUltimoLancamento ? new Date(esc.dataUltimoLancamento).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
                                            </p>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {!loading && (
                    <div className="bg-gray-50 dark:bg-zinc-800/50 px-10 py-6 flex flex-col md:flex-row items-center justify-between border-t border-gray-100 dark:border-zinc-800 gap-4">
                        <p className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest">
                            {t.dashboardControle.mostrandoUnidades.replace('{count}', escolasFiltradas.length.toString()).replace('{total}', escolas.length.toString())}
                        </p>
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-lg shadow-green-500/30"></div>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.dashboardControle.legendaRecebido}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-lg shadow-amber-500/30"></div>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.dashboardControle.legendaPendente}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de Detalhes da Unidade */}
            {showModal && selectedEscola && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-zinc-900 w-full max-w-5xl max-h-[90vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 border border-white/10">
                        {/* Modal Header */}
                        <div className="p-10 border-b border-gray-100 dark:border-zinc-800 relative bg-white dark:bg-zinc-900">
                            <button
                                onClick={() => setShowModal(false)}
                                className="absolute right-10 top-10 p-3 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-2xl transition-all text-gray-400 active:scale-90"
                            >
                                <X size={24} />
                            </button>

                            <div className="flex items-center gap-8">
                                <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center shadow-2xl ${selectedEscola.jaLancou ? 'bg-green-500 text-white shadow-green-500/20' : 'bg-amber-500 text-white shadow-amber-500/20'}`}>
                                    <School size={48} />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black text-gray-800 dark:text-white uppercase tracking-tight leading-none mb-3">{selectedEscola.nome}</h2>
                                    <div className="flex flex-wrap items-center gap-4">
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-zinc-800 rounded-xl border border-gray-100 dark:border-zinc-700">
                                            <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                                            <span className="text-xs font-bold text-gray-500 dark:text-zinc-400">{selectedEscola.email}</span>
                                        </div>
                                        {selectedEscola.jaLancou ? (
                                            <span className="px-4 py-1.5 bg-green-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-green-500/20">
                                                {t.dashboardControle.concluido}
                                            </span>
                                        ) : (
                                            <span className="px-4 py-1.5 bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-amber-500/20">
                                                {t.dashboardControle.pendente}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
                            {/* Stats Summary Area */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div className="p-8 bg-gray-50 dark:bg-zinc-800/40 rounded-[2rem] border border-gray-100 dark:border-zinc-800/50 shadow-sm flex flex-col justify-center">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Total Recebido</p>
                                    <p className="text-4xl font-black text-[#005A9C] dark:text-blue-400 tabular-nums">
                                        {detalhesRecebimento.reduce((acc, curr) => acc + (curr.quantidade || 0), 0)}
                                    </p>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">Peças de Uniforme</p>
                                </div>
                                <div className="p-8 bg-gray-50 dark:bg-zinc-800/40 rounded-[2rem] border border-gray-100 dark:border-zinc-800/50 shadow-sm flex flex-col justify-center">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Modelos Distintos</p>
                                    <p className="text-4xl font-black text-gray-800 dark:text-white tabular-nums">
                                        {new Set(detalhesRecebimento.map(d => d.modelo_id)).size}
                                    </p>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">Variedades</p>
                                </div>
                                <div className="md:col-span-2 p-8 bg-blue-600 rounded-[2rem] border border-blue-500 shadow-xl shadow-blue-600/20 flex flex-col justify-center text-white">
                                    <p className="text-[10px] font-black text-blue-100 uppercase tracking-widest mb-2">Última Movimentação</p>
                                    <div className="flex items-center gap-3">
                                        <Clock className="text-blue-200" size={32} />
                                        <div className="space-y-0.5">
                                            <p className="text-2xl font-black">
                                                {selectedEscola.dataUltimoLancamento ? new Date(selectedEscola.dataUltimoLancamento).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '---'}
                                            </p>
                                            <p className="text-xs font-bold text-blue-100 uppercase tracking-widest opacity-80">
                                                {selectedEscola.dataUltimoLancamento ? new Date(selectedEscola.dataUltimoLancamento).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'Sem lançamentos'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Etapas Atendidas Info */}
                            <div className="p-8 bg-gray-50 dark:bg-zinc-800/30 rounded-[2rem] border border-gray-100 dark:border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-8">
                                <div className="space-y-1">
                                    <h3 className="text-sm font-black text-gray-800 dark:text-white uppercase tracking-tight flex items-center gap-2">
                                        <Layers className="text-[#005A9C]" size={20} /> Etapas de Ensino Atendidas
                                    </h3>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nesta Unidade Escolar</p>
                                </div>
                                <div className="flex flex-wrap gap-2 md:justify-end">
                                    {selectedEscola.segmentos && selectedEscola.segmentos.map(seg => (
                                        <span key={seg} className="px-5 py-2.5 bg-white dark:bg-zinc-800 shadow-sm border border-gray-100 dark:border-zinc-700 rounded-2xl text-[10px] font-black text-gray-600 dark:text-zinc-300 uppercase tracking-widest">
                                            {seg.replace('CONJUNTO UNIFORMA ESCOLAR ', '')}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Details Table Area */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <h3 className="text-xl font-black text-gray-800 dark:text-white uppercase tracking-tight flex items-center gap-3">
                                            <BarChart3 className="text-[#005A9C]" size={24} /> Relatório de Recebimento
                                        </h3>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Lista detalhada de peças e grades</p>
                                    </div>
                                    <div className="px-6 py-2 bg-gray-100 dark:bg-zinc-800 rounded-full text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                        {detalhesRecebimento.length} Lançamentos registrados
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-sm">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50/50 dark:bg-zinc-800/30 border-b border-gray-100 dark:border-zinc-800">
                                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Modelo do Uniforme</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Tamanho</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Quantidade</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Data Lançamento</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50 dark:divide-zinc-800">
                                            {loadingDetalhes ? (
                                                <tr>
                                                    <td colSpan={4} className="px-8 py-20 text-center">
                                                        <div className="flex flex-col items-center gap-4">
                                                            <Loader2 className="animate-spin text-blue-500" size={32} />
                                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest animate-pulse">Buscando dados no servidor...</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : detalhesRecebimento.length === 0 ? (
                                                <tr>
                                                    <td colSpan={4} className="px-8 py-24 text-center">
                                                        <div className="flex flex-col items-center gap-4 opacity-20">
                                                            <AlertCircle size={64} />
                                                            <p className="text-sm font-black uppercase tracking-widest">Nenhum registro encontrado para esta unidade.</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : detalhesRecebimento.map((item, idx) => (
                                                <tr key={idx} className="hover:bg-blue-50/20 dark:hover:bg-blue-900/10 transition-colors">
                                                    <td className="px-8 py-6">
                                                        <p className="font-black text-gray-800 dark:text-zinc-100 text-sm">{item.modelo_nome}</p>
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight line-clamp-1">{item.descricao}</p>
                                                    </td>
                                                    <td className="px-8 py-6 text-center">
                                                        <span className="inline-block px-3 py-1 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-gray-100 dark:border-zinc-700">
                                                            {item.tamanho}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-6 text-right font-black text-gray-800 dark:text-white tabular-nums">
                                                        {item.quantidade}
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <p className="text-xs font-black text-gray-700 dark:text-zinc-300 tabular-nums">
                                                            {new Date(item.data_recebimento).toLocaleDateString('pt-BR')}
                                                        </p>
                                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                                                            {new Date(item.data_recebimento).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-10 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-zinc-900">
                            <div className="flex items-center gap-2 text-gray-400">
                                <AlertCircle size={16} />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Visualização somente leitura para administradores</span>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-12 py-4 bg-gray-900 dark:bg-white text-white dark:text-black rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-black dark:hover:bg-zinc-200 hover:scale-[1.05] active:scale-95 transition-all"
                            >
                                Fechar Painel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
