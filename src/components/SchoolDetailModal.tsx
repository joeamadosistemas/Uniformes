import React from 'react';
import { 
    X, 
    School as SchoolIcon, 
    Package, 
    Layers, 
    AlertCircle, 
    FileText,
    History,
    Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { RegistroUniforme } from '../types';

interface SchoolDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    escola: {
        nome: string;
        email: string;
        status: 'concluido' | 'pendente';
        segmentos?: string[];
    } | null;
    registros: RegistroUniforme[];
    loading: boolean;
    onExportPDF: () => void;
}

export const SchoolDetailModal: React.FC<SchoolDetailModalProps> = ({
    isOpen,
    onClose,
    escola,
    registros,
    loading,
    onExportPDF
}) => {
    if (!isOpen || !escola) return null;

    const totalPecas = registros.reduce((acc, curr) => acc + (curr.qtd_alunos || 0), 0);
    const totalVariedades = new Set(registros.map(r => r.tipo_uniforme)).size;
    const ultimoLancamento = registros.length > 0 ? registros[0].data_registro : null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            {/* Overlay */}
            <div 
                className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in"
                onClick={onClose}
            ></div>

            {/* Modal Body */}
            <div className="relative w-full max-w-4xl bg-white dark:bg-[#1a1a2e] rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden animate-in slide-in-from-bottom-8 duration-500">
                
                {/* Header Section */}
                <div className="p-8 pb-4">
                    <div className="flex items-start justify-between">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                            <div className="w-20 h-20 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-amber-500/20 shrink-0">
                                <SchoolIcon size={40} />
                            </div>
                            <div className="text-center sm:text-left">
                                <h2 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white uppercase tracking-tight leading-tight">
                                    {escola.nome}
                                </h2>
                                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-3">
                                    <div className="px-3 py-1.5 bg-zinc-100 dark:bg-white/5 rounded-full flex items-center gap-2 border border-zinc-200/50 dark:border-white/5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                        <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">{escola.email}</span>
                                    </div>
                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                        escola.status === 'concluido' 
                                        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20' 
                                        : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/20'
                                    }`}>
                                        {escola.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button 
                            onClick={onClose}
                            className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>
                    <div className="h-px w-full bg-zinc-100 dark:bg-white/5 mt-8"></div>
                </div>

                <div className="px-8 pb-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <div className="bg-zinc-50/50 dark:bg-white/[0.02] p-6 rounded-3xl border border-zinc-100 dark:border-white/5">
                            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1 text-center">TOTAL</p>
                            <h4 className="text-3xl font-black text-[#005A9C] dark:text-blue-400 text-center">{totalPecas}</h4>
                            <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest text-center mt-1">PEÇAS</p>
                        </div>
                        <div className="bg-zinc-50/50 dark:bg-white/[0.02] p-6 rounded-3xl border border-zinc-100 dark:border-white/5">
                            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1 text-center">MODELOS</p>
                            <h4 className="text-3xl font-black text-zinc-900 dark:text-white text-center">{totalVariedades}</h4>
                            <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest text-center mt-1">VARIEDADES</p>
                        </div>
                        <div className="bg-blue-600 p-6 rounded-3xl shadow-xl shadow-blue-500/20 relative group overflow-hidden flex flex-col items-center justify-center">
                            <div className="absolute top-0 right-0 p-4 opacity-20 transform group-hover:scale-110 transition-transform">
                                <History size={60} />
                            </div>
                            <p className="text-[10px] font-black text-blue-100/60 uppercase tracking-widest mb-1 relative z-10">ÚLTIMA MOVIMENTAÇÃO</p>
                            <h4 className="text-xl font-black text-white text-center relative z-10">
                                {ultimoLancamento ? format(new Date(ultimoLancamento), 'dd/MM/yyyy') : '---'}
                            </h4>
                            <p className="text-[9px] font-bold text-blue-100 uppercase tracking-widest text-center mt-1 relative z-10">
                                {ultimoLancamento ? format(new Date(ultimoLancamento), 'HH:mm') : 'SEM LANÇAMENTOS'}
                            </p>
                        </div>
                    </div>

                    {/* Teaching Stages Section */}
                    <div className="mt-8 bg-zinc-50/50 dark:bg-white/[0.02] p-6 rounded-[2rem] border border-zinc-100 dark:border-white/5">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-blue-500/10 rounded-xl text-blue-600 dark:text-blue-400">
                                <Layers size={18} />
                            </div>
                            <div>
                                <h5 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-tight">ETAPAS DE ENSINO ATENDIDAS</h5>
                                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">NESTA UNIDADE ESCOLAR</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {escola.segmentos && escola.segmentos.length > 0 ? (
                                escola.segmentos.map(seg => (
                                    <span key={seg} className="px-4 py-2 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-gray-300 rounded-xl text-[10px] font-black uppercase tracking-widest border border-zinc-200 dark:border-white/5 shadow-sm">
                                        {seg.replace('CONJUNTO UNIFORMA ESCOLAR ', '').replace('CONJUNTO UNIFORME ESCOLAR ', '')}
                                    </span>
                                ))
                            ) : (
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Nenhum segmento informado</span>
                            )}
                        </div>
                    </div>

                    {/* Activity Report List */}
                    <div className="mt-8">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/10 rounded-xl text-blue-600 dark:text-blue-400">
                                    <Package size={18} />
                                </div>
                                <h5 className="text-base font-black text-zinc-900 dark:text-white uppercase tracking-tight">RELATÓRIO DE RECEBIMENTO</h5>
                            </div>
                            <div className="px-4 py-2 bg-zinc-100 dark:bg-white/5 rounded-full">
                                <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">{registros.length} LANÇAMENTOS</span>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-zinc-50 dark:bg-white/5">
                                    <tr>
                                        <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">MODELO DO UNIFORME</th>
                                        <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">TAMANHO</th>
                                        <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">QUANTIDADE</th>
                                        <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest text-right">DATA</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-50 dark:divide-white/5">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-20 text-center">
                                                <Loader2 className="animate-spin h-8 w-8 text-[#005A9C] mx-auto" />
                                            </td>
                                        </tr>
                                    ) : registros.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-20 text-center">
                                                <p className="text-sm font-bold text-gray-400 uppercase tracking-tight">SEM LANÇAMENTOS ENCONTRADOS</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        registros.map((reg) => (
                                            <tr key={reg.id} className="hover:bg-zinc-50/50 dark:hover:bg-white/[0.01] transition-colors">
                                                <td className="px-6 py-5">
                                                    <p className="font-black text-zinc-900 dark:text-white text-sm uppercase tracking-tight leading-tight">{reg.tipo_uniforme}</p>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{reg.categoria}</p>
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    <span className="px-3 py-1 bg-zinc-100 dark:bg-white/5 rounded-lg text-xs font-black text-zinc-600 dark:text-gray-400 border border-zinc-200/50 dark:border-white/5">
                                                        {reg.tamanho_sobrando || reg.tamanho_faltando || '---'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    <p className="text-base font-black text-zinc-900 dark:text-white">{reg.qtd_alunos}</p>
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <p className="text-[11px] font-black text-zinc-700 dark:text-gray-300">
                                                        {format(new Date(reg.data_registro), 'dd/MM/yyyy')}
                                                    </p>
                                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                                                        {format(new Date(reg.data_registro), 'HH:mm')}
                                                    </p>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Footer Section */}
                <div className="p-8 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-100 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3 opacity-60">
                        <AlertCircle size={16} className="text-gray-400" />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">PAINEL DE VISUALIZAÇÃO ADMINISTRATIVA</span>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <button 
                            onClick={onExportPDF}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-3 bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-xl shadow-red-600/20 active:scale-95"
                        >
                            <FileText size={18} /> GERAR PDF
                        </button>
                        <button 
                            onClick={onClose}
                            className="flex-1 sm:flex-none bg-zinc-900 dark:bg-black hover:bg-black text-white px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95"
                        >
                            FECHAR PAINEL
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
