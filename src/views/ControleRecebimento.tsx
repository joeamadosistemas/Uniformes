import React, { useState, useEffect } from 'react';
import { School, CheckCircle2, Clock, Search, BarChart3, Loader2, FileText, RefreshCw, X, Layers, AlertCircle, BookOpen, ShoppingBag, Activity, Package } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useT } from '../lib/LanguageContext';
import { EscolaCadastro } from '../types';
import { SEGMENTOS_ENSINO } from '../constants';
import { exportarControleRecebimentoPDF, exportarRecebimentosPDF } from '../utils/exportUtils';

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
    const [selectedYear, setSelectedYear] = useState<number>(2026);
    const [escolasSemMaterial, setEscolasSemMaterial] = useState<number>(0);
    const [escolasSemMochila, setEscolasSemMochila] = useState<number>(0);
    const [totalPecasGeral, setTotalPecasGeral] = useState<number>(0);
    const [ultimaAtividade, setUltimaAtividade] = useState<{ escola: string; data: string } | null>(null);

    useEffect(() => {
        fetchStatusEscolas();
    }, [selectedYear]);

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

            const startDate = `${selectedYear}-01-01T00:00:00Z`;
            const endDate = `${selectedYear}-12-31T23:59:59Z`;

            const { data: lancamentos, error: errorLancamentos } = await supabase
                .from('recebimentos')
                .select('escola, data_recebimento, modelo_nome, quantidade')
                .gte('data_recebimento', startDate)
                .lte('data_recebimento', endDate)
                .order('data_recebimento', { ascending: false })
                .limit(10000);

            if (errorLancamentos) {
                console.warn('Tabela recebimentos ainda não disponível para controle total.');
            }

            const escolasComLancamento = new Map<string, string>(); // email -> data
            const escolasComMaterialSet = new Set<string>();
            const escolasComMochilaSet = new Set<string>();
            let volumeTotal = 0;
            let ultimoRegistro: { escola: string; data: string } | null = null;

            if (lancamentos) {
                lancamentos.forEach(l => {
                    const emailKey = (l.escola || '').toLowerCase().trim();
                    const dataAtual = l.data_recebimento;
                    const nomeModelo = (l.modelo_nome || '').toUpperCase();
                    const qtd = l.quantidade || 0;

                    // Volume Geral
                    volumeTotal += qtd;

                    // Última Atividade
                    if (!ultimoRegistro || new Date(dataAtual) > new Date(ultimoRegistro.data)) {
                        const escolaInfo = todasEscolas.find(e => (e.email || '').toLowerCase().trim() === emailKey);
                        ultimoRegistro = {
                            escola: escolaInfo?.nome || emailKey,
                            data: dataAtual
                        };
                    }

                    // Geral
                    const dataExistente = escolasComLancamento.get(emailKey);
                    if (!dataExistente || new Date(dataAtual) > new Date(dataExistente)) {
                        escolasComLancamento.set(emailKey, dataAtual);
                    }

                    // Material Pedagógico
                    if (nomeModelo.includes('MATERIAL PEDAGÓGICO')) {
                        escolasComMaterialSet.add(emailKey);
                    }

                    // Mochilas
                    if (nomeModelo.includes('MOCHILA')) {
                        escolasComMochilaSet.add(emailKey);
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

            // Calcular pendências específicas
            const totalComMaterial = mappedEscolas.filter(esc => {
                const emailKey = (esc.email || '').toLowerCase().trim();
                return escolasComMaterialSet.has(emailKey);
            }).length;

            const totalComMochila = mappedEscolas.filter(esc => {
                const emailKey = (esc.email || '').toLowerCase().trim();
                return escolasComMochilaSet.has(emailKey);
            }).length;

            setEscolasSemMaterial(todasEscolas.length - totalComMaterial);
            setEscolasSemMochila(todasEscolas.length - totalComMochila);
            setTotalPecasGeral(volumeTotal);
            setUltimaAtividade(ultimoRegistro);

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

            const { data, error } = await supabase
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

    const handleExportUnidadePDF = () => {
        if (!selectedEscola || detalhesRecebimento.length === 0) return;
        exportarRecebimentosPDF(detalhesRecebimento, selectedEscola.nome);
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
            {/* Stats Cards Originais */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {/* Total Unidades */}
                <div className="bg-white dark:bg-zinc-900 p-5 md:p-6 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm transition-all hover:scale-[1.02] cursor-default flex flex-col items-center text-center">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-2xl text-[#005A9C] dark:text-blue-400 mb-2">
                        <School size={20} className="md:w-6 md:h-6" />
                    </div>
                    <p className="text-[9px] md:text-xs font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-1">{t.dashboardControle.totalUnidades}</p>
                    <h3 className="text-xl md:text-3xl font-black text-gray-800 dark:text-white">{totalEscolas}</h3>
                </div>

                {/* Informaram Recebimento */}
                <div className="bg-white dark:bg-zinc-900 p-5 md:p-6 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm transition-all hover:scale-[1.02] cursor-default flex flex-col items-center text-center">
                    <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-2xl text-green-600 dark:text-green-400 mb-2">
                        <CheckCircle2 size={20} className="md:w-6 md:h-6" />
                    </div>
                    <p className="text-[9px] md:text-xs font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-1">{t.dashboardControle.informaram}</p>
                    <h3 className="text-xl md:text-3xl font-black text-green-600 dark:text-green-400">{totalLancaram}</h3>
                </div>

                {/* Aguardando Lançamento */}
                <div className="bg-white dark:bg-zinc-900 p-5 md:p-6 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm transition-all hover:scale-[1.02] cursor-default flex flex-col items-center text-center">
                    <div className="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-2xl text-amber-600 dark:text-amber-400 mb-2">
                        <Clock size={20} className="md:w-6 md:h-6" />
                    </div>
                    <p className="text-[9px] md:text-xs font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Pendente</p>
                    <h3 className="text-xl md:text-3xl font-black text-amber-600 dark:text-amber-400">{totalPendentes}</h3>
                </div>

                {/* Taxa de Adesão */}
                <div className="bg-white dark:bg-zinc-900 p-5 md:p-6 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm transition-all hover:scale-[1.02] cursor-default flex flex-col items-center text-center">
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl text-indigo-600 dark:text-indigo-400 mb-2">
                        <BarChart3 size={20} className="md:w-6 md:h-6" />
                    </div>
                    <p className="text-[9px] md:text-xs font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Adesão</p>
                    <div className="flex items-baseline gap-1">
                        <h3 className="text-xl md:text-3xl font-black text-indigo-600 dark:text-indigo-400">{percentualConcluido.toFixed(1)}</h3>
                        <span className="text-[10px] font-bold text-indigo-400">%</span>
                    </div>
                </div>
            </div>

            {/* Novos Cards de Pendências Específicas e Monitoramento UX */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {/* Card Material Pedagógico */}
                <div className="bg-white dark:bg-zinc-900 p-5 md:p-6 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm transition-all hover:scale-[1.01] cursor-default flex items-center gap-4">
                    <div className="p-4 bg-orange-50 dark:bg-orange-900/30 rounded-2xl text-orange-600 dark:text-orange-400">
                        <BookOpen size={24} className="md:w-8 md:h-8" />
                    </div>
                    <div className="flex-1">
                        <p className="text-[10px] md:text-xs font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-1 leading-tight">Pendência Material Pedagógico</p>
                        <h3 className="text-xl md:text-3xl font-black text-orange-600 dark:text-orange-400 leading-none">{escolasSemMaterial}</h3>
                    </div>
                </div>

                {/* Card Mochilas */}
                <div className="bg-white dark:bg-zinc-900 p-5 md:p-6 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm transition-all hover:scale-[1.01] cursor-default flex items-center gap-4">
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/30 rounded-2xl text-purple-600 dark:text-purple-400">
                        <ShoppingBag size={24} className="md:w-8 md:h-8" />
                    </div>
                    <div className="flex-1">
                        <p className="text-[10px] md:text-xs font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-1 leading-tight">Pendência Mochilas</p>
                        <h3 className="text-xl md:text-3xl font-black text-purple-600 dark:text-purple-400 leading-none">{escolasSemMochila}</h3>
                    </div>
                </div>

                {/* NOVO: Card Volume Total de Peças */}
                <div className="bg-white dark:bg-zinc-900 p-5 md:p-6 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm transition-all hover:scale-[1.01] cursor-default flex items-center gap-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-2xl text-blue-600 dark:text-blue-400">
                        <Package size={24} className="md:w-8 md:h-8" />
                    </div>
                    <div className="flex-1">
                        <p className="text-[10px] md:text-xs font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-1 leading-tight">Volume Total de Peças</p>
                        <h3 className="text-xl md:text-3xl font-black text-blue-800 dark:text-blue-100 leading-none">{totalPecasGeral.toLocaleString('pt-BR')}</h3>
                    </div>
                </div>

                {/* NOVO: Card Última Atividade */}
                <div className="bg-white dark:bg-zinc-900 p-5 md:p-6 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm transition-all hover:scale-[1.01] cursor-default flex items-center gap-4">
                    <div className="p-4 bg-pink-50 dark:bg-pink-900/30 rounded-2xl text-pink-600 dark:text-pink-400">
                        <Activity size={24} className="md:w-8 md:h-8" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] md:text-xs font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-1 leading-tight">Última Atividade</p>
                        <h3 className="text-sm md:text-base font-black text-pink-600 dark:text-pink-400 leading-tight truncate">
                            {ultimaAtividade ? ultimaAtividade.escola : 'Nenhum lançamento'}
                        </h3>
                        <p className="text-[9px] font-bold text-gray-400 uppercase">
                            {ultimaAtividade ? new Date(ultimaAtividade.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '-'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Filters Toolbar - Premium Style (Image 2) */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 py-6">
                <div className="flex flex-wrap items-center justify-center gap-3">
                    {/* Label Filtrar */}
                    <div className="flex items-center gap-2">
                        <Search size={16} className="text-gray-400" />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Filtrar</span>
                    </div>

                    {/* Seletor Segmento */}
                    <div className="bg-white dark:bg-zinc-800/80 px-5 py-3 rounded-[1.5rem] border border-gray-100 dark:border-zinc-700 shadow-sm flex items-center gap-2 min-w-[200px]">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Segmentos:</span>
                        <select
                            value={filterSegmento}
                            onChange={(e) => setFilterSegmento(e.target.value)}
                            className="bg-transparent border-none p-0 text-xs font-black text-[#005A9C] dark:text-[#66b3ff] focus:ring-0 cursor-pointer uppercase tracking-tight"
                        >
                            <option value="todos">Todos</option>
                            {SEGMENTOS_ENSINO.map(seg => (
                                <option key={seg} value={seg}>
                                    {seg.replace('CONJUNTO UNIFORMA ESCOLAR ', '').replace('CONJUNTO UNIFORME ESCOLAR ', '')}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Seletor Ano */}
                    <div className="bg-white dark:bg-zinc-800/80 px-5 py-3 rounded-[1.5rem] border border-gray-100 dark:border-zinc-700 shadow-sm flex items-center gap-2">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ano:</span>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            className="bg-transparent border-none p-0 text-xs font-black text-[#005A9C] dark:text-[#66b3ff] focus:ring-0 cursor-pointer"
                        >
                            <option value={2026}>2026</option>
                            <option value={2025}>2025</option>
                            <option value={2024}>2024</option>
                        </select>
                    </div>

                    {/* Busca */}
                    <div className="relative bg-white dark:bg-zinc-800/80 rounded-[1.5rem] px-5 py-3 border border-gray-100 dark:border-zinc-700 shadow-sm w-48 focus-within:w-64 transition-all">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Buscar"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-transparent border-none p-0 pl-6 w-full text-xs font-bold text-gray-700 dark:text-zinc-300 placeholder-gray-400 outline-none"
                        />
                    </div>

                    {/* Status Tabs */}
                    <div className="bg-white dark:bg-zinc-800/80 p-1 rounded-[1.5rem] border border-gray-100 dark:border-zinc-700 shadow-sm flex items-center">
                        {[
                            { id: 'todos', label: 'Todos' },
                            { id: 'concluido', label: 'Concluído' },
                            { id: 'pendente', label: 'Pendente' }
                        ].map(status => (
                            <button
                                key={status.id}
                                onClick={() => setFilterStatus(status.id as any)}
                                className={`px-6 py-2 rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${filterStatus === status.id
                                    ? 'bg-[#D97706] text-white shadow-md shadow-amber-600/20'
                                    : 'text-gray-400 hover:text-gray-600'
                                    }`}
                            >
                                {status.label}
                            </button>
                        ))}
                    </div>

                    {/* Refresh */}
                    <button
                        onClick={fetchStatusEscolas}
                        disabled={refreshing}
                        className="w-11 h-11 flex items-center justify-center bg-white dark:bg-zinc-800 rounded-full border border-gray-100 dark:border-zinc-700 text-gray-400 hover:text-[#005A9C] shadow-sm transition-all active:scale-95"
                    >
                        <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
                    </button>
                </div>

                <button
                    onClick={handleExportPDF}
                    disabled={loading || escolasFiltradas.length === 0}
                    className="flex items-center gap-2 bg-[#DC2626] hover:bg-red-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-red-600/20"
                >
                    <FileText size={16} /> Exportar PDF
                </button>
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
                                            <div className={`w - 1.5 h - 12 rounded - full transition - all group - hover: h - 14 ${esc.jaLancou ? 'bg-green-500 shadow-lg shadow-green-500/30' : 'bg-amber-500 shadow-lg shadow-amber-500/30'} `}></div>
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

            {/* Modal de Detalhes da Unidade */}
            {showModal && selectedEscola && (
                <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-zinc-900 w-full max-w-3xl max-h-[90vh] sm:rounded-[3rem] rounded-t-[2rem] shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300 border border-white/10">
                        {/* Modal Header - Compact & Premium */}
                        <div className="p-6 md:p-8 border-b border-gray-100 dark:border-white/5 relative bg-white dark:bg-zinc-900/90 backdrop-blur-xl">
                            <button
                                onClick={() => setShowModal(false)}
                                className="absolute right-4 top-4 p-2.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-all text-gray-400 active:scale-90 z-10"
                            >
                                <X size={20} />
                            </button>

                            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
                                <div className={`w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-2xl flex items-center justify-center shadow-2xl ${selectedEscola.jaLancou ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-amber-500 text-white shadow-amber-500/20'}`}>
                                    <School size={32} className="sm:w-10 sm:h-10" />
                                </div>
                                <div className="text-center sm:text-left flex-1 min-w-0">
                                    <h2 className="text-xl sm:text-2xl font-black text-gray-800 dark:text-white uppercase tracking-tight leading-tight mb-2 truncate px-4 sm:px-0">{selectedEscola.nome}</h2>
                                    <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2">
                                        <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 dark:bg-zinc-800/50 rounded-lg border border-gray-100 dark:border-white/5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                                            <span className="text-[10px] font-bold text-gray-500 dark:text-zinc-400 truncate max-w-[150px] sm:max-w-none">{selectedEscola.email}</span>
                                        </div>
                                        {selectedEscola.jaLancou ? (
                                            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-black uppercase tracking-widest rounded-lg border border-emerald-500/20">
                                                {t.dashboardControle.concluido}
                                            </span>
                                        ) : (
                                            <span className="px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[9px] font-black uppercase tracking-widest rounded-lg border border-amber-500/20">
                                                {t.dashboardControle.pendente}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 md:space-y-8 custom-scrollbar bg-gray-50/30 dark:bg-zinc-950/20">
                            {/* Stats Summary - Glassmorphism */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                                <div className="p-4 md:p-6 bg-white dark:bg-zinc-900/40 dark:backdrop-blur-md rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm flex flex-col justify-center text-center sm:text-left transition-all hover:scale-[1.02]">
                                    <p className="text-[8px] md:text-[9px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Total</p>
                                    <p className="text-2xl md:text-3xl font-black text-blue-600 dark:text-blue-400 tabular-nums leading-none">
                                        {detalhesRecebimento.reduce((acc, curr) => acc + (curr.quantidade || 0), 0)}
                                    </p>
                                    <p className="text-[8px] md:text-[9px] font-bold text-gray-400 dark:text-zinc-600 uppercase mt-1">Peças</p>
                                </div>
                                <div className="p-4 md:p-6 bg-white dark:bg-zinc-900/40 dark:backdrop-blur-md rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm flex flex-col justify-center text-center sm:text-left transition-all hover:scale-[1.02]">
                                    <p className="text-[8px] md:text-[9px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Modelos</p>
                                    <p className="text-2xl md:text-3xl font-black text-gray-800 dark:text-white tabular-nums leading-none">
                                        {new Set(detalhesRecebimento.map(d => d.modelo_id)).size}
                                    </p>
                                    <p className="text-[8px] md:text-[9px] font-bold text-gray-400 dark:text-zinc-600 uppercase mt-1">Variedades</p>
                                </div>
                                <div className="col-span-2 md:col-span-2 p-4 md:p-6 bg-blue-600 dark:bg-blue-600/90 rounded-2xl border border-blue-500 shadow-lg shadow-blue-600/20 flex items-center justify-between text-white transition-all hover:scale-[1.01]">
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black text-blue-100 uppercase tracking-widest leading-none">Última Movimentação</p>
                                        <p className="text-xl md:text-2xl font-black tabular-nums leading-none">
                                            {selectedEscola.dataUltimoLancamento ? new Date(selectedEscola.dataUltimoLancamento).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '---'}
                                        </p>
                                        <p className="text-[10px] font-bold text-blue-100/70 uppercase tracking-widest leading-none">
                                            {selectedEscola.dataUltimoLancamento ? new Date(selectedEscola.dataUltimoLancamento).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'Sem lançamentos'}
                                        </p>
                                    </div>
                                    <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-sm">
                                        <Clock size={24} className="text-blue-100" />
                                    </div>
                                </div>
                            </div>

                            {/* Etapas Atendidas Info */}
                            <div className="p-6 md:p-8 bg-gray-50 dark:bg-zinc-800/30 rounded-3xl md:rounded-[2rem] border border-gray-100 dark:border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-8">
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
                            <div className="space-y-4 md:space-y-6">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <h3 className="text-lg md:text-xl font-black text-gray-800 dark:text-white uppercase tracking-tight flex items-center gap-2 md:gap-3">
                                            <BarChart3 className="text-[#005A9C] shrink-0" size={20} /> Relatório de Recebimento
                                        </h3>
                                        <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest">Lista detalhada de peças e grades</p>
                                    </div>
                                    <div className="px-4 py-1.5 md:px-6 md:py-2 bg-gray-100 dark:bg-zinc-800 rounded-full text-[9px] md:text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                        {detalhesRecebimento.length} Lançamentos
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl md:rounded-[2.5rem] overflow-hidden shadow-sm">
                                    <div className="overflow-x-auto custom-scrollbar">
                                        <table className="w-full text-left border-collapse min-w-[500px]">
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
                        </div>

                        {/* Modal Footer */}
                        <div className="p-5 md:p-8 border-t border-gray-100 dark:border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md">
                            <div className="flex items-center gap-2 text-gray-400 text-center md:text-left">
                                <AlertCircle size={14} className="shrink-0" />
                                <span className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest leading-relaxed">Painel de Visualização Administrativa</span>
                            </div>
                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <button
                                    onClick={handleExportUnidadePDF}
                                    disabled={loadingDetalhes || detalhesRecebimento.length === 0}
                                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-red-600/20 active:scale-95"
                                >
                                    <FileText size={16} /> Gerar PDF
                                </button>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 md:flex-none px-6 py-3.5 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black dark:hover:bg-zinc-200 active:scale-95 transition-all shadow-xl"
                                >
                                    Fechar Painel
                                </button>
                            </div>
                        </div>

                        {/* Mobile bottom padding spacer for safe-area */}
                        <div className="pb-4 sm:pb-0 bg-white dark:bg-zinc-900"></div>
                    </div>
                </div>
            )}
        </div>
    );
};
