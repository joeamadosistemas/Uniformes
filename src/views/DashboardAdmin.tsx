import React, { useState, useEffect } from 'react';
import {
    Building2,
    AlertCircle,
    CheckCircle2,
    ClipboardList,
    Search,
    Shirt,
    BarChart3,
    Activity,
    PieChart as PieChartIcon,
    LineChart as LineChartIcon,
    Filter,
    RefreshCw,
    FileText
} from 'lucide-react';
import { useT } from '../lib/LanguageContext';
import { supabase } from '../lib/supabaseClient';
import { exportarDashboardPDF } from '../utils/exportUtils';
import { RECEBIMENTOS_MODELOS } from '../constants/recebimentosConstants';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LabelList, AreaChart, Area
} from 'recharts';
import { format, parseISO } from 'date-fns';

interface DashboardStats {
    totalEscolas: number;
    totalEntregas: number;
    totalModelos: number;
    informaram: number;
    pendentes: number;
    taxaAdesao: number;
    escolasInformaramList: any[];
    escolasPendentesList: any[];
    dataSegmento: any[];
    dataModelo: any[];
    dataEscola: any[];
    dataEvolucao: any[];
}

const CHART_COLORS = ['#3b82f6', '#10b981', '#fbbf24', '#f97316', '#8e8cd8', '#ec4899', '#14b8a6', '#f43f5e'];

const CustomYAxisTick = (props: any) => {
    const { x, y, payload } = props;
    const text = payload.value as string;
    const parts = text.split(' - ');
    const title = parts[0];
    const subtitle = parts.length > 1 ? parts[1] : '';

    return (
        <g transform={`translate(${x},${y})`}>
            <text x={0} y={-4} dy={0} textAnchor="end" fill="#4B5563" fontSize={11} fontWeight="bold" className="dark:fill-zinc-400">
                {title}
            </text>
            {subtitle && (
                <text x={0} y={10} dy={0} textAnchor="end" fill="#9CA3AF" fontSize={10} className="dark:fill-zinc-500">
                    {subtitle}
                </text>
            )}
        </g>
    );
};

export const DashboardAdmin: React.FC = () => {
    const { t } = useT();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'todos' | 'informaram' | 'faltam'>('todos');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedYear, setSelectedYear] = useState<number>(2026);
    const [selectedSegmento, setSelectedSegmento] = useState<string>('todos');

    // Modal de Exportação
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [exportFiltro, setExportFiltro] = useState<'todas' | 'unidade' | 'etapa'>('todas');
    const [exportEscolaSelecionada, setExportEscolaSelecionada] = useState('');
    const [exportEtapaSelecionada, setExportEtapaSelecionada] = useState('');
    const [exportando, setExportando] = useState(false);
    const [todasEscolasExport, setTodasEscolasExport] = useState<any[]>([]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            // Fetch relevant data in parallel
            const [
                { data: escolasData },
                { data: recebimentosData },
                { data: estoqueData }
            ] = await Promise.all([
                supabase.from('escolas').select('*').eq('ativo', true).order('nome'),
                supabase.from('recebimentos').select('*'),
                supabase.from('uniformes_catalogo').select('quantidade')
            ]);

            const escolas = escolasData || [];
            setTodasEscolasExport(escolas);
            const recebimentos = recebimentosData || [];

            // 1. Basic KPIs
            const totalEscolas = escolas.length;
            const totalEntregas = recebimentos.length;
            const totalModelos = (estoqueData || []).length;

            // Escolas informaram
            const escolasInformaramValores = new Set(recebimentos.map(r => r.escola?.toLowerCase().trim()));

            const escolasInformaramList = escolas.filter(e =>
                escolasInformaramValores.has(e.nome?.toLowerCase().trim()) ||
                (e.email && escolasInformaramValores.has(e.email?.toLowerCase().trim()))
            );

            const informaram = escolasInformaramList.length;
            const pendentes = totalEscolas - informaram;
            const taxaAdesao = totalEscolas > 0 ? (informaram / totalEscolas) * 100 : 0;

            const escolasPendentesList = escolas.filter(e => !escolasInformaramList.some(inf => inf.id === e.id));

            // 2. Charts Data Processing
            // A) Segment Distribution
            const distSegmentoMap: Record<string, number> = {};
            recebimentos.forEach(r => {
                const escola = escolas.find(e =>
                    e.nome?.toLowerCase().trim() === r.escola?.toLowerCase().trim() ||
                    (e.email && e.email?.toLowerCase().trim() === r.escola?.toLowerCase().trim())
                );
                let seg = 'Outros';
                if (escola && escola.segmentos && escola.segmentos.length > 0) {
                    seg = escola.segmentos[0].replace('CONJUNTO UNIFORMA ESCOLAR ', '').replace('CONJUNTO UNIFORME ESCOLAR ', '');
                }
                distSegmentoMap[seg] = (distSegmentoMap[seg] || 0) + (r.quantidade || 0);
            });
            const dataSegmento = Object.entries(distSegmentoMap)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value);

            // B) Model Distribution (Top 5)
            const distModeloMap: Record<string, number> = {};
            recebimentos.forEach(r => {
                const modeloName = r.modelo_nome || 'Desconhecido';
                distModeloMap[modeloName] = (distModeloMap[modeloName] || 0) + (r.quantidade || 0);
            });
            const dataModelo = Object.entries(distModeloMap)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value)
                .slice(0, 5);

            // C) By School (Top 10)
            const distEscolaMap: Record<string, number> = {};
            recebimentos.forEach(r => {
                const escola = escolas.find(e =>
                    e.nome?.toLowerCase().trim() === r.escola?.toLowerCase().trim() ||
                    (e.email && e.email?.toLowerCase().trim() === r.escola?.toLowerCase().trim())
                );
                const nomeDisplay = escola ? escola.nome : r.escola;
                distEscolaMap[nomeDisplay] = (distEscolaMap[nomeDisplay] || 0) + (r.quantidade || 0);
            });
            const dataEscola = Object.entries(distEscolaMap)
                .map(([name, value]) => ({ name: name.substring(0, 15) + '...', fullName: name, value }))
                .sort((a, b) => b.value - a.value)
                .slice(0, 10);

            // D) Time Evolution
            const sortedRecebimentos = [...recebimentos].sort((a, b) => new Date(a.data_recebimento).getTime() - new Date(b.data_recebimento).getTime());
            const evMap = new Map<string, number>();
            sortedRecebimentos.forEach(r => {
                const label = format(parseISO(r.data_recebimento), 'dd/MM/yy');
                evMap.set(label, (evMap.get(label) || 0) + (r.quantidade || 0));
            });
            const dataEvolucao = Array.from(evMap, ([name, value]) => ({ name, value }));

            setStats({
                totalEscolas,
                totalEntregas,
                totalModelos,
                informaram,
                pendentes,
                taxaAdesao,
                escolasInformaramList,
                escolasPendentesList,
                dataSegmento,
                dataModelo,
                dataEscola,
                dataEvolucao
            });

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !stats) {
        return (
            <div className="flex flex-col items-center justify-center h-96 space-y-4">
                <Activity size={48} className="text-blue-500 animate-pulse" />
                <p className="text-gray-500 font-medium">Carregando painel logístico...</p>
            </div>
        );
    }

    const handleExportPDF = async () => {
        setExportando(true);
        try {
            const { data: recebimentosData } = await supabase.from('recebimentos').select('*');
            const recebimentos = recebimentosData || [];

            const escolas = todasEscolasExport;

            const { data: modelosData } = await supabase.from('modelos_recebimento').select('*');
            const customModelos = modelosData || [];

            const mappedModelos = customModelos.map((m: any) => ({
                id: m.id,
                nome: m.nome,
                descricao: m.descricao,
                tamanhos: Array.isArray(m.tamanhos) ? m.tamanhos : m.tamanhos.split(',').map((t: string) => t.trim()),
                segmentos: Array.isArray(m.segmentos) ? m.segmentos : m.segmentos.split(',').map((s: string) => s.trim())
            }));

            const todosModelos = [...mappedModelos];
            RECEBIMENTOS_MODELOS.forEach(rm => {
                if (!mappedModelos.some(m => m.id === rm.id)) {
                    todosModelos.push(rm);
                }
            });

            let escolasFiltradas = escolas;
            let tituloPDF = 'Todas as Unidades Escolares';

            if (exportFiltro === 'unidade' && exportEscolaSelecionada) {
                escolasFiltradas = escolas.filter(e => e.nome === exportEscolaSelecionada);
                tituloPDF = `Unidade: ${exportEscolaSelecionada}`;
            } else if (exportFiltro === 'etapa' && exportEtapaSelecionada) {
                // Filtramos se a etapa estritamente estiver nos segmentos dessa escola
                escolasFiltradas = escolas.filter(e => e.segmentos && e.segmentos.includes(exportEtapaSelecionada));
                const eName = exportEtapaSelecionada.replace('CONJUNTO UNIFORMA ESCOLAR ', '').replace('CONJUNTO UNIFORME ESCOLAR ', '');
                tituloPDF = `Etapa Atendida: ${eName}`;
            }

            const escolasTarget = escolasFiltradas.map(e => ({ nome: e.nome, email: e.email }));
            const recTarget = recebimentos.filter(r => escolasFiltradas.some(e =>
                e.nome?.toLowerCase().trim() === r.escola?.toLowerCase().trim() ||
                (e.email && e.email?.toLowerCase().trim() === r.escola?.toLowerCase().trim())
            ));

            exportarDashboardPDF(recTarget, escolasTarget, todosModelos, tituloPDF);
            setIsExportModalOpen(false);
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            alert('Falha ao gerar o PDF. Verifique a conexão com o banco de dados.');
        } finally {
            setExportando(false);
        }
    };

    // Segmentos únicos para o select de opções
    const todosOsSegmentos = Array.from(new Set(todasEscolasExport.flatMap(e => e.segmentos || []))).filter(Boolean);

    return (
        <div className="space-y-8 pb-20 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-[#005A9C] dark:text-[#66b3ff] flex items-center gap-2">
                        <BarChart3 size={28} />
                        Painel Logístico Avançado
                    </h2>
                    <p className="text-sm text-gray-500 font-medium">{t.dashboard.subtitulo}</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsExportModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-2.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-xl shadow-[0_4px_14px_0_rgba(220,38,38,0.39)] transition-all font-black uppercase tracking-widest text-xs active:scale-95"
                    >
                        <FileText size={18} />
                        Gerar PDF
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
                {/* Entregas Realizadas */}
                <div className="bg-[#005A9C] dark:bg-blue-600/20 dark:backdrop-blur-xl p-4 md:p-5 rounded-[2rem] shadow-lg shadow-blue-500/10 border border-transparent dark:border-white/5 relative overflow-hidden flex flex-col items-center text-center">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-bl-full -z-10"></div>
                    <div className="p-2.5 bg-white/20 dark:bg-blue-500/20 text-white dark:text-blue-400 rounded-2xl mb-2 relative z-10">
                        <ClipboardList size={20} className="md:w-5 md:h-5" />
                    </div>
                    <p className="text-[9px] md:text-xs font-black text-white/80 dark:text-zinc-500 uppercase tracking-widest mb-1 relative z-10">Entregas</p>
                    <h4 className="text-xl md:text-3xl font-black text-white relative z-10">{stats.totalEntregas.toLocaleString('pt-BR')}</h4>
                </div>

                {/* Modelos de Uniformes */}
                <div className="bg-white dark:bg-zinc-900/40 dark:backdrop-blur-xl p-4 md:p-5 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm dark:shadow-2xl dark:shadow-black/20 flex flex-col items-center text-center transition-all hover:scale-[1.02] cursor-default">
                    <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl mb-2">
                        <Shirt size={20} className="md:w-5 md:h-5" />
                    </div>
                    <p className="text-[9px] md:text-xs font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Modelos</p>
                    <h4 className="text-xl md:text-3xl font-black text-gray-800 dark:text-white">{stats.totalModelos.toLocaleString('pt-BR')}</h4>
                </div>

                {/* Taxa Distribuição */}
                <div className="bg-white dark:bg-zinc-900/40 dark:backdrop-blur-xl p-4 md:p-5 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm dark:shadow-2xl dark:shadow-black/20 flex flex-col items-center text-center transition-all hover:scale-[1.02] cursor-default">
                    <div className="p-2.5 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-2xl mb-2">
                        <Activity size={20} className="md:w-5 md:h-5" />
                    </div>
                    <p className="text-[9px] md:text-xs font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Adesão</p>
                    <div className="flex items-baseline gap-1">
                        <h4 className="text-xl md:text-3xl font-black text-gray-800 dark:text-white">{stats.taxaAdesao.toFixed(1)}</h4>
                        <span className="text-[10px] font-bold text-gray-400 dark:text-zinc-500">%</span>
                    </div>
                </div>

                {/* Escolas Informaram */}
                <div className="bg-white dark:bg-zinc-900/40 dark:backdrop-blur-xl p-4 md:p-5 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm dark:shadow-2xl dark:shadow-black/20 flex flex-col items-center text-center transition-all hover:scale-[1.02] cursor-default">
                    <div className="p-2.5 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-2xl mb-2">
                        <CheckCircle2 size={20} className="md:w-5 md:h-5" />
                    </div>
                    <p className="text-[9px] md:text-xs font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Concluído</p>
                    <h4 className="text-xl md:text-3xl font-black text-green-600 dark:text-green-400">{stats.informaram}</h4>
                </div>

                {/* Escolas Pendentes */}
                <div className="bg-white dark:bg-zinc-900/40 dark:backdrop-blur-xl p-4 md:p-5 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm dark:shadow-2xl dark:shadow-black/20 flex flex-col items-center text-center transition-all hover:scale-[1.02] cursor-default col-span-2 md:col-span-1">
                    <div className="p-2.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-2xl mb-2">
                        <AlertCircle size={20} className="md:w-5 md:h-5" />
                    </div>
                    <p className="text-[9px] md:text-xs font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Pendente</p>
                    <h4 className="text-xl md:text-3xl font-black text-red-600 dark:text-red-400">{stats.pendentes}</h4>
                </div>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Pie Chart: Segmento */}
                <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                    <h3 className="text-lg font-bold text-[#005A9C] dark:text-[#66b3ff] flex items-center gap-2 mb-6">
                        <PieChartIcon size={22} />
                        Uniformes por Segmento
                    </h3>
                    <div className="h-64 w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.dataSegmento}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={95}
                                    stroke="none"
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {stats.dataSegmento.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip
                                    formatter={(value: any) => value.toLocaleString('pt-BR')}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    {/* Pie Chart Custom Legend */}
                    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 mt-4">
                        {stats.dataSegmento.map((entry, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}></div>
                                <span className="text-xs text-gray-600 dark:text-zinc-400 font-medium">{entry.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bar Chart: Tipo Uniforme */}
                <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                    <h3 className="text-lg font-bold text-[#005A9C] dark:text-[#66b3ff] flex items-center gap-2 mb-6">
                        <Shirt size={22} />
                        Top 5 Modelos Distribuídos
                    </h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.dataModelo} layout="vertical" margin={{ left: 0, right: 30, top: 0, bottom: 0 }} barSize={32}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E5E7EB" opacity={0.5} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={130} tick={<CustomYAxisTick />} axisLine={false} tickLine={false} />
                                <RechartsTooltip
                                    cursor={{ fill: 'rgba(0, 90, 156, 0.05)' }}
                                    formatter={(value: any) => value.toLocaleString('pt-BR')}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                                    {stats.dataModelo.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                    ))}
                                    <LabelList dataKey="value" position="insideRight" fill="#FFFFFF" fontSize={14} fontWeight="bold" offset={16} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    {/* Top Models Custom Legend */}
                    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 mt-4">
                        {stats.dataModelo.map((entry, index) => {
                            const type = entry.name.split(' - ')[1] || 'Unissex';
                            return (
                                <div key={index} className="flex items-center gap-2">
                                    <div className="w-5 h-2.5 rounded-[4px]" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}></div>
                                    <span className="text-[11px] text-gray-500 dark:text-zinc-400 font-medium tracking-wide">{type}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Area Chart: Evolução */}
                <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                    <h3 className="text-lg font-bold text-[#005A9C] dark:text-[#66b3ff] flex items-center gap-2 mb-6">
                        <LineChartIcon size={22} />
                        Evolução de Entregas
                    </h3>
                    <div className="h-64 w-full mt-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.dataEvolucao} margin={{ left: -20, bottom: 5, top: 10, right: 10 }}>
                                <defs>
                                    <linearGradient id="colorEvolucao" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.5} />
                                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} dy={10} />
                                <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                                <RechartsTooltip
                                    formatter={(value: any) => value.toLocaleString('pt-BR')}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorEvolucao)" activeDot={{ r: 8, strokeWidth: 0, fill: '#3b82f6' }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Bar Chart: Por Escola */}
                <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                    <h3 className="text-lg font-bold text-[#005A9C] dark:text-[#66b3ff] flex items-center gap-2 mb-6">
                        <Building2 size={22} />
                        Top 10 Escolas Recebedoras
                    </h3>
                    <div className="h-64 w-full mt-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.dataEscola} margin={{ left: -20, bottom: 20, right: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.5} />
                                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#6B7280' }} angle={-45} textAnchor="end" height={60} axisLine={false} tickLine={false} dy={5} />
                                <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                                <RechartsTooltip
                                    formatter={(value: any) => value.toLocaleString('pt-BR')}
                                    labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                                />
                                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={24}>
                                    {stats.dataEscola.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Toolbar Central - Novo Design */}
            <div className="flex flex-col items-center justify-center mb-10 mt-12">

                {/* Linha 1: Filtro de Segmentos */}
                <div className="flex items-center gap-2 mb-4">
                    <Filter className="text-gray-400 w-4 h-4" />
                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Filtrar</span>
                    <select
                        value={selectedSegmento}
                        onChange={(e) => setSelectedSegmento(e.target.value)}
                        className="bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-xl px-4 py-2 text-xs font-black text-gray-700 dark:text-zinc-300 uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-[#005A9C] transition-all cursor-pointer"
                    >
                        <option value="todos">Segmentos: Todos</option>
                        {todosOsSegmentos.map((s, idx) => {
                            const label = (s as string).replace('CONJUNTO UNIFORMA ESCOLAR ', '').replace('CONJUNTO UNIFORME ESCOLAR ', '');
                            return <option key={idx} value={s as string}>{label}</option>;
                        })}
                    </select>
                </div>

                {/* Linha 2: Ano, Busca, Tabs */}
                <div className="flex flex-wrap items-center justify-center gap-4">

                    {/* Ano */}
                    <div className="flex items-center gap-2 bg-gray-50 dark:bg-zinc-800 rounded-[24px] px-6 py-3 border border-gray-100 dark:border-zinc-700 shadow-sm">
                        <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Ano:</span>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            className="bg-transparent border-none p-0 text-sm font-black text-[#005A9C] dark:text-[#66b3ff] focus:ring-0 cursor-pointer outline-none"
                        >
                            <option value={2026}>2026</option>
                            <option value={2025}>2025</option>
                            <option value={2024}>2024</option>
                        </select>
                    </div>

                    {/* Busca */}
                    <div className="relative flex items-center bg-gray-50 dark:bg-zinc-800 rounded-[24px] px-4 py-3 border border-gray-100 dark:border-zinc-700 shadow-sm w-48 transition-all focus-within:w-64 focus-within:ring-2 focus-within:ring-[#005A9C]/50">
                        <Search className="text-gray-400 mr-2" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-transparent border-none p-0 w-full text-sm text-gray-700 dark:text-zinc-300 placeholder-gray-400 outline-none"
                        />
                    </div>

                    {/* Tabs Todo/Concluido/Pendente */}
                    <div className="flex items-center bg-gray-50 dark:bg-zinc-800 rounded-[24px] p-1 border border-gray-100 dark:border-zinc-700 shadow-sm">
                        <button
                            onClick={() => setActiveTab('todos')}
                            className={`px-6 py-2 rounded-[20px] text-xs font-black uppercase tracking-wider transition-all duration-300 ${activeTab === 'todos' ? 'bg-[#D97706] text-white shadow-md' : 'text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300'}`}
                        >
                            Todos
                        </button>
                        <button
                            onClick={() => setActiveTab('informaram')}
                            className={`px-6 py-2 rounded-[20px] text-xs font-black uppercase tracking-wider transition-all duration-300 ${activeTab === 'informaram' ? 'bg-[#D97706] text-white shadow-md' : 'text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300'}`}
                        >
                            Concluído
                        </button>
                        <button
                            onClick={() => setActiveTab('faltam')}
                            className={`px-6 py-2 rounded-[20px] text-xs font-black uppercase tracking-wider transition-all duration-300 ${activeTab === 'faltam' ? 'bg-[#D97706] text-white shadow-md' : 'text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300'}`}
                        >
                            Pendente
                        </button>
                    </div>

                </div>

                {/* Linha 3: Refresh */}
                <div className="flex items-center justify-center gap-3 mt-6">
                    <button
                        onClick={fetchDashboardData}
                        className="p-3 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 border border-gray-100 dark:border-zinc-700 text-gray-600 rounded-2xl shadow-sm transition-all active:scale-95 flex items-center justify-center"
                        title="Atualizar Dados"
                    >
                        <RefreshCw size={22} className={loading ? "animate-spin text-[#005A9C]" : ""} />
                    </button>
                </div>
            </div>

            {/* School Detailing Table */}
            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-zinc-800/50">
                                <th className="px-6 md:px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.escolas.nomeEscola}</th>
                                <th className="px-6 md:px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Etapas Atendidas</th>
                                <th className="px-6 md:px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">{t.common.status}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-zinc-800 text-sm">
                            {(activeTab === 'todos' ? stats.escolasInformaramList.concat(stats.escolasPendentesList) : (activeTab === 'informaram' ? stats.escolasInformaramList : stats.escolasPendentesList))
                                .filter(e => e.nome.toLowerCase().includes(searchTerm.toLowerCase()))
                                .filter(e => selectedSegmento === 'todos' || (e.segmentos && e.segmentos.includes(selectedSegmento)))
                                .sort((a, b) => a.nome.localeCompare(b.nome))
                                .map(esc => {
                                    const jaInformou = stats?.escolasInformaramList.some(i => i.id === esc.id);

                                    return (
                                        <tr key={esc.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                                            <td className="px-6 md:px-8 py-4">
                                                <div className="flex items-center space-x-3">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${jaInformou ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                                        <Building2 size={16} />
                                                    </div>
                                                    <span className="font-bold text-gray-700 dark:text-zinc-300">{esc.nome}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 md:px-8 py-4 text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                                                {esc.segmentos && esc.segmentos.length > 0 ? esc.segmentos.map((s: string) => s.replace('CONJUNTO UNIFORMA ESCOLAR ', '').replace('CONJUNTO UNIFORME ESCOLAR ', '')).join(', ') : '-'}
                                            </td>
                                            <td className="px-6 md:px-8 py-4 text-right">
                                                {jaInformou ? (
                                                    <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black rounded-lg uppercase tracking-wider border border-emerald-100/50">
                                                        Concluído
                                                    </span>
                                                ) : (
                                                    <span className="px-3 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-[10px] font-black rounded-lg uppercase tracking-wider border border-amber-100/50">
                                                        Pendente
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            {((activeTab === 'todos' ? stats.escolasInformaramList.concat(stats.escolasPendentesList) : (activeTab === 'informaram' ? stats.escolasInformaramList : stats.escolasPendentesList))
                                .filter(e => e.nome.toLowerCase().includes(searchTerm.toLowerCase()))
                                .filter(e => selectedSegmento === 'todos' || (e.segmentos && e.segmentos.includes(selectedSegmento)))
                                .length === 0) && (
                                    <tr>
                                        <td colSpan={3} className="px-8 py-16 text-center text-gray-400 font-medium tracking-wide">
                                            Nenhuma escola encontrada para os filtros selecionados.
                                        </td>
                                    </tr>
                                )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de Exportação */}
            {isExportModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden shadow-black/20 transform transition-all">
                        <div className="p-6 border-b border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/50 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-[#005A9C] dark:text-[#66b3ff] flex items-center gap-2">
                                <ClipboardList size={22} />
                                Exportar Relatório de Solicitações
                            </h3>
                            <button
                                onClick={() => setIsExportModalOpen(false)}
                                className="text-gray-400 hover:text-red-500 transition-colors p-1"
                            >
                                <AlertCircle size={20} className="rotate-45 relative right-[1px]" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 dark:text-zinc-300">Tipo de Relatório</label>
                                <select
                                    value={exportFiltro}
                                    onChange={(e) => setExportFiltro(e.target.value as any)}
                                    className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#005A9C] focus:border-transparent outline-none transition-all dark:text-white"
                                >
                                    <option value="todas">Todas as Unidades Escolares</option>
                                    <option value="unidade">Por Unidade Escolar</option>
                                    <option value="etapa">Por Etapas Atendidas (Segmentos)</option>
                                </select>
                            </div>

                            {exportFiltro === 'unidade' && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                    <label className="text-sm font-bold text-gray-700 dark:text-zinc-300">Selecione a Unidade</label>
                                    <select
                                        value={exportEscolaSelecionada}
                                        onChange={(e) => setExportEscolaSelecionada(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#005A9C] focus:border-transparent outline-none transition-all dark:text-white"
                                    >
                                        <option value="">Selecione uma escola...</option>
                                        {todasEscolasExport.map(e => (
                                            <option key={e.id} value={e.nome}>{e.nome}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {exportFiltro === 'etapa' && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                    <label className="text-sm font-bold text-gray-700 dark:text-zinc-300">Selecione a Etapa Atendida</label>
                                    <select
                                        value={exportEtapaSelecionada}
                                        onChange={(e) => setExportEtapaSelecionada(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#005A9C] focus:border-transparent outline-none transition-all dark:text-white"
                                    >
                                        <option value="">Selecione um segmento...</option>
                                        {todosOsSegmentos.map((s, idx) => {
                                            const label = (s as string).replace('CONJUNTO UNIFORMA ESCOLAR ', '').replace('CONJUNTO UNIFORME ESCOLAR ', '');
                                            return <option key={idx} value={s as string}>{label}</option>;
                                        })}
                                    </select>
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/30 flex justify-end gap-3">
                            <button
                                onClick={() => setIsExportModalOpen(false)}
                                className="px-5 py-2.5 rounded-xl font-bold text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                                disabled={exportando}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleExportPDF}
                                disabled={exportando || (exportFiltro === 'unidade' && !exportEscolaSelecionada) || (exportFiltro === 'etapa' && !exportEtapaSelecionada)}
                                className="flex items-center gap-2 px-6 py-2.5 bg-[#005A9C] hover:bg-[#004a80] text-white rounded-xl shadow-lg shadow-[#005A9C]/20 transition-all font-bold active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {exportando ? (
                                    <>Aguarde, processando e gerando PDF...</>
                                ) : (
                                    <>Baixar Relatório em PDF</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
