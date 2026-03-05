import React, { useState, useEffect } from 'react';
import {
    History,
    Search,
    Filter,
    Eye,
    User,
    Calendar,
    Database,
    ChevronRight,
    ArrowRight,
    X
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useT } from '../lib/LanguageContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AuditLog {
    id: string;
    usuario_email: string;
    acao: string;
    tabela: string;
    registro_id: string;
    dados_antigos: any;
    dados_novos: any;
    timestamp: string;
}

export const AuditLogs: React.FC = () => {
    const { t } = useT();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [tableFilter, setTableFilter] = useState('all');
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

    const tables = ['all', 'recebimentos', 'transferencias', 'escolas', 'uniformes', 'profiles'];

    useEffect(() => {
        fetchLogs();
    }, [tableFilter]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('audit_logs')
                .select('*')
                .order('timestamp', { ascending: false })
                .limit(100);

            if (tableFilter !== 'all') {
                query = query.eq('tabela', tableFilter);
            }

            const { data, error } = await query;

            if (error) throw error;
            setLogs(data || []);
        } catch (error) {
            console.error('Erro ao buscar logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredLogs = logs.filter(log =>
    (log.usuario_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.acao.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const getActionColor = (acao: string) => {
        switch (acao) {
            case 'INSERT': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'UPDATE': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'DELETE': return 'bg-red-50 text-red-600 border-red-100';
            default: return 'bg-gray-50 text-gray-600 border-gray-100';
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-[#005A9C] dark:text-[#66b3ff] flex items-center gap-2">
                        <History size={28} />
                        {t.audit.titulo}
                    </h2>
                    <p className="text-sm text-gray-500 font-medium">{t.audit.subtitulo}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white dark:bg-zinc-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder={t.audit.buscarUsuario}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-zinc-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-[#005A9C] dark:text-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <select
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-zinc-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-[#005A9C] dark:text-white cursor-pointer appearance-none"
                        value={tableFilter}
                        onChange={(e) => setTableFilter(e.target.value)}
                    >
                        {tables.map(table => (
                            <option key={table} value={table}>
                                {table === 'all' ? t.audit.filtrarTabela : table}
                            </option>
                        ))}
                    </select>
                </div>

                <button
                    onClick={fetchLogs}
                    className="flex items-center justify-center gap-2 bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 py-2 rounded-xl text-sm font-bold transition-all"
                >
                    <Database size={18} />
                    Recarregar Logs
                </button>
            </div>

            {/* List */}
            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-zinc-800/50">
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.audit.usuario}</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.audit.acao}</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.audit.tabela}</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.audit.data}</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">{t.audit.detalhes}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-zinc-800">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="px-6 py-4">
                                            <div className="h-4 bg-gray-100 dark:bg-zinc-800 rounded w-full"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center text-gray-400 font-medium">
                                        {t.audit.semLogs}
                                    </td>
                                </tr>
                            ) : (
                                filteredLogs.map(log => (
                                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                                                    <User size={14} />
                                                </div>
                                                <span className="text-sm font-bold text-gray-700 dark:text-zinc-300 truncate max-w-[200px]" title={log.usuario_email}>
                                                    {log.usuario_email || 'Sistema / Anon'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black border ${getActionColor(log.acao)}`}>
                                                {log.acao}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 font-mono text-xs text-gray-500 uppercase">
                                                <Database size={12} className="text-gray-400" />
                                                {log.tabela}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                                                <Calendar size={12} className="text-gray-400" />
                                                {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => setSelectedLog(log)}
                                                className="p-2 text-gray-400 hover:text-[#005A9C] hover:bg-[#005A9C]/10 rounded-xl transition-all"
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Log Details Modal */}
            {selectedLog && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-zinc-900 w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-gray-100 dark:border-zinc-800">
                        <div className="p-6 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950/50">
                            <div className="flex items-center gap-3">
                                <span className={`px-3 py-1 rounded-full text-xs font-black border ${getActionColor(selectedLog.acao)}`}>
                                    {selectedLog.acao}
                                </span>
                                <h3 className="font-black text-gray-800 dark:text-white uppercase tracking-tight">
                                    Detalhes do Log - {selectedLog.tabela}
                                </h3>
                            </div>
                            <button onClick={() => setSelectedLog(null)} className="p-2 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-full transition-colors">
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 bg-gray-50 dark:bg-zinc-800 rounded-2xl border border-gray-100 dark:border-zinc-700">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t.audit.usuario}</p>
                                    <p className="text-sm font-bold text-gray-700 dark:text-zinc-200">{selectedLog.usuario_email || 'Sistema / Anônimo'}</p>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-zinc-800 rounded-2xl border border-gray-100 dark:border-zinc-700">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t.audit.data}</p>
                                    <p className="text-sm font-bold text-gray-700 dark:text-zinc-200">{format(new Date(selectedLog.timestamp), 'PPPp', { locale: ptBR })}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <ChevronRight size={14} className="text-[#005A9C]" />
                                        {t.audit.dadosAntigos}
                                    </h4>
                                    <div className="bg-zinc-100 dark:bg-black/40 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-x-auto">
                                        <pre className="text-[11px] text-gray-600 dark:text-zinc-400 font-mono">
                                            {selectedLog.dados_antigos ? JSON.stringify(selectedLog.dados_antigos, null, 2) : 'Nenhum dado'}
                                        </pre>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h4 className="text-xs font-black text-[#005A9C] uppercase tracking-widest flex items-center gap-2">
                                        <ArrowRight size={14} />
                                        {t.audit.dadosNovos}
                                    </h4>
                                    <div className="bg-blue-50/30 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/20 overflow-x-auto">
                                        <pre className="text-[11px] text-[#005A9C] dark:text-[#66b3ff] font-mono font-bold">
                                            {selectedLog.dados_novos ? JSON.stringify(selectedLog.dados_novos, null, 2) : 'Nenhum dado'}
                                        </pre>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
