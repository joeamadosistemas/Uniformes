import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Check, X, Layers, Save, Loader2, Search, Filter, FileText } from 'lucide-react';
import { SEGMENTOS_ENSINO } from '../constants';
import { supabase } from '../lib/supabaseClient';
import { RECEBIMENTOS_MODELOS, RecebimentoModelo } from '../constants/recebimentosConstants';
import { exportarModelosPDF } from '../utils/exportUtils';

export const CadastroModelos: React.FC = () => {
    const [modelosCustomizados, setModelosCustomizados] = useState<RecebimentoModelo[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    // Filtros da Tabela
    const [searchTerm, setSearchTerm] = useState('');
    const [filterSegmento, setFilterSegmento] = useState<string>('todos');

    const [formData, setFormData] = useState<{
        nome: string;
        descricao: string;
        tamanhos: string;
        segmentos: string[];
    }>({
        nome: '',
        descricao: '',
        tamanhos: '',
        segmentos: []
    });

    useEffect(() => {
        carregarModelos();
    }, []);

    const carregarModelos = async () => {
        setLoading(true);
        try {
            // First try to load from Supabase if the table exists
            const { data, error } = await supabase.from('modelos_recebimento').select('*').order('created_at', { ascending: false });

            if (error) {
                // Supabase table might not exist, fallback to LocalStorage
                console.warn('Tabela modelos_recebimento não existe ou inacessível. Usando LocalStorage.');
                const local = localStorage.getItem('@Uniformes:modelos_customizados');
                const custom = local ? JSON.parse(local) : [];
                const combined = [...custom];
                for (const standard of RECEBIMENTOS_MODELOS) {
                    if (!custom.some((m: RecebimentoModelo) => m.id === standard.id)) {
                        combined.push(standard);
                    }
                }
                setModelosCustomizados(combined);
            } else if (data) {
                const mapped: RecebimentoModelo[] = data.map(m => ({
                    id: m.id,
                    nome: m.nome,
                    descricao: m.descricao,
                    tamanhos: Array.isArray(m.tamanhos) ? m.tamanhos : m.tamanhos.split(',').map((t: string) => t.trim()),
                    segmentos: Array.isArray(m.segmentos) ? m.segmentos : m.segmentos.split(',').map((s: string) => s.trim())
                }));
                // Merge with standard models, custom overrides standard by ID
                const combined = [...mapped];
                for (const standard of RECEBIMENTOS_MODELOS) {
                    if (!mapped.some(m => m.id === standard.id)) {
                        combined.push(standard);
                    }
                }
                setModelosCustomizados(combined);
                // Sync to local (only custom)
                localStorage.setItem('@Uniformes:modelos_customizados', JSON.stringify(mapped));
            }
        } catch (e) {
            console.error('Erro ao carregar modelos customizados', e);
            const local = localStorage.getItem('@Uniformes:modelos_customizados');
            const custom = local ? JSON.parse(local) : [];
            const combined = [...custom];
            for (const standard of RECEBIMENTOS_MODELOS) {
                if (!custom.some((m: RecebimentoModelo) => m.id === standard.id)) {
                    combined.push(standard);
                }
            }
            setModelosCustomizados(combined);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSegmentoToggle = (segmento: string) => {
        setFormData(prev => {
            if (prev.segmentos.includes(segmento)) {
                return { ...prev, segmentos: prev.segmentos.filter(s => s !== segmento) };
            } else {
                return { ...prev, segmentos: [...prev.segmentos, segmento] };
            }
        });
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.nome || !formData.descricao || !formData.tamanhos || formData.segmentos.length === 0) {
            alert('Por favor, preencha todos os campos obrigatórios (incluindo pelo menos um segmento).');
            return;
        }

        const tamanhosArray = formData.tamanhos.split(',').map(t => t.trim()).filter(t => t.length > 0);

        try {
            setSaving(true);
            const isEditing = !!editingId;
            const newModel: RecebimentoModelo = {
                id: isEditing ? editingId : crypto.randomUUID(),
                nome: formData.nome,
                descricao: formData.descricao,
                tamanhos: tamanhosArray,
                segmentos: formData.segmentos
            };

            // Try saving to Supabase
            const { error } = await supabase.from('modelos_recebimento').upsert({
                id: newModel.id,
                nome: newModel.nome,
                descricao: newModel.descricao,
                tamanhos: newModel.tamanhos,
                segmentos: newModel.segmentos
            });

            if (error) {
                console.warn('Salvando apenas localmente: ', error.message);
            }

            // Always update local state
            let updatedList = [];
            if (isEditing) {
                updatedList = modelosCustomizados.map(m => m.id === newModel.id ? newModel : m);
                alert('Modelo atualizado com sucesso!');
            } else {
                updatedList = [newModel, ...modelosCustomizados];
                alert('Modelo cadastrado com sucesso!');
            }

            setModelosCustomizados(updatedList);
            const customOnly = updatedList.filter(m => !RECEBIMENTOS_MODELOS.some(std => std.id === m.id) || RECEBIMENTOS_MODELOS.some(std => std.id === m.id && JSON.stringify(std) !== JSON.stringify(m)));
            localStorage.setItem('@Uniformes:modelos_customizados', JSON.stringify(customOnly));
            cancelEdit();
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
            tamanhos: modelo.tamanhos.join(', '),
            segmentos: modelo.segmentos
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setFormData({ nome: '', descricao: '', tamanhos: '', segmentos: [] });
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Tem certeza que deseja excluir este modelo? (Caso seja um modelo padrão, ele retornará aos valores originais)')) {
            // 1. Atualização Otimista do Estado Local (sempre atualiza a UI primeiro)
            const isStandard = RECEBIMENTOS_MODELOS.find(m => m.id === id);
            let updatedList;
            if (isStandard) {
                updatedList = modelosCustomizados.map(m => m.id === id ? isStandard : m);
            } else {
                updatedList = modelosCustomizados.filter(m => m.id !== id);
            }

            setModelosCustomizados(updatedList);
            const customOnly = updatedList.filter(m => !RECEBIMENTOS_MODELOS.some(std => std.id === m.id && JSON.stringify(std) === JSON.stringify(m)));
            localStorage.setItem('@Uniformes:modelos_customizados', JSON.stringify(customOnly));

            // 2. Tentar deletar do Supabase em background
            try {
                const { error } = await supabase.from('modelos_recebimento').delete().eq('id', id);
                if (error) {
                    console.warn('Erro ao deletar no Supabase (funcionando apenas localmente):', error.message);
                }
            } catch (e) {
                console.error('Falha de rede ao remover do Supabase:', e);
            }
        }
    };

    const modelosFiltrados = modelosCustomizados.filter(item => {
        const matchesSearch = item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.id.toLowerCase().includes(searchTerm.toLowerCase()));

        let matchesSegmento = true;
        if (filterSegmento !== 'todos') {
            matchesSegmento = Boolean(item.segmentos && item.segmentos.includes(filterSegmento));
        }

        return matchesSearch && matchesSegmento;
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
                        {editingId ? 'Editando Modelo' : 'Novo Modelo Customizado'}
                    </h3>
                </div>

                <form onSubmit={handleSave} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5">
                                Nome do Modelo *
                            </label>
                            <input
                                type="text"
                                name="nome"
                                value={formData.nome}
                                onChange={handleInputChange}
                                placeholder="Ex: MODELO 27 (Custom)"
                                className="w-full h-12 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#005A9C] font-bold"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5">
                                Descrição *
                            </label>
                            <input
                                type="text"
                                name="descricao"
                                value={formData.descricao}
                                onChange={handleInputChange}
                                placeholder="Ex: CONJUNTO JAQUETA (NOVO)"
                                className="w-full h-12 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#005A9C]"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5">
                            Tamanhos Disponíveis (Separados por vírgula) *
                        </label>
                        <input
                            type="text"
                            name="tamanhos"
                            value={formData.tamanhos}
                            onChange={handleInputChange}
                            placeholder="Ex: 4, 6, 8, P, M, G"
                            className="w-full h-12 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#005A9C] uppercase"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-xs font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5">
                            Segmentos de Ensino (Etapas Atendidas) *
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-gray-200 dark:border-zinc-700">
                            {SEGMENTOS_ENSINO.map(segmento => (
                                <label key={segmento} className="flex items-center space-x-3 cursor-pointer group">
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${formData.segmentos.includes(segmento) ? 'bg-[#005A9C] border-[#005A9C]' : 'border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 group-hover:border-[#005A9C]'}`}>
                                        {formData.segmentos.includes(segmento) && <Check size={14} className="text-white" />}
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={formData.segmentos.includes(segmento)}
                                        onChange={() => handleSegmentoToggle(segmento)}
                                    />
                                    <span className="text-sm font-medium text-gray-700 dark:text-zinc-300 group-hover:text-[#005A9C] dark:group-hover:text-[#66b3ff] transition-colors">{segmento.replace('CONJUNTO UNIFORMA ESCOLAR ', '')}</span>
                                </label>
                            ))}
                            <label className="flex items-center space-x-3 cursor-pointer group">
                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${formData.segmentos.includes('GERAL') ? 'bg-purple-600 border-purple-600' : 'border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 group-hover:border-purple-600'}`}>
                                    {formData.segmentos.includes('GERAL') && <Check size={14} className="text-white" />}
                                </div>
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={formData.segmentos.includes('GERAL')}
                                    onChange={() => handleSegmentoToggle('GERAL')}
                                />
                                <span className="text-sm font-bold text-purple-700 dark:text-purple-400 group-hover:text-purple-800 transition-colors">GERAL (Todos exceto Creche)</span>
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 space-x-3 border-t border-gray-100 dark:border-zinc-800">
                        {editingId && (
                            <button
                                type="button"
                                onClick={cancelEdit}
                                className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition-all"
                            >
                                <X size={20} /> Cancelar
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={saving}
                            className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 disabled:opacity-50 ${editingId ? 'bg-green-600 hover:bg-green-700 shadow-green-600/20' : 'bg-[#005A9C] hover:bg-[#004a80] shadow-[#005A9C]/20'}`}
                        >
                            {saving ? <Loader2 className="animate-spin" size={20} /> : editingId ? <Save size={20} /> : <Plus size={20} />}
                            {saving ? 'Salvando...' : editingId ? 'Salvar Alterações' : 'Cadastrar Modelo'}
                        </button>
                    </div>
                </form>
            </div>

            {/* List Table */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-gray-100 dark:border-zinc-800 overflow-hidden mt-8">
                <div className="p-6 border-b border-gray-100 dark:border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-zinc-50/50 dark:bg-zinc-900/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 text-purple-600 rounded-xl flex items-center justify-center">
                            <Layers size={20} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-tight">
                                Gestão de Modelos
                            </h3>
                            <p className="text-[10px] text-gray-500 font-medium">{modelosFiltrados.length} registro(s)</p>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-4 flex-1 justify-end">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Buscar modelo, ID ou descrição..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-[#005A9C] outline-none text-sm dark:text-white transition-all shadow-sm"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <Filter size={16} className="text-gray-400" />
                            <select
                                value={filterSegmento}
                                onChange={(e) => setFilterSegmento(e.target.value)}
                                className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 dark:text-zinc-300 focus:ring-2 focus:ring-[#005A9C] outline-none cursor-pointer shadow-sm"
                            >
                                <option value="todos">TODOS OS SEGMENTOS</option>
                                {SEGMENTOS_ENSINO.map(seg => (
                                    <option key={seg} value={seg}>
                                        {seg.replace('CONJUNTO UNIFORMA ESCOLAR ', '')}
                                    </option>
                                ))}
                            </select>

                            <button
                                onClick={handleExportPDF}
                                disabled={loading || modelosFiltrados.length === 0}
                                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 ml-2"
                            >
                                <FileText size={16} /> PDF
                            </button>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-zinc-50 dark:bg-zinc-900/50">
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center w-24">ID Local</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Modelo / Descrição</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tamanhos</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Segmentos</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                            {loading && modelosCustomizados.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400 dark:text-zinc-500 font-medium">
                                        <Loader2 size={32} className="mx-auto mb-3 animate-spin opacity-50" />
                                        Carregando modelos customizados...
                                    </td>
                                </tr>
                            ) : modelosCustomizados.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400 dark:text-zinc-500 italic">
                                        Nenhum modelo encontrado.
                                    </td>
                                </tr>
                            ) : (
                                modelosFiltrados.map(item => {
                                    const isStandard = RECEBIMENTOS_MODELOS.some(std => std.id === item.id);
                                    const isCustomizedStandard = isStandard && JSON.stringify(item) !== JSON.stringify(RECEBIMENTOS_MODELOS.find(s => s.id === item.id));

                                    return (
                                        <tr key={item.id} className={`hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors ${editingId === item.id ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
                                            <td className="px-6 py-4 text-center">
                                                {isStandard && !isCustomizedStandard ? (
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-gray-300 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800 text-gray-500">PADRÃO</span>
                                                ) : isCustomizedStandard ? (
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-orange-300 dark:border-orange-500/30 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400">EDITADO</span>
                                                ) : (
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-[#005A9C]/30 bg-[#005A9C]/10 text-[#005A9C] dark:text-[#66b3ff]">NOVO</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-bold text-gray-900 dark:text-white uppercase truncate max-w-xs">{item.nome}</div>
                                                <div className="text-[10px] text-gray-500 font-medium">{item.descricao}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {item.tamanhos.map(tam => (
                                                        <span key={tam} className="px-2 py-0.5 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 rounded text-[9px] font-bold border border-gray-200 dark:border-zinc-700 uppercase">
                                                            {tam}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    {item.segmentos.map(seg => (
                                                        <span key={seg} className="text-[10px] text-[#005A9C] dark:text-[#66b3ff] font-medium bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full w-fit">
                                                            {seg.replace('CONJUNTO UNIFORMA ESCOLAR ', '')}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right flex justify-end gap-1 items-center">
                                                <button
                                                    onClick={() => handleEdit(item)}
                                                    className={`text-gray-400 hover:text-[#005A9C] p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5 transition-all`}
                                                    title="Editar Modelo"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className={`text-gray-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-all ${isStandard && !isCustomizedStandard ? 'opacity-30 cursor-not-allowed' : ''}`}
                                                    title={isStandard && !isCustomizedStandard ? "Padrão de Sistema (Não Removível)" : isCustomizedStandard ? "Restaurar Padrão" : "Excluir Modelo"}
                                                    disabled={isStandard && !isCustomizedStandard}
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
