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
    Check
} from 'lucide-react';
import { EscolaCadastro, Transferencia, ItemTransferencia } from '../types';
import { SEGMENTOS_ENSINO, CATEGORIAS_UNIFORMES } from '../constants';

export const Transferencias: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'recebidas' | 'enviadas' | 'nova' | 'historico'>('recebidas');
    const [escolas, setEscolas] = useState<EscolaCadastro[]>([]);
    const [transferencias, setTransferencias] = useState<Transferencia[]>([]);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // Nova Transferência State
    const [destino, setDestino] = useState('');
    const [segmentosSelecionados, setSegmentosSelecionados] = useState<string[]>([]);
    const [itens, setItens] = useState<Partial<ItemTransferencia>[]>([
        { id: crypto.randomUUID(), produto: '', quantidade: 0, motivo: '' }
    ]);

    useEffect(() => {
        const escolasSalvas = localStorage.getItem('@Uniformes:escolas');
        if (escolasSalvas) {
            setEscolas(JSON.parse(escolasSalvas));
        }

        // Mock initial data if empty
        const transSalvas = localStorage.getItem('@Uniformes:transferencias');
        if (transSalvas) {
            setTransferencias(JSON.parse(transSalvas));
        } else {
            const mockData: Transferencia[] = [
                {
                    id: '053d3803',
                    tipo: 'recebida',
                    status: 'concluida',
                    unidade_origem_destino: 'CESMI-Centro Municipal de Estudos Supletivos de Itaguaí',
                    data: '06/02/2026',
                    segmentos: ['CONJUNTO UNIFORMA ESCOLAR EJA'],
                    itens: [
                        { id: '1', produto: 'CAMISETA COM MANGA', quantidade: 50, motivo: 'Reforço de estoque' }
                    ]
                },
                {
                    id: '0ef1903d',
                    tipo: 'enviada',
                    status: 'concluida',
                    unidade_origem_destino: 'SECRETARIA DE EDUCAÇÃO',
                    data: '06/02/2026',
                    segmentos: ['CONJUNTO UNIFORMA ESCOLAR FUNDAMENTAL 1-3 ANOS'],
                    itens: [
                        { id: '2', produto: 'BERMUDA HELANCA', quantidade: 30 }
                    ]
                }
            ];
            setTransferencias(mockData);
            localStorage.setItem('@Uniformes:transferencias', JSON.stringify(mockData));
        }
    }, []);

    const handleAddItem = () => {
        setItens([...itens, { id: crypto.randomUUID(), produto: '', quantidade: 0, motivo: '' }]);
    };

    const handleRemoveItem = (id: string) => {
        if (itens.length > 1) {
            setItens(itens.filter(item => item.id !== id));
        }
    };

    const handleItemChange = (id: string, field: keyof ItemTransferencia, value: any) => {
        setItens(itens.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const toggleSegmento = (segmento: string) => {
        setSegmentosSelecionados(prev =>
            prev.includes(segmento) ? prev.filter(s => s !== segmento) : [...prev, segmento]
        );
    };

    const handleEnviar = () => {
        if (!destino || segmentosSelecionados.length === 0 || itens.some(i => !i.produto || i.quantidade <= 0)) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return;
        }

        const novaTrans: Transferencia = {
            id: Math.random().toString(16).slice(2, 10),
            tipo: 'enviada',
            status: 'concluida',
            unidade_origem_destino: destino,
            data: new Date().toLocaleDateString('pt-BR'),
            segmentos: segmentosSelecionados,
            itens: itens as ItemTransferencia[]
        };

        const atualizadas = [novaTrans, ...transferencias];
        setTransferencias(atualizadas);
        localStorage.setItem('@Uniformes:transferencias', JSON.stringify(atualizadas));

        // Reset form
        setDestino('');
        setSegmentosSelecionados([]);
        setItens([{ id: crypto.randomUUID(), produto: '', quantidade: 0, motivo: '' }]);
        setActiveTab('enviadas');
        alert('Transferência enviada com sucesso!');
    };

    const filteredTrans = transferencias.filter(t => {
        if (activeTab === 'recebidas') return t.tipo === 'recebida';
        if (activeTab === 'enviadas') return t.tipo === 'enviada';
        if (activeTab === 'historico') return true;
        return false;
    });

    const allProducts = Array.from(new Set(Object.values(CATEGORIAS_UNIFORMES).flat())).sort();

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-20">
            <div>
                <h2 className="text-3xl font-bold text-gray-800">Transferências</h2>
                <p className="text-gray-500">Movimentação entre unidades</p>
            </div>

            {/* Tabs Navigation */}
            <div className="flex space-x-2 bg-gray-100/50 p-1.5 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab('recebidas')}
                    className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'recebidas' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <ArrowDownLeft size={18} className="mr-2" />
                    Recebidas
                </button>
                <button
                    onClick={() => setActiveTab('enviadas')}
                    className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'enviadas' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <ArrowUpRight size={18} className="mr-2" />
                    Enviadas
                </button>
                <button
                    onClick={() => setActiveTab('nova')}
                    className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'nova' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <PlusCircle size={18} className="mr-2" />
                    Nova Transferência
                </button>
                <button
                    onClick={() => setActiveTab('historico')}
                    className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'historico' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <History size={18} className="mr-2" />
                    Histórico
                </button>
            </div>

            {activeTab === 'nova' ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-8 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                            <PlusCircle size={28} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800">Nova Transferência</h3>
                    </div>

                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Unidade de Destino</label>
                                <select
                                    value={destino}
                                    onChange={(e) => setDestino(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                >
                                    <option value="">Selecione a unidade...</option>
                                    <option value="SECRETARIA DE EDUCAÇÃO">SECRETARIA DE EDUCAÇÃO</option>
                                    {escolas.map(e => <option key={e.id} value={e.nome}>{e.nome}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Segmentos de Ensino *</label>
                                <div className="flex flex-wrap gap-2">
                                    {SEGMENTOS_ENSINO.map((seg) => {
                                        const isSelected = segmentosSelecionados.includes(seg);
                                        return (
                                            <button
                                                key={seg}
                                                type="button"
                                                onClick={() => toggleSegmento(seg)}
                                                title={seg}
                                                className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold transition-all ${isSelected
                                                        ? 'bg-blue-600 border-blue-600 text-white'
                                                        : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {seg.replace('CONJUNTO UNIFORMA ESCOLAR ', '')}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Itens da Transferência</label>
                            <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-6 space-y-4">
                                {itens.map((item, index) => (
                                    <div key={item.id} className="grid grid-cols-12 gap-4 items-start pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                                        <div className="col-span-12 md:col-span-5">
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Produto</label>
                                            <select
                                                value={item.produto}
                                                onChange={(e) => handleItemChange(item.id!, 'produto', e.target.value)}
                                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                            >
                                                <option value="">Selecione o produto...</option>
                                                {allProducts.map(p => <option key={p} value={p}>{p}</option>)}
                                            </select>
                                        </div>
                                        <div className="col-span-4 md:col-span-2">
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Quantidade</label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={item.quantidade}
                                                onChange={(e) => handleItemChange(item.id!, 'quantidade', parseInt(e.target.value))}
                                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                            />
                                        </div>
                                        <div className="col-span-6 md:col-span-4">
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Motivo (Opcional)</label>
                                            <input
                                                type="text"
                                                placeholder="Ex: Reforço de estoque..."
                                                value={item.motivo}
                                                onChange={(e) => handleItemChange(item.id!, 'motivo', e.target.value)}
                                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                            />
                                        </div>
                                        <div className="col-span-2 md:col-span-1 pt-6 text-center">
                                            <button
                                                onClick={() => handleRemoveItem(item.id!)}
                                                disabled={itens.length === 1}
                                                className="p-2 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-30"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                <button
                                    onClick={handleAddItem}
                                    className="flex items-center text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors pt-2"
                                >
                                    <PlusCircle size={16} className="mr-2" />
                                    Adicionar outro item
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <button
                                onClick={handleEnviar}
                                className="flex items-center px-8 py-3 bg-blue-700 text-white rounded-xl hover:bg-blue-800 transition-all font-bold shadow-lg shadow-blue-200"
                            >
                                <Send size={20} className="mr-2" />
                                Enviar Transferência
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-4 animate-in fade-in duration-500">
                    {filteredTrans.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-20 text-center space-y-4">
                            <Package size={48} className="mx-auto text-gray-300" />
                            <p className="text-gray-500 font-medium">Nenhuma transferência encontrada nesta categoria.</p>
                        </div>
                    ) : (
                        filteredTrans.map((t) => (
                            <div key={t.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center space-x-3">
                                            <span className="px-3 py-1 bg-green-50 text-green-600 text-[10px] font-bold rounded-lg border border-green-100 uppercase tracking-widest">
                                                {t.status}
                                            </span>
                                            <span className="text-xs font-bold text-gray-300">ID: {t.id}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-start space-x-4">
                                        <div className={`p-3 rounded-2xl ${t.tipo === 'recebida' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                                            {t.tipo === 'recebida' ? <ArrowDownLeft size={24} /> : <ArrowUpRight size={24} />}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-lg font-bold text-gray-800">
                                                {t.tipo === 'recebida' ? 'Recebido de:' : 'Enviado para:'} {t.unidade_origem_destino}
                                            </h4>
                                            <div className="flex items-center text-xs text-gray-400 font-bold mt-1">
                                                <History size={14} className="mr-1.5" />
                                                {t.data}
                                            </div>

                                            <div className="mt-3 flex flex-wrap gap-1">
                                                {t.segmentos.map(seg => (
                                                    <span key={seg} className="px-2 py-0.5 bg-slate-50 text-slate-500 rounded text-[9px] uppercase font-bold border border-slate-100">
                                                        {seg.replace('CONJUNTO UNIFORMA ESCOLAR ', '')}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="px-6 pb-2">
                                    <button
                                        onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                                        className="w-full flex items-center justify-between py-3 border-t border-gray-50 text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-colors"
                                    >
                                        <div className="flex items-center">
                                            <Package size={14} className="mr-2" />
                                            Itens Transferidos
                                        </div>
                                        {expandedId === t.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </button>

                                    {expandedId === t.id && (
                                        <div className="pb-6 pt-2 space-y-3 animate-in slide-in-from-top-2">
                                            {t.itens.map(item => (
                                                <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-blue-600 shadow-sm border border-slate-200">
                                                            <Package size={16} />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-gray-700">{item.produto}</p>
                                                            {item.motivo && <p className="text-[10px] text-gray-400">{item.motivo}</p>}
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-bold text-blue-600">{item.quantidade} un.</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};
