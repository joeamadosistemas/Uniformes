import React, { useState, useEffect } from 'react';
import {
    Shirt,
    Plus,
    Trash2,
    Save,
    Search,
    Package,
    DollarSign,
    Loader2,
    Edit2,
    X,
    Check,
    FileText,
    FileSpreadsheet
} from 'lucide-react';
import { useT } from '../lib/LanguageContext';
import { Uniforme } from '../types';
import { SEGMENTOS_ENSINO, TAMANHOS_DISPONIVEIS, CATEGORIAS_UNIFORMES, UNIDADES_MEDIDA } from '../constants';
import { supabase } from '../lib/supabaseClient';
import { exportarCatalogoPDF, exportarCatalogoExcel } from '../utils/exportUtils';

export const CadastrosUniformes: React.FC = () => {
    const { t } = useT();
    const [uniformes, setUniformes] = useState<Uniforme[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Estado de Edição
    const [editingId, setEditingId] = useState<string | null>(null);

    // Extrair chave da categoria a partir do segmento selecionado
    const getCategoriaKey = (segmento: string) => {
        return segmento.replace('CONJUNTO UNIFORMA ESCOLAR ', '').replace('CONJUNTO UNIFORME ESCOLAR ', '').trim();
    };

    // Form State
    const [formData, setFormData] = useState<Omit<Uniforme, 'id' | 'precoTotal' | 'dataCadastro'>>({
        segmento: '',
        unidade: '',
        modelo: '',
        descricao: '',
        tamanho: '',
        quantidade: 0,
        precoUnitario: 0
    });

    useEffect(() => {
        fetchUniformes();
    }, []);

    const fetchUniformes = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('uniformes_catalogo')
                .select('*')
                .order('data_cadastro', { ascending: false });

            if (error) throw error;

            if (data) {
                // Map snake_case to camelCase
                const mappedData: Uniforme[] = data.map((item: any) => ({
                    id: item.id,
                    segmento: item.segmento,
                    unidade: item.unidade,
                    modelo: item.modelo,
                    descricao: item.descricao,
                    tamanho: item.tamanho,
                    quantidade: item.quantidade,
                    precoUnitario: item.preco_unitario,
                    precoTotal: item.quantidade * item.preco_unitario, // Calculate locally
                    dataCadastro: item.data_cadastro
                }));
                setUniformes(mappedData);
            }
        } catch (error) {
            console.error('Erro ao buscar uniformes:', error);
            alert(t.cadastros.erroCarregar);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'quantidade' || name === 'precoUnitario' ? Number(value) : value
        }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.segmento || !formData.descricao || (formData.quantidade === 0 && !editingId)) {
            alert('Por favor, preencha os campos obrigatórios (Segmento e Descrição).');
            return;
        }

        try {
            setSaving(true);

            if (editingId) {
                // UPDATE
                const { error } = await supabase
                    .from('uniformes_catalogo')
                    .update({
                        segmento: formData.segmento,
                        unidade: formData.unidade,
                        modelo: formData.modelo,
                        descricao: formData.descricao,
                        tamanho: formData.tamanho,
                        quantidade: formData.quantidade,
                        preco_unitario: formData.precoUnitario
                    })
                    .eq('id', editingId);

                if (error) throw error;
                alert(t.cadastros.sucessoAtualizar);
            } else {
                // INSERT
                const { error } = await supabase
                    .from('uniformes_catalogo')
                    .insert([{
                        segmento: formData.segmento,
                        unidade: formData.unidade,
                        modelo: formData.modelo,
                        descricao: formData.descricao,
                        tamanho: formData.tamanho,
                        quantidade: formData.quantidade,
                        preco_unitario: formData.precoUnitario
                    }]);

                if (error) throw error;
            }

            await fetchUniformes();
            cancelEdit();

        } catch (error) {
            console.error('Erro ao salvar uniforme:', error);
            alert('Erro ao salvar no banco de dados. Verifique a conexão ou se o e-mail administrativo possui permissões.');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (uniforme: Uniforme) => {
        setEditingId(uniforme.id);
        setFormData({
            segmento: uniforme.segmento,
            unidade: uniforme.unidade,
            modelo: uniforme.modelo,
            descricao: uniforme.descricao,
            tamanho: uniforme.tamanho,
            quantidade: uniforme.quantidade,
            precoUnitario: uniforme.precoUnitario
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setFormData({
            segmento: '',
            unidade: '',
            modelo: '',
            descricao: '',
            tamanho: '',
            quantidade: 0,
            precoUnitario: 0
        });
    };

    const handleDelete = async (id: string) => {
        if (window.confirm(t.cadastros.confirmExcluir)) {
            try {
                const { error } = await supabase
                    .from('uniformes_catalogo')
                    .delete()
                    .eq('id', id);

                if (error) throw error;

                setUniformes(prev => prev.filter(u => u.id !== id));
            } catch (error) {
                console.error('Erro ao excluir uniforme:', error);
                alert('Erro ao deletar o item.');
            }
        }
    };

    const filteredUniformes = uniformes.filter(u =>
        (u.modelo ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.segmento ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.unidade ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.descricao ?? '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-500">{t.cadastros.subtitulo}</p>
                </div>
            </div>

            {/* Form Card */}
            <div className={`bg-white rounded-3xl border ${editingId ? 'border-blue-200 ring-4 ring-blue-50' : 'border-gray-100'} shadow-sm overflow-hidden transition-all duration-300`}>
                <div className={`${editingId ? 'bg-blue-600' : 'bg-slate-50/50'} px-8 py-4 border-b border-gray-100 flex items-center justify-between`}>
                    <div className="flex items-center space-x-2">
                        {editingId ? <Edit2 size={20} className="text-white" /> : <Plus size={20} className="text-blue-600" />}
                        <h3 className={`text-sm font-bold uppercase tracking-wider ${editingId ? 'text-white' : 'text-gray-700'}`}>
                            {editingId ? t.cadastros.editando : t.cadastros.novo}
                        </h3>
                    </div>
                    {editingId && (
                        <button
                            onClick={cancelEdit}
                            className="text-white/80 hover:text-white flex items-center gap-1 text-[10px] font-black uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full border border-white/20 transition-all"
                        >
                            <X size={14} /> Cancelar Edição
                        </button>
                    )}
                </div>

                <form onSubmit={handleSave} className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-1">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">{t.cadastros.segmento} *</label>
                            <select
                                name="segmento"
                                value={formData.segmento}
                                onChange={(e) => {
                                    handleInputChange(e);
                                    if (!editingId) setFormData(prev => ({ ...prev, descricao: '' }));
                                }}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-medium"
                            >
                                <option value="">{t.lancamentos.selecione}</option>
                                {SEGMENTOS_ENSINO.map(s => (
                                    <option key={s} value={s}>{s.replace('CONJUNTO UNIFORMA ESCOLAR ', '')}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">{t.cadastros.unid} *</label>
                            <select
                                name="unidade"
                                value={formData.unidade}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-medium"
                            >
                                <option value="">{t.lancamentos.selecione}</option>
                                {UNIDADES_MEDIDA.map(u => (
                                    <option key={u} value={u}>{u}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Modelo (Número)</label>
                            <input
                                type="text"
                                name="modelo"
                                value={formData.modelo}
                                onChange={handleInputChange}
                                placeholder="Ex: 001"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-bold"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">{t.cadastros.descricao} *</label>
                            <select
                                name="descricao"
                                value={formData.descricao}
                                onChange={handleInputChange}
                                disabled={!formData.segmento}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <option value="">{t.cadastros.precisaSegmento}</option>
                                {formData.segmento && CATEGORIAS_UNIFORMES[getCategoriaKey(formData.segmento)]?.map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">{t.cadastros.tamanho}</label>
                            <select
                                name="tamanho"
                                value={formData.tamanho}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-medium"
                            >
                                <option value="">{t.lancamentos.selecione}</option>
                                {TAMANHOS_DISPONIVEIS.map(t => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">{t.cadastros.quantidade} *</label>
                            <input
                                type="number"
                                name="quantidade"
                                value={formData.quantidade}
                                onChange={handleInputChange}
                                min="0"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-bold"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">{t.cadastros.precoUnitario}</label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="number"
                                    name="precoUnitario"
                                    value={formData.precoUnitario}
                                    onChange={handleInputChange}
                                    step="0.01"
                                    min="0"
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-bold"
                                />
                            </div>
                        </div>

                        <div className={`p-4 rounded-2xl border transition-all ${editingId ? 'bg-blue-600 border-blue-600 shadow-lg shadow-blue-100' : 'bg-blue-50 border-blue-100'}`}>
                            <label className={`block text-[9px] font-black uppercase tracking-widest mb-1 ${editingId ? 'text-blue-100' : 'text-blue-400'}`}>{t.cadastros.precoTotalEst}</label>
                            <p className={`text-xl font-black ${editingId ? 'text-white' : 'text-blue-600'}`}>
                                R$ {(formData.quantidade * formData.precoUnitario).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                        </div>

                        <div className="md:col-span-2 flex justify-end">
                            <button
                                type="submit"
                                disabled={saving}
                                className={`flex items-center px-10 py-4 text-white rounded-2xl transition-all font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${editingId ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' : 'bg-blue-700 hover:bg-blue-800 shadow-blue-300'}`}
                            >
                                {saving ? (
                                    <Loader2 size={24} className="mr-2 animate-spin" />
                                ) : editingId ? (
                                    <Check size={24} className="mr-2" />
                                ) : (
                                    <Save size={24} className="mr-2" />
                                )}
                                {saving ? t.cadastros.salvando : editingId ? t.cadastros.salvarAlteracoes : t.cadastros.cadastrar}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* List Card */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center space-x-2">
                        <Package size={20} className="text-gray-400" />
                        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widest">{t.cadastros.cadastrados}</h3>
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-3">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => exportarCatalogoPDF(filteredUniformes)}
                                className="flex items-center px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl hover:bg-red-100 transition-all text-[10px] font-black uppercase tracking-widest"
                                title="Gerar PDF do Catálogo"
                            >
                                <FileText size={16} className="mr-2" />
                                PDF
                            </button>
                            <button
                                onClick={() => exportarCatalogoExcel(filteredUniformes)}
                                className="flex items-center px-4 py-2 bg-green-50 text-green-600 border border-green-200 rounded-xl hover:bg-green-100 transition-all text-[10px] font-black uppercase tracking-widest"
                                title="Exportar para Excel"
                            >
                                <FileSpreadsheet size={16} className="mr-2" />
                                Excel
                            </button>
                        </div>

                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder={t.cadastros.buscar}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-64 transition-all"
                            />
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.cadastros.segmento} / {t.cadastros.unid}</th>
                                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.cadastros.modelo} / {t.cadastros.descricao}</th>
                                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">{t.cadastros.tamanho}</th>
                                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">{t.transferencias.quantidade}</th>
                                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Total</th>
                                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">{t.common.acoes}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-sm">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-8 py-20 text-center text-gray-400 font-medium">
                                        <Loader2 size={48} className="mx-auto mb-4 animate-spin opacity-20" />
                                        {t.common.carregando}
                                    </td>
                                </tr>
                            ) : filteredUniformes.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-8 py-20 text-center text-gray-400 font-medium">
                                        <Shirt size={48} className="mx-auto mb-4 opacity-20" />
                                        {t.lancamentos.semRegistros}
                                    </td>
                                </tr>
                            ) : (
                                filteredUniformes.map(u => (
                                    <tr key={u.id} className={`hover:bg-slate-50/50 transition-colors ${editingId === u.id ? 'bg-blue-50/30' : ''}`}>
                                        <td className="px-8 py-4">
                                            <p className="font-bold text-gray-800">{u.segmento.replace('CONJUNTO UNIFORMA ESCOLAR ', '').replace('CONJUNTO UNIFORME ESCOLAR ', '')}</p>
                                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-tighter">{t.cadastros.unid}: {u.unidade || '-'}</p>
                                        </td>
                                        <td className="px-8 py-4">
                                            <p className="font-bold text-gray-700">{t.cadastros.modelo}: {u.modelo || '-'}</p>
                                            <p className="text-[10px] text-gray-400 italic line-clamp-1">{u.descricao || '-'}</p>
                                        </td>
                                        <td className="px-8 py-4 text-center">
                                            <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-black uppercase">{u.tamanho || '-'}</span>
                                        </td>
                                        <td className="px-8 py-4 text-center font-bold text-gray-600">
                                            {u.quantidade}
                                        </td>
                                        <td className="px-8 py-4 text-right font-medium text-gray-500">
                                            R$ {(u.precoUnitario ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-8 py-4 text-right">
                                            <p className="font-black text-blue-600">
                                                R$ {(u.quantidade * u.precoUnitario).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </p>
                                        </td>
                                        <td className="px-8 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleEdit(u)}
                                                    className={`p-2 transition-colors ${editingId === u.id ? 'text-blue-600' : 'text-gray-400 hover:text-blue-600'}`}
                                                    title={t.common.editar}
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(u.id)}
                                                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                                    title={t.common.excluir}
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="px-8 py-4 bg-slate-50 border-t border-gray-100 flex justify-between items-center">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        {t.cadastros.totalItens}: {filteredUniformes.length}
                    </p>
                    <p className="text-sm font-bold text-gray-700">
                        {t.cadastros.valorConsolidado}: <span className="text-blue-600 ml-1">R$ {filteredUniformes.reduce((acc, curr) => acc + (curr.quantidade * curr.precoUnitario), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </p>
                </div>
            </div>
        </div>
    );
};
