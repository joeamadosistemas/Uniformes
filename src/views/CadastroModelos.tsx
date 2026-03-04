import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Check, X, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useT } from '../lib/LanguageContext';
import { RecebimentoModelo } from '../constants/recebimentosConstants';
import { exportarModelosPDF } from '../utils/exportUtils';

export const CadastroModelos: React.FC = () => {
    const { t } = useT();
    const [modelos, setModelos] = useState<RecebimentoModelo[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        nome: '',
        descricao: '',
        segmentos: ['GERAL'],
        tamanhos: [] as string[]
    });

    const [novoTamanho, setNovoTamanho] = useState('');

    useEffect(() => {
        fetchModelos();
    }, []);

    const fetchModelos = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('modelos_recebimento')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Map table data to RecebimentoModelo type
            const mapped: RecebimentoModelo[] = (data || []).map((m: any) => ({
                id: m.id,
                nome: m.nome,
                descricao: m.descricao,
                tamanhos: Array.isArray(m.tamanhos) ? m.tamanhos : (m.tamanhos?.split(',') || []),
                segmentos: Array.isArray(m.segmentos) ? m.segmentos : (m.segmentos?.split(',') || ['GERAL'])
            }));

            setModelos(mapped);
        } catch (error) {
            console.error('Erro ao buscar modelos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.nome || formData.tamanhos.length === 0) {
            alert('Preencha o nome e adicione ao menos um tamanho.');
            return;
        }

        try {
            setSaving(true);
            const payload = {
                nome: formData.nome,
                descricao: formData.descricao,
                tamanhos: formData.tamanhos,
                segmentos: formData.segmentos
            };

            if (editingId) {
                const { error } = await supabase
                    .from('modelos_recebimento')
                    .update({
                        ...payload,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', editingId);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('modelos_recebimento')
                    .insert([payload]);
                if (error) throw error;
            }

            setFormData({ nome: '', descricao: '', segmentos: ['GERAL'], tamanhos: [] });
            setEditingId(null);
            fetchModelos();
            alert(editingId ? 'Modelo atualizado!' : 'Modelo criado!');
        } catch (error) {
            console.error('Erro ao salvar modelo:', error);
            alert('Erro ao salvar modelo.');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (modelo: RecebimentoModelo) => {
        setEditingId(modelo.id);
        setFormData({
            nome: modelo.nome,
            descricao: modelo.descricao,
            segmentos: modelo.segmentos,
            tamanhos: modelo.tamanhos
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este modelo?')) return;

        try {
            setLoading(true);
            const { error } = await supabase
                .from('modelos_recebimento')
                .delete()
                .eq('id', id);
            if (error) throw error;
            fetchModelos();
        } catch (error) {
            console.error('Erro ao deletar modelo:', error);
            alert('Erro ao deletar modelo.');
        } finally {
            setLoading(false);
        }
    };

    const addTamanho = () => {
        if (!novoTamanho) return;
        const tam = novoTamanho.trim().toUpperCase();
        if (!formData.tamanhos.includes(tam)) {
            setFormData({ ...formData, tamanhos: [...formData.tamanhos, tam] });
        }
        setNovoTamanho('');
    };

    const removeTamanho = (tam: string) => {
        setFormData({ ...formData, tamanhos: formData.tamanhos.filter(t => t !== tam) });
    };

    const modelosFiltrados = modelos.filter(m => {
        const matchesSearch = m.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.descricao.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    const handleExportPDF = () => {
        exportarModelosPDF(modelosFiltrados);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-12">
            <div>
                <p className="text-gray-500 dark:text-zinc-400 font-medium pb-2">
                    Adicione ou edite modelos dinamicamente para exibição na tela de Recebimentos.
                </p>
            </div>

            {/* Form Card */}
            <div className={`bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border ${editingId ? 'border-[#005A9C] ring-4 ring-blue-50 dark:ring-[#005A9C]/20' : 'border-gray-100 dark:border-zinc-800'} p-6 transition-all`}>
                <div className="flex items-center space-x-2 mb-6 border-b border-gray-100 dark:border-zinc-800 pb-4">
                    {editingId ? <Edit2 size={24} className="text-[#005A9C] dark:text-[#66b3ff]" /> : <Plus size={24} className="text-[#005A9C] dark:text-[#66b3ff]" />}
                    <h3 className="text-lg font-bold text-gray-800 dark:text-zinc-200 uppercase tracking-tight">
                        {editingId ? 'Editar Modelo' : 'Novo Modelo de Tabela'}
                    </h3>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-500 dark:text-zinc-400 uppercase tracking-widest ml-1">Nome do Modelo</label>
                            <input
                                type="text"
                                value={formData.nome}
                                onChange={e => setFormData({ ...formData, nome: e.target.value })}
                                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl focus:ring-2 focus:ring-[#005A9C] transition-all"
                                placeholder="Ex: Camiseta Polo Masculina"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-500 dark:text-zinc-400 uppercase tracking-widest ml-1">Segmentos Atendidos (Separados por vírgula)</label>
                            <input
                                type="text"
                                value={formData.segmentos.join(', ')}
                                onChange={e => setFormData({ ...formData, segmentos: e.target.value.split(',').map(s => s.trim()) })}
                                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl focus:ring-2 focus:ring-[#005A9C] transition-all"
                                placeholder="Ex: GERAL, CONJUNTO UNIFORMA ESCOLAR CRECHE"
                            />
                        </div>

                        <div className="md:col-span-2 space-y-2">
                            <label className="text-xs font-black text-gray-500 dark:text-zinc-400 uppercase tracking-widest ml-1">Descrição / Observação</label>
                            <textarea
                                value={formData.descricao}
                                onChange={e => setFormData({ ...formData, descricao: e.target.value })}
                                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl focus:ring-2 focus:ring-[#005A9C] transition-all min-h-[100px]"
                                placeholder="Detalhes opcionais sobre o modelo..."
                            />
                        </div>

                        <div className="md:col-span-2 space-y-4">
                            <label className="text-xs font-black text-gray-500 dark:text-zinc-400 uppercase tracking-widest ml-1">Grade de Tamanhos</label>
                            <div className="flex space-x-2">
                                <input
                                    type="text"
                                    value={novoTamanho}
                                    onChange={e => setNovoTamanho(e.target.value)}
                                    onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addTamanho())}
                                    className="flex-1 px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl focus:ring-2 focus:ring-[#005A9C] transition-all"
                                    placeholder="Add tamanho (ex: P, M, G, 38, 40)"
                                />
                                <button
                                    type="button"
                                    onClick={addTamanho}
                                    className="px-6 bg-[#005A9C] text-white rounded-xl font-bold hover:bg-[#004a80] transition-colors"
                                >
                                    Add
                                </button>
                            </div>

                            <div className="flex flex-wrap gap-2 pt-2">
                                {formData.tamanhos.map((tam: string) => (
                                    <span key={tam} className="flex items-center bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-lg text-sm font-bold border border-blue-100 dark:border-blue-800/50">
                                        {tam}
                                        <button type="button" onClick={() => removeTamanho(tam)} className="ml-2 hover:text-red-500">
                                            <X size={14} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex items-center space-x-3">
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 md:flex-none md:min-w-[200px] flex items-center justify-center space-x-2 py-4 bg-[#005A9C] text-white rounded-xl font-bold hover:bg-[#004a80] transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
                            <span>{editingId ? 'Salvar Alterações' : 'Criar Modelo'}</span>
                        </button>
                        {editingId && (
                            <button
                                type="button"
                                onClick={() => {
                                    setEditingId(null);
                                    setFormData({ nome: '', descricao: '', segmentos: ['GERAL'], tamanhos: [] });
                                }}
                                className="px-6 py-4 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 rounded-xl font-bold hover:bg-gray-200 transition-all"
                            >
                                Cancelar
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* List Table */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-gray-100 dark:border-zinc-800 overflow-hidden mt-8">
                <div className="p-6 border-b border-gray-100 dark:border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-zinc-50/50 dark:bg-zinc-900/50">
                    <div className="flex flex-1 items-center space-x-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Pesquisar modelos..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-[#005A9C] transition-all"
                            />
                        </div>
                    </div>
                    <button
                        onClick={handleExportPDF}
                        className="flex items-center px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-bold hover:bg-red-100 transition-all"
                    >
                        <Trash2 size={18} className="mr-2" /> PDF
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-zinc-50/50 dark:bg-zinc-800/30">
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest">Modelo</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest">Segmentos</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest">Grade</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-400">Carregando modelos...</td>
                                </tr>
                            ) : modelosFiltrados.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-400">Nenhum modelo encontrado.</td>
                                </tr>
                            ) : modelosFiltrados.map(m => (
                                <tr key={m.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-900 dark:text-zinc-200">{m.nome}</div>
                                        <div className="text-xs text-gray-500 dark:text-zinc-500 truncate max-w-[200px]">{m.descricao}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1">
                                            {m.segmentos.map((s: string) => (
                                                <span key={s} className="px-2 py-1 rounded-md text-[8px] font-black uppercase bg-blue-50 text-blue-600">
                                                    {s}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1">
                                            {m.tamanhos.map(t => (
                                                <span key={t} className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded text-[9px] font-bold border border-zinc-200 dark:border-zinc-700">
                                                    {t}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEdit(m)} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(m.id)} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
