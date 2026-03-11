import React, { useState, useEffect } from 'react';
import { 
    School, 
    CheckCircle2, 
    Clock, 
    Search, 
    BarChart3, 
    Loader2, 
    FileText, 
    RefreshCw, 
    X, 
    Layers, 
    AlertCircle,
    Package,
    ArrowUpDown,
    Download
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useT } from '../lib/LanguageContext';
import { EscolaCadastro } from '../types';
import { SEGMENTOS_ENSINO } from '../constants';
import { exportarControleRecebimentoPDF, exportarParaPDF, exportarTodasParaPDF } from '../utils/exportUtils';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { SchoolDetailModal } from '../components/SchoolDetailModal';
import { RegistroUniforme } from '../types';

interface EscolaStatus extends EscolaCadastro {
    jaLancou: boolean;
    dataUltimoLancamento?: string;
    status: 'concluido' | 'pendente';
}

export const StatusInventario: React.FC = () => {
    const { t } = useT();
    const [escolas, setEscolas] = useState<EscolaStatus[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'todos' | 'concluido' | 'pendente'>('todos');
    const [filterSegmento, setFilterSegmento] = useState<string>('todos');
    const [selectedYear, setSelectedYear] = useState<number>(2026);
    const [refreshing, setRefreshing] = useState(false);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEscolaModal, setSelectedEscolaModal] = useState<EscolaStatus | null>(null);
    const [escolaRegistros, setEscolaRegistros] = useState<RegistroUniforme[]>([]);
    const [loadingRecords, setLoadingRecords] = useState(false);
    const [exportingAll, setExportingAll] = useState(false);

    useEffect(() => {
        fetchStatusInventario();
    }, [selectedYear]);

    const fetchStatusInventario = async () => {
        try {
            setLoading(true);
            setRefreshing(true);

            // 1. Buscar todas as escolas ativas
            const { data: todasEscolas, error: errorEscolas } = await supabase
                .from('escolas')
                .select('*')
                .eq('ativo', true)
                .order('nome', { ascending: true });

            if (errorEscolas) throw errorEscolas;

            // 2. Buscar lançamentos de inventário para o ano selecionado
            const startDate = `${selectedYear}-01-01T00:00:00Z`;
            const endDate = `${selectedYear}-12-31T23:59:59Z`;

            // Nota: O 'sistema de controle de uniformes' usa a tabela 'registros_uniformes' para o inventário
            const { data: lancamentos, error: errorLancamentos } = await supabase
                .from('registros_uniformes')
                .select('escola, data_registro')
                .gte('data_registro', startDate)
                .lte('data_registro', endDate)
                .order('data_registro', { ascending: false });

            if (errorLancamentos) {
                console.warn('Erro ao buscar lançamentos de inventário:', errorLancamentos);
            }

            const escolasComLancamento = new Map<string, string>(); // email -> data_registro

            if (lancamentos) {
                lancamentos.forEach(l => {
                    const escolaKey = (l.escola || '').toLowerCase().trim();
                    if (!escolasComLancamento.has(escolaKey)) {
                        escolasComLancamento.set(escolaKey, l.data_registro);
                    }
                });
            }

            const mappedEscolas: EscolaStatus[] = todasEscolas.map(esc => {
                const escolaKey = (esc.email || '').toLowerCase().trim();
                const jaLancou = escolasComLancamento.has(escolaKey);
                return {
                    ...esc,
                    jaLancou: jaLancou,
                    dataUltimoLancamento: escolasComLancamento.get(escolaKey),
                    status: jaLancou ? 'concluido' : 'pendente'
                };
            });

            setEscolas(mappedEscolas);
        } catch (error) {
            console.error('Erro ao buscar status do inventário:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleExportExcel = () => {
        const data = escolasFiltradas.map(esc => ({
            'Nome da Escola': esc.nome,
            'E-mail': esc.email,
            'Etapas Atendidas': Array.isArray(esc.segmentos) ? esc.segmentos.join(', ') : '',
            'Status': esc.jaLancou ? 'CONCLUÍDO' : 'PENDENTE',
            'Último Lançamento': esc.dataUltimoLancamento ? format(new Date(esc.dataUltimoLancamento), 'dd/MM/yyyy HH:mm') : '-'
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Status Inventario");
        XLSX.writeFile(wb, `status_inventario_${selectedYear}.xlsx`);
    };

    const handleExportPDF = () => {
        // Aproveitar a função existente de exportação de controle
        exportarControleRecebimentoPDF(escolasFiltradas.map(e => ({
            ...e,
            jaLancou: e.jaLancou,
            dataUltimoLancamento: e.dataUltimoLancamento
        })));
    };

    const handleExportModalPDF = () => {
        if (selectedEscolaModal && escolaRegistros.length > 0) {
            exportarParaPDF(escolaRegistros, selectedEscolaModal.email); // email because that's what shows in the target PDF
        }
    };

    const handleExportDetailedPDF = async () => {
        try {
            setExportingAll(true);
            const escolasNomes = escolasFiltradas.filter(e => e.jaLancou).map(e => e.email);
            if (escolasNomes.length === 0) {
                 return;
            }

            const startDate = `${selectedYear}-01-01T00:00:00Z`;
            const endDate = `${selectedYear}-12-31T23:59:59Z`;

            const { data, error } = await supabase
                .from('registros_uniformes')
                .select('*')
                .gte('data_registro', startDate)
                .lte('data_registro', endDate)
                .order('data_registro', { ascending: false })
                .limit(10000);
            
            if (error) throw error;
            
            const validEmails = new Set(escolasNomes.map(e => e?.toLowerCase().trim()));
            const dataFiltered = (data || []).filter(r => validEmails.has((r.escola || '').toLowerCase().trim()));
            
            console.log("DEBUG: emails a filtrar =", validEmails);
            console.log("DEBUG: total registros no periodo =", data?.length);
            console.log("DEBUG: registros apos filtro =", dataFiltered.length);
            
            // Group by school
            const grouped = new Map<string, RegistroUniforme[]>();
            dataFiltered.forEach(r => {
                const escolaKey = (r.escola || '').toLowerCase().trim();
                if (!grouped.has(escolaKey)) {
                    grouped.set(escolaKey, []);
                }
                grouped.get(escolaKey)!.push(r);
            });

            // Map emails back to school names for display
            const registrosPorEscola = Array.from(grouped.entries()).map(([emailKey, registros]) => {
                const esc = escolasFiltradas.find(e => e.email?.toLowerCase().trim() === emailKey);
                return {
                    escolaNome: esc ? esc.nome : emailKey,
                    registros
                };
            }).sort((a, b) => a.escolaNome.localeCompare(b.escolaNome));

            console.log("DEBUG: quantia de escolas com registros mapeados =", registrosPorEscola.length, registrosPorEscola);

            exportarTodasParaPDF(registrosPorEscola);

        } catch (error) {
            console.error("Erro ao exportar PDF detalhado:", error);
        } finally {
            setExportingAll(false);
        }
    };

    const totalUnidades = escolas.length;
    const informaramRecebimento = escolas.filter(e => e.jaLancou).length; // Aqui estamos usando jaLancou como proxy para "informaram"
    const concluidos = informaramRecebimento;
    const pendentes = totalUnidades - concluidos;

    const escolasFiltradas = escolas.filter(esc => {
        const matchesSearch = esc.nome.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'todos' || filterStatus === esc.status;
        
        let matchesSegmento = true;
        if (filterSegmento !== 'todos') {
            matchesSegmento = Array.isArray(esc.segmentos) && esc.segmentos.includes(filterSegmento);
        }

        return matchesSearch && matchesStatus && matchesSegmento;
    });

    const handleOpenModal = async (escola: EscolaStatus) => {
        setSelectedEscolaModal(escola);
        setIsModalOpen(true);
        setLoadingRecords(true);
        
        try {
            // Buscar lançamentos detalhados desta escola para o ano selecionado
            const startDate = `${selectedYear}-01-01T00:00:00Z`;
            const endDate = `${selectedYear}-12-31T23:59:59Z`;

            const { data, error } = await supabase
                .from('registros_uniformes')
                .select('*')
                .eq('escola', escola.email)
                .gte('data_registro', startDate)
                .lte('data_registro', endDate)
                .order('data_registro', { ascending: false });

            if (error) throw error;
            setEscolaRegistros(data || []);
        } catch (error) {
            console.error('Erro ao buscar detalhes da escola:', error);
        } finally {
            setLoadingRecords(false);
        }
    };

    return (
        <div className="space-y-8 pb-20">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {/* Total Unidades */}
                <div className="bg-white dark:bg-[#1e1e2d]/80 p-5 md:p-6 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-xl transition-all hover:scale-[1.02] cursor-default flex flex-col items-center text-center">
                    <div className="p-3 bg-[#005A9C]/10 dark:bg-blue-500/10 rounded-2xl text-[#005A9C] dark:text-blue-400 mb-2">
                        <School size={24} />
                    </div>
                    <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">TOTAL DE UNIDADES</p>
                    <h3 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white">{totalUnidades}</h3>
                </div>

                {/* Informaram Recebimento */}
                <div className="bg-white dark:bg-[#1e1e2d]/80 p-5 md:p-6 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-xl transition-all hover:scale-[1.02] cursor-default flex flex-col items-center text-center">
                    <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-600 dark:text-emerald-400 mb-2">
                        <Package size={24} />
                    </div>
                    <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">INFORMARAM RECEBIMENTO</p>
                    <h3 className="text-2xl md:text-3xl font-black text-emerald-600 dark:text-emerald-400">{informaramRecebimento}</h3>
                </div>

                {/* Concluído */}
                <div className="bg-white dark:bg-[#1e1e2d]/80 p-5 md:p-6 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-xl transition-all hover:scale-[1.02] cursor-default flex flex-col items-center text-center">
                    <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-600 dark:text-blue-400 mb-2">
                        <CheckCircle2 size={24} />
                    </div>
                    <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">CONCLUÍDO</p>
                    <h3 className="text-2xl md:text-3xl font-black text-blue-600 dark:text-blue-400">{concluidos}</h3>
                </div>

                {/* Pendente */}
                <div className="bg-white dark:bg-[#1e1e2d]/80 p-5 md:p-6 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-xl transition-all hover:scale-[1.02] cursor-default flex flex-col items-center text-center">
                    <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-600 dark:text-amber-400 mb-2">
                        <Clock size={24} />
                    </div>
                    <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">PENDENTE</p>
                    <h3 className="text-2xl md:text-3xl font-black text-amber-600 dark:text-amber-400">{pendentes}</h3>
                </div>
            </div>

            {/* Filters Toolbar */}
            <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 bg-white/60 dark:bg-zinc-900/40 backdrop-blur-md p-4 rounded-[2.5rem] border border-white/20 dark:border-white/5 shadow-sm">
                <div className="flex flex-col md:flex-row items-center gap-3 flex-1">
                    {/* Label Filtrar e Ano */}
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="flex items-center gap-2 px-2">
                            <Search size={16} className="text-[#005A9C] dark:text-blue-400 opacity-60" />
                            <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em]">FILTRAR</span>
                        </div>
                        
                        <div className="h-12 bg-zinc-100/80 dark:bg-white/5 px-4 rounded-2xl flex items-center gap-3 border border-zinc-200/50 dark:border-white/5 flex-1 md:flex-none">
                            <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">ANO</span>
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(Number(e.target.value))}
                                className="bg-transparent border-none p-0 text-xs font-bold text-[#005A9C] dark:text-blue-400 focus:ring-0 cursor-pointer hover:opacity-80 transition-opacity"
                            >
                                <option value={2026}>2026</option>
                                <option value={2025}>2025</option>
                                <option value={2024}>2024</option>
                            </select>
                        </div>
                    </div>

                    {/* Segmentos e Busca */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full flex-1">
                        <div className="h-12 bg-zinc-100/80 dark:bg-white/5 px-5 rounded-2xl flex items-center gap-3 border border-zinc-200/50 dark:border-white/5 w-full sm:w-auto md:min-w-[240px]">
                            <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest whitespace-nowrap">SEGMENTO</span>
                            <select
                                value={filterSegmento}
                                onChange={(e) => setFilterSegmento(e.target.value)}
                                className="bg-transparent border-none p-0 text-xs font-bold text-[#005A9C] dark:text-blue-400 focus:ring-0 cursor-pointer uppercase tracking-tight w-full"
                            >
                                <option value="todos">TODOS OS SEGMENTOS</option>
                                {SEGMENTOS_ENSINO.map(seg => (
                                    <option key={seg} value={seg}>
                                        {seg.replace('CONJUNTO UNIFORMA ESCOLAR ', '').replace('CONJUNTO UNIFORME ESCOLAR ', '')}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="relative h-12 bg-zinc-100/80 dark:bg-white/5 rounded-2xl border border-zinc-200/50 dark:border-white/5 w-full flex-1 group transition-all focus-within:ring-2 focus-within:ring-[#005A9C]/20">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-[#005A9C] transition-colors" size={16} />
                            <input
                                type="text"
                                placeholder="BUSCAR UNIDADE ESCOLAR..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-transparent border-none h-full w-full pl-11 pr-4 text-xs font-bold text-zinc-700 dark:text-zinc-200 placeholder-zinc-400 outline-none uppercase tracking-wide"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 mt-4 xl:mt-0">
                    {/* Status Toggle (Pill Selector) */}
                    <div className="flex-1 lg:flex-none p-1.5 bg-zinc-100/80 dark:bg-white/5 rounded-[1.25rem] border border-zinc-200/50 dark:border-white/5 flex items-center">
                        {[
                            { id: 'todos', label: 'TODOS' },
                            { id: 'concluido', label: 'CONCLUÍDOS' },
                            { id: 'pendente', label: 'PENDENTES' }
                        ].map(status => (
                            <button
                                key={status.id}
                                onClick={() => setFilterStatus(status.id as any)}
                                className={`flex-1 sm:flex-none px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 relative ${filterStatus === status.id
                                    ? 'bg-[#F59E0B] text-white shadow-lg shadow-amber-500/20 active:scale-95'
                                    : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'
                                    }`}
                            >
                                {status.label}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={fetchStatusInventario}
                        disabled={refreshing}
                        className="h-12 w-12 flex items-center justify-center bg-[#005A9C] dark:bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-90 disabled:opacity-50 shrink-0"
                        title="Atualizar dados"
                    >
                        <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-white dark:bg-[#1e1e2d] border border-gray-100 dark:border-white/5 rounded-[2.5rem] overflow-hidden shadow-xl mt-6">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/80 dark:bg-white/5 border-b border-gray-100 dark:border-white/5">
                                <th className="px-10 py-6 text-[11px] font-black text-gray-500 uppercase tracking-widest">NOME DA ESCOLA</th>
                                <th className="px-10 py-6 text-[11px] font-black text-gray-500 uppercase tracking-widest text-center">ETAPAS ATENDIDAS</th>
                                <th className="px-10 py-6 text-[11px] font-black text-gray-500 uppercase tracking-widest text-center">STATUS</th>
                                <th className="px-10 py-6 text-[11px] font-black text-gray-500 uppercase tracking-widest text-right">AÇÕES</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-10 py-32 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <Loader2 className="animate-spin text-blue-500" size={40} />
                                            <p className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest animate-pulse">SINCRONIZANDO DADOS...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : escolasFiltradas.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-10 py-32 text-center">
                                        <div className="flex flex-col items-center gap-4 opacity-50 dark:opacity-30">
                                            <School size={80} className="text-gray-400 dark:text-gray-500" />
                                            <p className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tight">NENHUMA UNIDADE ENCONTRADA</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                escolasFiltradas.map((esc) => (
                                    <tr key={esc.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-5">
                                                <div className={`w-1.5 h-12 rounded-full transition-all group-hover:h-14 ${esc.jaLancou ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]'}`}></div>
                                                <div 
                                                    className="cursor-pointer hover:opacity-80 transition-all"
                                                    onClick={() => handleOpenModal(esc)}
                                                >
                                                    <p className="font-black text-zinc-900 dark:text-gray-100 text-base uppercase tracking-tight group-hover:text-[#005A9C] dark:group-hover:text-blue-400 transition-colors">{esc.nome}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-bold tracking-tight">{esc.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className="flex flex-wrap justify-center gap-2 max-w-md mx-auto">
                                                {esc.segmentos && esc.segmentos.map(seg => (
                                                    <span key={seg} className="px-3 py-1.5 bg-gray-100 dark:bg-zinc-800/80 text-gray-500 dark:text-gray-400 rounded-xl text-[9px] font-black uppercase tracking-widest border border-gray-200 dark:border-white/5 shadow-inner">
                                                        {seg.replace('CONJUNTO UNIFORMA ESCOLAR ', '')}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-10 py-8 text-center">
                                            {esc.jaLancou ? (
                                                <span className="inline-flex items-center px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                                                    <CheckCircle2 size={14} className="mr-2" /> CONCLUÍDO
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
                                                    <Clock size={14} className="mr-2" /> PENDENTE
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-10 py-8 text-right">
                                            <div className="flex flex-col items-end">
                                                <p className="text-sm font-black text-zinc-700 dark:text-gray-300 tabular-nums">
                                                    {esc.dataUltimoLancamento ? format(new Date(esc.dataUltimoLancamento), 'dd/MM/yyyy') : '-'}
                                                </p>
                                                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                                                    {esc.dataUltimoLancamento ? format(new Date(esc.dataUltimoLancamento), 'HH:mm') : ''}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer Actions */}
                <div className="bg-gray-50/50 dark:bg-white/5 px-10 py-8 flex flex-col md:flex-row items-center justify-between border-t border-gray-100 dark:border-white/5 gap-6">
                    <div className="flex items-center gap-10">
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">CONCLUÍDO</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">PENDENTE</span>
                        </div>
                        <p className="text-[10px] font-black text-gray-500 dark:text-gray-600 uppercase tracking-widest border-l border-gray-200 dark:border-white/10 pl-10">
                            MOSTRANDO {escolasFiltradas.length} DE {escolas.length} UNIDADES
                        </p>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <button
                            onClick={handleExportPDF}
                            className="flex-1 md:flex-none flex items-center justify-center gap-3 bg-[#DC2626] hover:bg-red-700 text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-red-600/20 active:scale-95"
                        >
                            <FileText size={18} /> PDF (RESUMO)
                        </button>
                        <button
                            onClick={handleExportDetailedPDF}
                            disabled={exportingAll}
                            className={`flex-1 md:flex-none flex items-center justify-center gap-3 ${exportingAll ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#0F766E] hover:bg-teal-700'} text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-teal-600/20 active:scale-95`}
                        >
                            {exportingAll ? <Loader2 className="animate-spin" size={18} /> : <FileText size={18} />}
                            {exportingAll ? 'GERANDO...' : 'PDF (DETALHADO)'}
                        </button>
                        <button
                            onClick={handleExportExcel}
                            className="flex-1 md:flex-none flex items-center justify-center gap-3 bg-[#16A34A] hover:bg-green-700 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-green-600/20 active:scale-95"
                        >
                            <Download size={18} /> EXPORTAR EXCEL
                        </button>
                    </div>
                </div>
            </div>

            <SchoolDetailModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                escola={selectedEscolaModal}
                registros={escolaRegistros}
                loading={loadingRecords}
                onExportPDF={handleExportModalPDF}
            />
        </div>
    );
};
