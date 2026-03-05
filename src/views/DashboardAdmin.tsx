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
    LineChart as LineChartIcon
} from 'lucide-react';
import { useT } from '../lib/LanguageContext';
import { supabase } from '../lib/supabaseClient';
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
    const [activeTab, setActiveTab] = useState<'informaram' | 'faltam'>('informaram');
    const [searchTerm, setSearchTerm] = useState('');

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
                supabase.from('escolas').select('*').eq('ativo', true),
                supabase.from('recebimentos').select('*'),
                supabase.from('uniformes_catalogo').select('quantidade')
            ]);

            const escolas = escolasData || [];
            const recebimentos = recebimentosData || [];

            // 1. Basic KPIs
            const totalEscolas = escolas.length;
            const totalEntregas = recebimentos.length;
            const totalModelos = (estoqueData || []).length;

            // Escolas informaram
            const escolasInformaramNomes = new Set(recebimentos.map(r => r.escola));
            const informaram = escolasInformaramNomes.size;
            const pendentes = totalEscolas - informaram;
            const taxaAdesao = totalEscolas > 0 ? (informaram / totalEscolas) * 100 : 0;

            const escolasInformaramList = escolas.filter(e => escolasInformaramNomes.has(e.nome));
            const escolasPendentesList = escolas.filter(e => !escolasInformaramNomes.has(e.nome));

            // 2. Charts Data Processing
            // A) Segment Distribution
            const distSegmentoMap: Record<string, number> = {};
            recebimentos.forEach(r => {
                const escola = escolas.find(e => e.nome === r.escola);
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
                distEscolaMap[r.escola] = (distEscolaMap[r.escola] || 0) + (r.quantidade || 0);
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

    return (
        <div className="space-y-8 pb-20 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-black text-[#005A9C] dark:text-[#66b3ff] flex items-center gap-2">
                    <BarChart3 size={28} />
                    Painel Logístico Avançado
                </h2>
                <p className="text-sm text-gray-500 font-medium">{t.dashboard.subtitulo}</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {/* Entregas Realizadas */}
                <div className="bg-[#005A9C] dark:bg-[#1452b5] p-5 rounded-3xl shadow-lg shadow-blue-500/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-bl-full -z-10"></div>
                    <div className="flex items-center space-x-3 mb-2">
                        <div className="p-2 bg-white/20 text-white rounded-xl shadow-inner relative z-10">
                            <ClipboardList className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-bold text-white/80 uppercase tracking-widest relative z-10">Entregas Feitas</p>
                    </div>
                    <h4 className="text-3xl font-black text-white relative z-10">{stats.totalEntregas.toLocaleString('pt-BR')}</h4>
                </div>

                {/* Modelos de Uniformes */}
                <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-5 rounded-3xl shadow-sm relative overflow-hidden">
                    <div className="flex items-center space-x-3 mb-2">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl relative z-10">
                            <Shirt className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest relative z-10">Und. de Modelos</p>
                    </div>
                    <h4 className="text-3xl font-black text-gray-800 dark:text-white relative z-10">{stats.totalModelos.toLocaleString('pt-BR')}</h4>
                </div>

                {/* Taxa Distribuição */}
                <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-5 rounded-3xl shadow-sm relative overflow-hidden">
                    <div className="flex items-center space-x-3 mb-2">
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-xl relative z-10">
                            <Activity className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest relative z-10">Taxa na Rede</p>
                    </div>
                    <div className="flex items-end gap-2 relative z-10">
                        <h4 className="text-3xl font-black text-gray-800 dark:text-white">{stats.taxaAdesao.toFixed(1)}%</h4>
                        <span className="text-xs text-gray-400 mb-1">Adesão</span>
                    </div>
                </div>

                {/* Escolas Informaram */}
                <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30 p-5 rounded-3xl shadow-sm relative overflow-hidden">
                    <div className="flex items-center space-x-3 mb-2">
                        <div className="p-2 bg-white text-emerald-600 rounded-xl shadow-sm relative z-10">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest relative z-10">Informaram</p>
                    </div>
                    <h4 className="text-3xl font-black text-emerald-800 dark:text-emerald-300 relative z-10">{stats.informaram}</h4>
                    <p className="text-[10px] text-emerald-600 mt-1 relative z-10 flex items-center gap-1">
                        de {stats.totalEscolas} unidades
                    </p>
                </div>

                {/* Escolas Pendentes */}
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 p-5 rounded-3xl shadow-sm relative overflow-hidden">
                    <div className="flex items-center space-x-3 mb-2">
                        <div className="p-2 bg-white text-red-600 rounded-xl shadow-sm relative z-10">
                            <AlertCircle className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-widest relative z-10">Pendentes</p>
                    </div>
                    <h4 className="text-3xl font-black text-red-800 dark:text-red-300 relative z-10">{stats.pendentes}</h4>
                    <p className="text-[10px] text-red-600 mt-1 relative z-10 flex items-center gap-1">
                        Requer atenção
                    </p>
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

            {/* School Detailing Table */}
            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden mt-8">
                <div className="border-b border-gray-50 dark:border-zinc-800 px-6 md:px-8 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setActiveTab('informaram')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'informaram' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            <CheckCircle2 size={16} />
                            {t.dashboard.jaInformaram} ({stats.escolasInformaramList.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('faltam')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'faltam' ? 'bg-red-50 text-red-600' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            <AlertCircle size={16} />
                            {t.dashboard.faltamInformar} ({stats.escolasPendentesList.length})
                        </button>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder={t.escolas.buscarEscola}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-gray-50 dark:bg-zinc-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-[#005A9C] outline-none w-full md:w-64 transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-zinc-800/50">
                                <th className="px-6 md:px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.escolas.nomeEscola}</th>
                                <th className="px-6 md:px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.dashboard.contatoEmail}</th>
                                <th className="px-6 md:px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">{t.common.status}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-zinc-800 text-sm">
                            {(activeTab === 'informaram' ? stats.escolasInformaramList : stats.escolasPendentesList)
                                .filter(e => e.nome.toLowerCase().includes(searchTerm.toLowerCase()))
                                .map(esc => (
                                    <tr key={esc.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                                        <td className="px-6 md:px-8 py-4">
                                            <div className="flex items-center space-x-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activeTab === 'informaram' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
                                                    <Building2 size={16} />
                                                </div>
                                                <span className="font-bold text-gray-700 dark:text-zinc-300">{esc.nome}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 md:px-8 py-4 text-gray-500 dark:text-zinc-400">{esc.email}</td>
                                        <td className="px-6 md:px-8 py-4 text-right">
                                            {activeTab === 'informaram' ? (
                                                <span className="px-3 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-[10px] font-black rounded-lg uppercase tracking-wider">
                                                    Recebido
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-[10px] font-black rounded-lg uppercase tracking-wider">
                                                    Pendente
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            {((activeTab === 'informaram' ? stats.escolasInformaramList : stats.escolasPendentesList).filter(e => e.nome.toLowerCase().includes(searchTerm.toLowerCase())).length === 0) && (
                                <tr>
                                    <td colSpan={3} className="px-8 py-16 text-center text-gray-400 font-medium">
                                        Nenhuma escola encontrada para esta pesquisa.
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
