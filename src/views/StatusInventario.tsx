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
import { exportarControleRecebimentoPDF } from '../utils/exportUtils';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

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
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6 bg-gray-200 dark:bg-[#1e1e2d]/40 p-6 rounded-[2.5rem] border border-gray-300 dark:border-white/5 shadow-inner">
                <div className="flex flex-wrap items-center gap-4">
                    {/* Label Filtrar */}
                    <div className="flex items-center gap-2">
                        <Search size={18} className="text-gray-500" />
                        <span className="text-[11px] font-black text-gray-500 uppercase tracking-widest">FILTRAR</span>
                    </div>

                    {/* Ano Letivo */}
                    <div className="bg-gray-400 dark:bg-zinc-800/50 px-5 py-3 rounded-2xl border border-transparent dark:border-white/5 flex items-center gap-2">
                        <span className="text-[10px] font-black text-gray-100 dark:text-gray-500 uppercase tracking-widest">ANO:</span>
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

                    {/* Segmentos */}
                    <div className="bg-gray-400 dark:bg-zinc-800/50 px-5 py-3 rounded-2xl border border-transparent dark:border-white/5 flex items-center gap-2 min-w-[200px]">
                        <span className="text-[10px] font-black text-gray-100 dark:text-gray-500 uppercase tracking-widest whitespace-nowrap">SEGMENTOS:</span>
                        <select
                            value={filterSegmento}
                            onChange={(e) => setFilterSegmento(e.target.value)}
                            className="bg-transparent border-none p-0 text-xs font-black text-[#005A9C] dark:text-[#66b3ff] focus:ring-0 cursor-pointer uppercase tracking-tight w-full"
                        >
                            <option value="todos">TODOS</option>
                            {SEGMENTOS_ENSINO.map(seg => (
                                <option key={seg} value={seg}>
                                    {seg.replace('CONJUNTO UNIFORMA ESCOLAR ', '').replace('CONJUNTO UNIFORME ESCOLAR ', '')}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Escola */}
                    <div className="relative bg-gray-400 dark:bg-zinc-800/50 rounded-2xl px-5 py-3 border border-transparent dark:border-white/5 w-64 focus-within:w-80 transition-all">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-200 dark:text-gray-500" size={16} />
                        <input
                            type="text"
                            placeholder="BUSCAR ESCOLA"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-transparent border-none p-0 pl-6 w-full text-xs font-bold text-gray-100 dark:text-gray-300 placeholder-gray-200 dark:placeholder-gray-500 outline-none uppercase"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Status Tabs */}
                    <div className="bg-gray-500 dark:bg-zinc-800/80 p-1 rounded-2xl border border-transparent dark:border-white/5 flex items-center">
                        {[
                            { id: 'todos', label: 'TODOS' },
                            { id: 'concluido', label: 'CONCLUÍDOS' },
                            { id: 'pendente', label: 'PENDENTES' }
                        ].map(status => (
                            <button
                                key={status.id}
                                onClick={() => setFilterStatus(status.id as any)}
                                className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${filterStatus === status.id
                                    ? 'bg-[#F59E0B] text-white shadow-lg shadow-amber-600/20'
                                    : 'text-gray-200 dark:text-gray-500 hover:text-white dark:hover:text-gray-300 hover:bg-white/10 dark:hover:bg-white/5'
                                    }`}
                            >
                                {status.label}
                            </button>
                        ))}
                    </div>

                    {/* Refresh */}
                    <button
                        onClick={fetchStatusInventario}
                        disabled={refreshing}
                        className="w-12 h-12 flex items-center justify-center bg-gray-400 dark:bg-zinc-800/80 rounded-2xl border border-transparent dark:border-white/5 text-gray-100 dark:text-gray-400 hover:text-white dark:hover:text-[#66b3ff] transition-all active:scale-95 disabled:opacity-50"
                    >
                        <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
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
                                                <div>
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
                            className="flex-1 md:flex-none flex items-center justify-center gap-3 bg-[#DC2626] hover:bg-red-700 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-red-600/20 active:scale-95"
                        >
                            <FileText size={18} /> EXPORTAR PDF
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
        </div>
    );
};
