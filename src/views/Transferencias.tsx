import React, { useState, useEffect } from 'react';
import {
    ArrowUpRight,
    ArrowDownLeft,
    PlusCircle,
    History,
    Trash2,
    Send,
    ChevronDown,
    ChevronUp,
    Package,
    Pencil,
    X,
    Save
} from 'lucide-react';
import { EscolaCadastro, Transferencia, ItemTransferencia } from '../types';
import { CATEGORIAS_UNIFORMES } from '../constants';
import { supabase } from '../lib/supabaseClient';
import { useT } from '../lib/LanguageContext';

export const Transferencias: React.FC = () => {
    const { t } = useT();
    const [activeTab, setActiveTab] = useState<'recebidas' | 'enviadas' | 'nova' | 'historico'>('recebidas');
    const [escolas, setEscolas] = useState<EscolaCadastro[]>([]);
    const [transferencias, setTransferencias] = useState<Transferencia[]>([]);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // Escola/nome do usuário logado atual
    const [minhaEscola, setMinhaEscola] = useState('');
    // E-mail do usuário logado (fallback para resolver nome de escola)
    const [userEmail, setUserEmail] = useState('');
    const [userRole, setUserRole] = useState<string>('');

    // Nova Transferência State
    const [destino, setDestino] = useState('');
    const [segmentosSelecionados, setSegmentosSelecionados] = useState<string[]>([]);
    const [itens, setItens] = useState<Partial<ItemTransferencia>[]>([
        { id: crypto.randomUUID(), produto: '', quantidade: 0, motivo: '' }
    ]);

    // Estado do modal de edição
    const [editando, setEditando] = useState<Transferencia | null>(null);
    const [editDestino, setEditDestino] = useState('');
    const [editItens, setEditItens] = useState<Partial<ItemTransferencia>[]>([]);

    // Estado do modal de exclusão
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        // Busca o e-mail e o nome da escola do usuário logado
        supabase.auth.getSession().then(async ({ data }) => {
            if (!isMounted) return;
            const email = data.session?.user?.email ?? '';
            if (!email) return;
            setUserEmail(email);

            // Sem filtro ativo para ser mais permissivo na busca
            const { data: escolaData } = await supabase
                .from('escolas')
                .select('nome')
                .ilike('email', email)
                .maybeSingle();

            if (!isMounted) return;
            if (escolaData?.nome) {
                setMinhaEscola(escolaData.nome);
            }

            const userId = data.session?.user?.id;
            if (userId) {
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('perfil, role')
                    .eq('id', userId)
                    .maybeSingle();

                if (profileData) {
                    setUserRole(profileData.perfil || profileData.role || '');
                }
            }
        });

        // Busca todas as escolas cadastradas
        supabase
            .from('escolas')
            .select('*')
            .eq('ativo', true)
            .order('nome', { ascending: true })
            .then(({ data, error }) => {
                if (!isMounted) return;
                if (!error && data) setEscolas(data as EscolaCadastro[]);
            });

        const transSalvas = localStorage.getItem('@Uniformes:transferencias');
        if (transSalvas) {
            setTransferencias(JSON.parse(transSalvas));
        } else {
            setTransferencias([]);
            localStorage.setItem('@Uniformes:transferencias', JSON.stringify([]));
        }

        return () => {
            isMounted = false;
        };
    }, []);

    // ── Helpers ──────────────────────────────────────────────────
    const salvarTransferencias = (lista: Transferencia[]) => {
        setTransferencias(lista);
        localStorage.setItem('@Uniformes:transferencias', JSON.stringify(lista));
    };

    const allProducts = Array.from(new Set(Object.values(CATEGORIAS_UNIFORMES).flat())).sort();

    /**
     * Determina o "tipo" de uma transferência da perspectiva do usuário logado.
     *  - Se minha escola enviou → 'enviada'
     *  - Se minha escola é o destino → 'recebida'
     *  - Caso não haja correspondência (admin vendo tudo) → usa o campo tipo original
     */
    const tipoParaMim = (t: Transferencia): 'enviada' | 'recebida' => {
        if (!minhaEscola) return t.tipo;
        if (t.unidade_origem === minhaEscola) return 'enviada';
        if (t.unidade_origem_destino === minhaEscola) return 'recebida';
        return t.tipo;
    };

    // ── Nova Transferência ────────────────────────────────────────
    const handleAddItem = () => {
        setItens([...itens, { id: crypto.randomUUID(), produto: '', quantidade: 0, motivo: '' }]);
    };

    const handleRemoveItem = (id: string) => {
        if (itens.length > 1) setItens(itens.filter(item => item.id !== id));
    };

    const handleItemChange = <K extends keyof ItemTransferencia>(id: string, field: K, value: ItemTransferencia[K]) => {
        setItens(itens.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const handleDestinoChange = (escolaNome: string) => {
        setDestino(escolaNome);
        if (!escolaNome) { setSegmentosSelecionados([]); return; }
        const encontrada = escolas.find(e => e.nome === escolaNome);
        if (encontrada && Array.isArray(encontrada.segmentos) && encontrada.segmentos.length > 0) {
            setSegmentosSelecionados(encontrada.segmentos);
        } else {
            setSegmentosSelecionados([]);
        }
    };

    const handleEnviar = () => {
        if (!destino || segmentosSelecionados.length === 0 || itens.some(i => !i.produto || (i.quantidade ?? 0) <= 0)) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return;
        }
        const novaTrans: Transferencia = {
            id: Math.random().toString(16).slice(2, 10),
            tipo: 'enviada',
            status: 'concluida',
            unidade_origem: minhaEscola || 'SECRETARIA DE EDUCAÇÃO', // Garante origem se for admin sem escola vinculada
            origem_email: userEmail,           // ← e-mail preservado como fallback
            unidade_origem_destino: destino,
            data: new Date().toLocaleDateString('pt-BR'),
            segmentos: segmentosSelecionados,
            itens: itens as ItemTransferencia[]
        };
        salvarTransferencias([novaTrans, ...transferencias]);
        setDestino('');
        setSegmentosSelecionados([]);
        setItens([{ id: crypto.randomUUID(), produto: '', quantidade: 0, motivo: '' }]);
        alert('Transferência enviada com sucesso!');
    };

    // ── Excluir Transferência ─────────────────────────────────────
    const handleDelete = (id: string) => {
        setDeleteConfirmId(id);
    };

    const confirmarDelete = () => {
        if (!deleteConfirmId) return;
        salvarTransferencias(transferencias.filter(t => t.id !== deleteConfirmId));
        setDeleteConfirmId(null);
    };

    // ── Editar Transferência ──────────────────────────────────────
    const abrirEdicao = (t: Transferencia) => {
        setEditando(t);
        setEditDestino(t.unidade_origem_destino);
        setEditItens(t.itens.map(i => ({ ...i })));
    };

    const handleEditItemChange = <K extends keyof ItemTransferencia>(id: string, field: K, value: ItemTransferencia[K]) => {
        setEditItens(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const handleAddEditItem = () => {
        setEditItens(prev => [...prev, { id: crypto.randomUUID(), produto: '', quantidade: 0, motivo: '' }]);
    };

    const handleRemoveEditItem = (id: string) => {
        if (editItens.length > 1) setEditItens(prev => prev.filter(i => i.id !== id));
    };

    const handleSaveEdit = () => {
        if (!editando) return;
        if (!editDestino || editItens.some(i => !i.produto || (i.quantidade ?? 0) <= 0)) {
            alert('Por favor, preencha todos os campos.');
            return;
        }
        const encontrada = escolas.find(e => e.nome === editDestino);
        const segsAtualizados = encontrada?.segmentos ?? editando.segmentos;
        const atualizada: Transferencia = {
            ...editando,
            unidade_origem_destino: editDestino,
            segmentos: segsAtualizados,
            itens: editItens as ItemTransferencia[]
        };
        salvarTransferencias(transferencias.map(t => t.id === editando.id ? atualizada : t));
        setEditando(null);
    };

    // ── Filtros por aba ───────────────────────────────────────────
    // Considera o tipo relativo à escola logada

    /**
     * Resolve o nome da escola de origem de uma transferência.
     *  1. Usa `unidade_origem` se existir
     *  2. Procura na lista de escolas pelo `origem_email`
     *  3. Exibe o e-mail truncado como último recurso
     */
    const resolverOrigem = (trans: Transferencia): string => {
        if (trans.unidade_origem) return trans.unidade_origem;
        if (trans.origem_email) {
            const encontrada = escolas.find(
                e => e.email?.toLowerCase() === trans.origem_email?.toLowerCase()
            );
            if (encontrada) return encontrada.nome;
            // Mostra o e-mail como fallback (truncado antes do @)
            return trans.origem_email.split('@')[0] || trans.origem_email;
        }
        return 'SECRETARIA DE EDUCAÇÃO';
    };
    const filteredTrans = transferencias.filter(trans => {
        const tipo = tipoParaMim(trans);
        if (activeTab === 'recebidas') return tipo === 'recebida';
        if (activeTab === 'enviadas') return tipo === 'enviada';
        if (activeTab === 'historico') return true;
        return false;
    });

    // Transferências enviadas por mim (para a tabela de histórico)
    const enviadas = transferencias.filter(trans => tipoParaMim(trans) === 'enviada');

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-20">

            {/* ── Modal de Edição ── */}
            {editando && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <Pencil size={18} className="text-blue-600" />
                                {t.transferencias.editarTrans}
                            </h3>
                            <button onClick={() => setEditando(null)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <X size={18} className="text-gray-500" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Unidade de Destino</label>
                                <select
                                    value={editDestino}
                                    onChange={(e) => setEditDestino(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="">Selecione a unidade...</option>
                                    <option value="SECRETARIA DE EDUCAÇÃO">SECRETARIA DE EDUCAÇÃO</option>
                                    {escolas.map(e => <option key={e.id} value={e.nome}>{e.nome}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Itens da Transferência</label>
                                <div className="space-y-3">
                                    {editItens.map((item) => (
                                        <div key={item.id} className="grid grid-cols-12 gap-3 items-center bg-slate-50 rounded-xl p-3 border border-slate-100">
                                            <div className="col-span-12 md:col-span-5">
                                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Produto</label>
                                                <select value={item.produto} onChange={(e) => handleEditItemChange(item.id!, 'produto', e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 outline-none">
                                                    <option value="">Selecione...</option>
                                                    {allProducts.map(p => <option key={p} value={p}>{p}</option>)}
                                                </select>
                                            </div>
                                            <div className="col-span-4 md:col-span-3">
                                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Quantidade</label>
                                                <input type="number" min="1" value={item.quantidade} onChange={(e) => handleEditItemChange(item.id!, 'quantidade', parseInt(e.target.value))} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 outline-none" />
                                            </div>
                                            <div className="col-span-7 md:col-span-3">
                                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Motivo</label>
                                                <input type="text" value={item.motivo} onChange={(e) => handleEditItemChange(item.id!, 'motivo', e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 outline-none" />
                                            </div>
                                            <div className="col-span-1 flex justify-center pt-4">
                                                <button onClick={() => handleRemoveEditItem(item.id!)} disabled={editItens.length === 1} className="p-1.5 text-gray-400 hover:text-red-500 disabled:opacity-30 transition-colors"><Trash2 size={16} /></button>
                                            </div>
                                        </div>
                                    ))}
                                    <button onClick={handleAddEditItem} className="flex items-center text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                                        <PlusCircle size={16} className="mr-1.5" /> Adicionar item
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 p-6 border-t border-gray-100">
                            <button onClick={() => setEditando(null)} className="px-5 py-2.5 text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-medium text-sm">{t.common.cancelar}</button>
                            <button onClick={handleSaveEdit} className="flex items-center px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-bold text-sm shadow-md shadow-blue-200">
                                <Save size={16} className="mr-2" /> {t.transferencias.salvarAlteracoes}
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {/* Tabs Navigation */}
            <div className="flex space-x-2 bg-gray-100/50 p-1.5 rounded-xl w-fit">
                <button onClick={() => setActiveTab('recebidas')} className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'recebidas' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
                    <ArrowDownLeft size={18} className="mr-2" /> {t.transferencias.recebidas}
                </button>
                <button onClick={() => setActiveTab('enviadas')} className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'enviadas' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
                    <ArrowUpRight size={18} className="mr-2" /> {t.transferencias.enviadas}
                </button>
                <button onClick={() => setActiveTab('nova')} className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'nova' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
                    <PlusCircle size={18} className="mr-2" /> {t.transferencias.novaTransferencia}
                </button>
                <button onClick={() => setActiveTab('historico')} className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'historico' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
                    <History size={18} className="mr-2" /> {t.transferencias.historico}
                </button>
            </div>

            {activeTab === 'nova' ? (
                <div className="space-y-6">
                    {/* Formulário Nova Transferência */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-8 animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-blue-50 rounded-xl text-blue-600"><PlusCircle size={28} /></div>
                            <h3 className="text-xl font-bold text-gray-800">{t.transferencias.novaTransferencia}</h3>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Unidade de Destino</label>
                                    <select value={destino} onChange={(e) => handleDestinoChange(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all">
                                        <option value="">{t.transferencias.selecione}</option>
                                        <option value="SECRETARIA DE EDUCAÇÃO">SECRETARIA DE EDUCAÇÃO</option>
                                        {escolas.map(e => <option key={e.id} value={e.nome}>{e.nome}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                                        Segmentos de Ensino *
                                        {destino && segmentosSelecionados.length === 0 && (
                                            <span className="ml-2 text-amber-500 font-normal normal-case">— sem segmentos cadastrados</span>
                                        )}
                                    </label>
                                    {segmentosSelecionados.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {segmentosSelecionados.map((seg) => (
                                                <span key={seg} className="px-3 py-1.5 rounded-lg border text-[11px] font-bold bg-blue-600 border-blue-600 text-white" title={seg}>
                                                    {seg.replace('CONJUNTO UNIFORMA ESCOLAR ', '')}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-400 italic">
                                            {destino ? t.common.nenhumSegmento : t.common.selecioneUnidade}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Itens da Transferência</label>
                                <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-6 space-y-4">
                                    {itens.map((item) => (
                                        <div key={item.id} className="grid grid-cols-12 gap-4 items-start pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                                            <div className="col-span-12 md:col-span-5">
                                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Produto</label>
                                                <select value={item.produto} onChange={(e) => handleItemChange(item.id!, 'produto', e.target.value)} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm">
                                                    <option value="">{t.transferencias.selecioneProduto}</option>
                                                    {allProducts.map(p => <option key={p} value={p}>{p}</option>)}
                                                </select>
                                            </div>
                                            <div className="col-span-4 md:col-span-2">
                                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Quantidade</label>
                                                <input type="number" min="1" value={item.quantidade} onChange={(e) => handleItemChange(item.id!, 'quantidade', parseInt(e.target.value))} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                                            </div>
                                            <div className="col-span-6 md:col-span-4">
                                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Motivo (Opcional)</label>
                                                <input type="text" placeholder="Ex: Reforço de estoque..." value={item.motivo} onChange={(e) => handleItemChange(item.id!, 'motivo', e.target.value)} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                                            </div>
                                            <div className="col-span-2 md:col-span-1 pt-6 text-center">
                                                <button onClick={() => handleRemoveItem(item.id!)} disabled={itens.length === 1} className="p-2 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-30"><Trash2 size={18} /></button>
                                            </div>
                                        </div>
                                    ))}
                                    <button onClick={handleAddItem} className="flex items-center text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors pt-2">
                                        <PlusCircle size={16} className="mr-2" /> Adicionar outro item
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <button onClick={handleEnviar} className="flex items-center px-8 py-3 bg-blue-700 text-white rounded-xl hover:bg-blue-800 transition-all font-bold shadow-lg shadow-blue-200">
                                    <Send size={20} className="mr-2" /> {t.transferencias.enviarTrans}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ── Tabela de Histórico de Transferências Enviadas ── */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-slate-50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <History size={18} className="text-blue-600" />
                                <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide">{t.transferencias.historicoEnviadas}</h3>
                            </div>
                            <span className="text-xs text-gray-400">{enviadas.length} {t.transferencias.registros}</span>
                        </div>

                        {enviadas.length === 0 ? (
                            <div className="py-16 text-center space-y-3">
                                <Package size={40} className="mx-auto text-gray-200" />
                                <p className="text-gray-400 text-sm font-medium">Nenhuma transferência enviada ainda.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-sm">
                                    <thead>
                                        <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                                            <th className="px-5 py-3 font-semibold">{t.common.data}</th>
                                            <th className="px-5 py-3 font-semibold">{t.transferencias.unidadeDestino}</th>
                                            <th className="px-5 py-3 font-semibold">{t.transferencias.segmentosEnsino}</th>
                                            <th className="px-5 py-3 font-semibold">{t.transferencias.itensTrans}</th>
                                            <th className="px-5 py-3 font-semibold text-center">{t.common.status}</th>
                                            <th className="px-5 py-3 font-semibold text-right">{t.common.acoes}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {enviadas.map((trans) => (
                                            <tr key={trans.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-5 py-4 text-gray-500 whitespace-nowrap font-medium">{trans.data}</td>
                                                <td className="px-5 py-4">
                                                    <span className="font-semibold text-gray-800">{trans.unidade_origem_destino}</span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex flex-wrap gap-1">
                                                        {trans.segmentos.map(seg => (
                                                            <span key={seg} className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold border border-blue-100">
                                                                {seg.replace('CONJUNTO UNIFORMA ESCOLAR ', '')}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <button onClick={() => setExpandedId(expandedId === trans.id ? null : trans.id)} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold transition-colors">
                                                        <Package size={14} />
                                                        {trans.itens.length} {t.common.registro}
                                                        {expandedId === trans.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                                                    </button>
                                                    {expandedId === trans.id && (
                                                        <div className="mt-2 space-y-1">
                                                            {trans.itens.map(item => (
                                                                <div key={item.id} className="flex items-center gap-2 text-xs bg-slate-50 rounded-lg px-3 py-1.5 border border-slate-100">
                                                                    <span className="font-semibold text-gray-700">{item.produto}</span>
                                                                    <span className="text-gray-400">—</span>
                                                                    <span className="text-blue-600 font-bold">{item.quantidade} un.</span>
                                                                    {item.motivo && <span className="text-gray-400 italic truncate">({item.motivo})</span>}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-5 py-4 text-center">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-green-100 text-green-600">{trans.status}</span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button onClick={() => abrirEdicao(trans)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title={t.common.editar}><Pencil size={15} /></button>
                                                        <button onClick={() => handleDelete(trans.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors" title={t.common.excluir}><Trash2 size={15} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="space-y-4 animate-in fade-in duration-500">
                    {filteredTrans.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-20 text-center space-y-4">
                            <Package size={48} className="mx-auto text-gray-300" />
                            <p className="text-gray-500 font-medium">{t.transferencias.semTransferencias}</p>
                        </div>
                    ) : (
                        filteredTrans.map((trans) => {
                            const tipo = tipoParaMim(trans);
                            return (
                                <div key={trans.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                                    <div className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center space-x-3">
                                                <span className="px-3 py-1 bg-green-50 text-green-600 text-[10px] font-bold rounded-lg border border-green-100 uppercase tracking-widest">{trans.status}</span>
                                                <span className="text-xs font-bold text-gray-300">ID: {trans.id}</span>
                                            </div>
                                            {(tipo === 'enviada' || userRole === 'Admin' || userRole === 'Administrador' || userRole === 'Super Administrador') && (
                                                <div className="flex items-center gap-1">
                                                    <button onClick={() => abrirEdicao(trans)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title={t.common.editar}><Pencil size={15} /></button>
                                                    <button onClick={() => handleDelete(trans.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors" title={t.common.excluir}><Trash2 size={15} /></button>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-start space-x-4">
                                            <div className={`p-3 rounded-2xl ${tipo === 'recebida' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                                                {tipo === 'recebida' ? <ArrowDownLeft size={24} /> : <ArrowUpRight size={24} />}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-lg font-bold text-gray-800">
                                                    {tipo === 'recebida'
                                                        ? <>{t.transferencias.recebidoDe}: <span className="text-blue-700">{resolverOrigem(trans)}</span></>
                                                        : <>{t.transferencias.enviadoPara}: <span className="text-orange-700">{trans.unidade_origem_destino}</span></>
                                                    }
                                                </h4>
                                                <div className="flex items-center text-xs text-gray-400 font-bold mt-1">
                                                    <History size={14} className="mr-1.5" />{trans.data}
                                                </div>
                                                <div className="mt-3 flex flex-wrap gap-1">
                                                    {trans.segmentos.map(seg => (
                                                        <span key={seg} className="px-2 py-0.5 bg-slate-50 text-slate-500 rounded text-[9px] uppercase font-bold border border-slate-100">
                                                            {seg.replace('CONJUNTO UNIFORMA ESCOLAR ', '')}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="px-6 pb-2">
                                        <button onClick={() => setExpandedId(expandedId === trans.id ? null : trans.id)} className="w-full flex items-center justify-between py-3 border-t border-gray-50 text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-colors">
                                            <div className="flex items-center"><Package size={14} className="mr-2" />{t.transferencias.itensTransferidos}</div>
                                            {expandedId === trans.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                        </button>
                                        {expandedId === trans.id && (
                                            <div className="pb-6 pt-2 space-y-3 animate-in slide-in-from-top-2">
                                                {trans.itens.map(item => (
                                                    <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                        <div className="flex items-center space-x-3">
                                                            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-blue-600 shadow-sm border border-slate-200"><Package size={16} /></div>
                                                            <div>
                                                                <p className="text-sm font-bold text-gray-700">{item.produto}</p>
                                                                {item.motivo && <p className="text-[10px] text-gray-400">{item.motivo}</p>}
                                                            </div>
                                                        </div>
                                                        <div className="text-right"><p className="text-sm font-bold text-blue-600">{item.quantidade} un.</p></div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}
            {/* ── Modal de Confirmação de Exclusão ── */}
            {deleteConfirmId && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center space-y-5">
                        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-2">
                            <Trash2 size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800">Confirmar Exclusão</h3>
                        <p className="text-gray-500 text-sm">Tem certeza que deseja excluir esta transferência permanentemente? Esta ação não poderá ser desfeita.</p>

                        <div className="flex gap-3 pt-4">
                            <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-3 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
                                {t.common.cancelar || 'Cancelar'}
                            </button>
                            <button onClick={confirmarDelete} className="flex-1 py-3 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-lg shadow-red-200">
                                {t.common.excluir || 'Excluir'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};
