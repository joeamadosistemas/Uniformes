import React, { useState, useEffect } from 'react';
import { Package, Plus, Trash2, FileSpreadsheet, FileText, Edit2, Check, X, Loader2, ClipboardList, Layers } from 'lucide-react';
import { useT } from '../lib/LanguageContext';
import { RECEBIMENTOS_MODELOS, RecebimentoModelo } from '../constants/recebimentosConstants';
import { Recebimento } from '../types';
import { supabase } from '../lib/supabaseClient';
import { exportarRecebimentosExcel, exportarRecebimentosPDF } from '../utils/exportUtils';

export const Recebimentos: React.FC = () => {
    const { t } = useT();
    const [recebimentos, setRecebimentos] = useState<Recebimento[]>(() => {
        const dadosSalvos = localStorage.getItem('@Uniformes:recebimentos');
        return dadosSalvos ? JSON.parse(dadosSalvos) : [];
    });
    const [modelosDisponiveis, setModelosDisponiveis] = useState<RecebimentoModelo[]>(RECEBIMENTOS_MODELOS);
    const [modeloSelecionado, setModeloSelecionado] = useState<RecebimentoModelo | null>(null);
    const [quantidades, setQuantidades] = useState<Record<string, number>>({});
    const [escola, setEscola] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState<string>('');
    const [segmentosEscola, setSegmentosEscola] = useState<string[]>([]);
    const [escolaNome, setEscolaNome] = useState<string>('');
    const [userRole, setUserRole] = useState<string>('usuario');
    const [saving, setSaving] = useState(false);
    const [mensagem, setMensagem] = useState<{ texto: string; tipo: 'sucesso' | 'erro' } | null>(null);

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            const emailUser = data.session?.user?.email ?? '';
            const userId = data.session?.user?.id;
            setEscola(emailUser);

            if (userId) {
                // Get user role from Profile table
                supabase
                    .from('Profile')
                    .select('role')
                    .eq('id', userId)
                    .single()
                    .then(({ data: profileData, error }) => {
                        if (profileData?.role) {
                            setUserRole(profileData.role);
                        } else if (error || !profileData) {
                            // Fallback para caso haja profiles antigas (mesma lógica do App.tsx)
                            supabase
                                .from('profiles')
                                .select('role')
                                .eq('id', userId)
                                .single()
                                .then(({ data: oldProfileData }) => {
                                    if (oldProfileData?.role) {
                                        setUserRole(oldProfileData.role);
                                    }
                                });
                        }
                    });
            }

            if (emailUser) {
                supabase
                    .from('escolas')
                    .select('nome, segmentos')
                    .eq('email', emailUser)
                    .single()
                    .then(({ data: escolaData }) => {
                        if (escolaData) {
                            setEscolaNome(escolaData.nome || '');
                            setSegmentosEscola(escolaData.segmentos || []);
                        }
                    });
            }
        });

        const carregarModelosCustomizados = async () => {
            try {
                const { data, error } = await supabase.from('modelos_recebimento').select('*').order('created_at', { ascending: false });
                if (!error && data) {
                    const mapped: RecebimentoModelo[] = data.map(m => ({
                        id: m.id,
                        nome: m.nome,
                        descricao: m.descricao,
                        tamanhos: Array.isArray(m.tamanhos) ? m.tamanhos : m.tamanhos.split(',').map((t: string) => t.trim()),
                        segmentos: Array.isArray(m.segmentos) ? m.segmentos : m.segmentos.split(',').map((s: string) => s.trim())
                    }));

                    const combined = [...mapped];
                    for (const standard of RECEBIMENTOS_MODELOS) {
                        if (!mapped.some(m => m.id === standard.id)) {
                            combined.push(standard);
                        }
                    }
                    setModelosDisponiveis(combined);
                } else {
                    const local = localStorage.getItem('@Uniformes:modelos_customizados');
                    if (local) {
                        const parsedLocal = JSON.parse(local);
                        const combinedLocal = [...parsedLocal];
                        for (const standard of RECEBIMENTOS_MODELOS) {
                            if (!parsedLocal.some((m: RecebimentoModelo) => m.id === standard.id)) {
                                combinedLocal.push(standard);
                            }
                        }
                        setModelosDisponiveis(combinedLocal);
                    }
                }
            } catch (e) {
                const local = localStorage.getItem('@Uniformes:modelos_customizados');
                if (local) {
                    const parsedLocal = JSON.parse(local);
                    const combinedLocal = [...parsedLocal];
                    for (const standard of RECEBIMENTOS_MODELOS) {
                        if (!parsedLocal.some((m: RecebimentoModelo) => m.id === standard.id)) {
                            combinedLocal.push(standard);
                        }
                    }
                    setModelosDisponiveis(combinedLocal);
                }
            }
        }

        carregarModelosCustomizados();
    }, []);

    useEffect(() => {
        localStorage.setItem('@Uniformes:recebimentos', JSON.stringify(recebimentos));
    }, [recebimentos]);

    const handleModeloChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const modelo = modelosDisponiveis.find(m => m.id === e.target.value) || null;
        setModeloSelecionado(modelo);
        setQuantidades({});
    };

    const handleQuantidadeChange = (tamanho: string, valor: string) => {
        const num = parseInt(valor) || 0;
        setQuantidades(prev => ({ ...prev, [tamanho]: num }));
    };

    const adcionarItem = async () => {
        if (!modeloSelecionado) return;

        const novosItens: Recebimento[] = Object.entries(quantidades)
            .filter(([_, qty]) => qty > 0)
            .map(([tamanho, qty]) => ({
                id: crypto.randomUUID(),
                escola,
                data_recebimento: new Date().toISOString(),
                modelo_id: modeloSelecionado.id,
                modelo_nome: modeloSelecionado.nome,
                descricao: modeloSelecionado.descricao,
                tamanho,
                quantidade: qty,
            }));

        if (novosItens.length === 0) return;

        try {
            setSaving(true);

            // 1. Tentar salvar no Supabase se possível
            const payload = novosItens.map(item => ({
                escola: item.escola,
                modelo_id: item.modelo_id,
                modelo_nome: item.modelo_nome,
                descricao: item.descricao,
                tamanho: item.tamanho,
                quantidade: item.quantidade,
                data_recebimento: item.data_recebimento
            }));

            const { error } = await supabase
                .from('recebimentos')
                .insert(payload);

            if (error) {
                console.warn('Erro ao salvar no Supabase (é provável que a tabela ainda não exista):', error.message);
                // Não interrompemos o fluxo, pois o localStorage garante a persistência local
            } else {
                mostrarMensagem(t.recebimentos.sucessoSalvar);
            }

            // 2. Atualizar estado local
            setRecebimentos(prev => [...novosItens, ...prev]);
            setQuantidades({});
            setModeloSelecionado(null);

        } catch (error) {
            console.error('Erro ao processar recebimento:', error);
        } finally {
            setSaving(false);
        }
    };

    const removerItem = async (id: string) => {
        if (window.confirm(t.recebimentos.confirmExcluir)) {
            try {
                // Tenta excluir do banco (opcional, se a tabela existir)
                await supabase.from('recebimentos').delete().eq('id', id);

                setRecebimentos(prev => prev.filter(item => item.id !== id));
                mostrarMensagem(t.lancamentos.sucessoExcluir);
            } catch (err) {
                console.error('Erro ao remover item:', err);
            }
        }
    };

    const mostrarMensagem = (texto: string, tipo: 'sucesso' | 'erro' = 'sucesso') => {
        setMensagem({ texto, tipo });
        setTimeout(() => setMensagem(null), 3000);
    };

    const iniciarEdicao = (item: Recebimento) => {
        setEditingId(item.id);
        setEditValue(item.quantidade.toString());
    };

    const salvarEdicao = (id: string) => {
        const novaQtd = parseInt(editValue) || 0;
        setRecebimentos(prev => prev.map(item =>
            item.id === id ? { ...item, quantidade: novaQtd } : item
        ));
        setEditingId(null);
    };

    // Filtra os modelos baseados no segmento da escola e na role do usuário
    const modelosFiltrados = modelosDisponiveis.filter(modelo => {
        // Administradores veem todos os modelos
        const userRoleLower = userRole?.toLowerCase() || '';
        const isAdmin = userRoleLower === 'admin' || userRoleLower === 'administrador' || userRoleLower === 'super administrador' || userRoleLower.includes('admin');
        if (isAdmin) return true;

        const isCreche = segmentosEscola.includes('CONJUNTO UNIFORMA ESCOLAR CRECHE');
        const isModeloCreche = modelo.segmentos.includes('CONJUNTO UNIFORMA ESCOLAR CRECHE');

        if (isCreche) {
            // Se for Creche, mostra apenas modelos de Creche
            return isModeloCreche;
        } else {
            // Se não for Creche, ignora modelos de Creche e mostra os GERAIS
            return !isModeloCreche;
        }
    });

    const handleExportExcel = () => {
        if (recebimentos.length === 0) return;
        exportarRecebimentosExcel(recebimentos, escolaNome || escola, modelosDisponiveis);
    };

    const handleExportPDF = () => {
        if (recebimentos.length === 0) return;
        exportarRecebimentosPDF(recebimentos, escolaNome || escola);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 relative">
            {mensagem && (
                <div className={`fixed top-20 right-8 px-6 py-3 rounded-lg shadow-lg text-white font-medium z-50 transition-all ${mensagem.tipo === 'sucesso' ? 'bg-green-600' : 'bg-red-600'
                    }`}>
                    {mensagem.texto}
                </div>
            )}
            <div>
                <p className="text-gray-500 dark:text-zinc-400 font-medium pb-2">
                    {t.recebimentos.subtitulo}
                </p>
            </div>

            {/* Metric Cards - Enhanced UI */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 mt-4">
                {/* Card 1: Registros */}
                <div className="group relative bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                    <div className="flex items-center space-x-4">
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                            <ClipboardList size={28} />
                        </div>
                        <div>
                            <p className="text-xs font-black text-gray-400 dark:text-zinc-500 uppercase tracking-wider group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                Registros Lançados
                            </p>
                            <p className="text-3xl font-black text-slate-800 dark:text-white mt-1">
                                {recebimentos.length}
                            </p>
                        </div>
                    </div>
                    {/* Tooltip */}
                    <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none -top-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs font-bold py-2 px-3 rounded-lg shadow-xl whitespace-nowrap z-50">
                        Total de lançamentos realizados
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-l-[6px] border-l-transparent border-t-[6px] border-t-gray-900 border-r-[6px] border-r-transparent"></div>
                    </div>
                </div>

                {/* Card 2: Peças */}
                <div className="group relative bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                    <div className="flex items-center space-x-4">
                        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                            <Package size={28} />
                        </div>
                        <div>
                            <p className="text-xs font-black text-gray-400 dark:text-zinc-500 uppercase tracking-wider group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                Peças Recebidas
                            </p>
                            <p className="text-3xl font-black text-slate-800 dark:text-white mt-1">
                                {recebimentos.reduce((acc, curr) => acc + (curr.quantidade || 0), 0)}
                            </p>
                        </div>
                    </div>
                    {/* Tooltip */}
                    <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none -top-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs font-bold py-2 px-3 rounded-lg shadow-xl whitespace-nowrap z-50">
                        Soma de todas as peças no estoque
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-l-[6px] border-l-transparent border-t-[6px] border-t-gray-900 border-r-[6px] border-r-transparent"></div>
                    </div>
                </div>

                {/* Card 3: Modelos */}
                <div className="group relative bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                    <div className="flex items-center space-x-4">
                        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-2xl group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300">
                            <Layers size={28} />
                        </div>
                        <div>
                            <p className="text-xs font-black text-gray-400 dark:text-zinc-500 uppercase tracking-wider group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                Modelos Diversos
                            </p>
                            <p className="text-3xl font-black text-slate-800 dark:text-white mt-1">
                                {new Set(recebimentos.map(r => r.modelo_id)).size}
                            </p>
                        </div>
                    </div>
                    {/* Tooltip */}
                    <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none -top-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs font-bold py-2 px-3 rounded-lg shadow-xl whitespace-nowrap z-50">
                        Quantidade de modelos únicos
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-l-[6px] border-l-transparent border-t-[6px] border-t-gray-900 border-r-[6px] border-r-transparent"></div>
                    </div>
                </div>
            </div>

            {/* Form Card */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-gray-100 dark:border-zinc-800 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="space-y-2">
                        <label className="text-base font-black text-gray-800 dark:text-zinc-200 uppercase tracking-wider block">
                            {t.recebimentos.modelo}
                        </label>
                        <select
                            className="w-full h-12 bg-gray-50 dark:bg-zinc-800 border-none rounded-xl px-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#005A9C] transition-all cursor-pointer"
                            value={modeloSelecionado?.id || ''}
                            onChange={handleModeloChange}
                        >
                            <option value="">{t.lancamentos.selecione}</option>
                            {modelosFiltrados
                                .filter(m => !recebimentos.some(r => r.modelo_id === m.id))
                                .map(m => (
                                    <option key={m.id} value={m.id}>{m.nome} - {m.descricao}</option>
                                ))
                            }
                        </select>
                    </div>
                </div>

                {modeloSelecionado && (
                    <div className="space-y-6 p-6 bg-gray-50 dark:bg-zinc-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-zinc-700">
                        <h3 className="text-lg font-bold text-[#005A9C] dark:text-[#66b3ff] flex items-center gap-2">
                            <Package size={20} />
                            {modeloSelecionado.descricao}
                        </h3>

                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2">
                            {modeloSelecionado.tamanhos.map(tamanho => (
                                <div key={tamanho} className="space-y-1">
                                    <label className="text-sm font-black text-gray-700 dark:text-zinc-300 uppercase text-center block truncate px-1" title={tamanho}>
                                        {tamanho}
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="0"
                                        className="w-full h-9 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg px-1 text-center text-sm focus:ring-2 focus:ring-[#005A9C] dark:text-white"
                                        value={quantidades[tamanho] || ''}
                                        onChange={(e) => handleQuantidadeChange(tamanho, e.target.value)}
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end pt-4">
                            <button
                                onClick={adcionarItem}
                                disabled={saving}
                                className="flex items-center gap-2 bg-[#005A9C] hover:bg-[#004a80] text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-[#005A9C]/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
                                {saving ? t.common.salvar : t.recebimentos.adicionar}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Result Table */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-gray-100 dark:border-zinc-800 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#005A9C]/10 rounded-xl flex items-center justify-center">
                            <FileText className="text-[#005A9C]" size={20} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-tight">
                                {t.recebimentos.itensRecebidos}
                            </h3>
                            <p className="text-[10px] text-gray-500 font-medium">{recebimentos.length} registro(s) no total</p>
                        </div>
                    </div>

                    {recebimentos.length > 0 && (
                        <div className="flex gap-2">
                            <button
                                onClick={handleExportExcel}
                                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-md shadow-green-600/10 active:scale-95"
                            >
                                <FileSpreadsheet size={16} /> Excel
                            </button>
                            <button
                                onClick={handleExportPDF}
                                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-md shadow-red-600/10 active:scale-95"
                            >
                                <FileText size={16} /> PDF
                            </button>
                        </div>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-zinc-50 dark:bg-zinc-900/50">
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t.recebimentos.modelo}</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t.recebimentos.tamanho}</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">{t.recebimentos.quantidade}</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">{t.common.acoes}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                            {recebimentos.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-400 dark:text-zinc-500 italic">
                                        {t.lancamentos.semRegistros}
                                    </td>
                                </tr>
                            ) : (
                                recebimentos.map(item => (
                                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-bold text-gray-900 dark:text-white uppercase truncate max-w-xs">{item.modelo_nome}</div>
                                            <div className="text-[10px] text-gray-500 font-medium">{item.descricao}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2.5 py-1 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 rounded text-[10px] font-bold border border-gray-200 dark:border-zinc-700 uppercase">
                                                {item.tamanho}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {editingId === item.id ? (
                                                <div className="flex items-center justify-center gap-2">
                                                    <input
                                                        type="number"
                                                        className="w-20 h-8 bg-white dark:bg-zinc-900 border border-[#005A9C] rounded px-2 text-center text-sm font-bold dark:text-white focus:outline-none"
                                                        value={editValue}
                                                        onChange={(e) => setEditValue(e.target.value)}
                                                        autoFocus
                                                    />
                                                    <button
                                                        onClick={() => salvarEdicao(item.id)}
                                                        className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                                                    >
                                                        <Check size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingId(null)}
                                                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <span className="text-sm font-extrabold text-[#005A9C] dark:text-[#66b3ff]">{item.quantidade}</span>
                                                    <span className="ml-1 text-[10px] text-gray-400 uppercase">un.</span>
                                                </>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right flex justify-end gap-1 items-center">
                                            <button
                                                onClick={() => iniciarEdicao(item)}
                                                className={`text-gray-300 hover:text-[#005A9C] p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5 transition-all ${editingId === item.id ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`}
                                                title={t.common.editar}
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => removerItem(item.id)}
                                                className={`text-gray-300 hover:text-red-500 dark:hover:text-red-400 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-all ${editingId === item.id ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`}
                                                title={t.common.excluir}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
