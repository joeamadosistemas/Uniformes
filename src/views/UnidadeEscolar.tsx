import React, { useState, useEffect } from 'react';
import { EscolaCadastro } from '../types';
import { Save, Trash2, School, Check, Loader2, Pencil, Power, X, Search, Filter } from 'lucide-react';
import { SEGMENTOS_ENSINO } from '../constants';
import { supabase } from '../lib/supabaseClient';
import { useT } from '../lib/LanguageContext';

export const UnidadeEscolar: React.FC = () => {
  const { t } = useT();
  const [escolas, setEscolas] = useState<EscolaCadastro[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSegmento, setFilterSegmento] = useState('');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [segmentosSelecionados, setSegmentosSelecionados] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Edit modal state
  const [editando, setEditando] = useState<EscolaCadastro | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editSegmentos, setEditSegmentos] = useState<string[]>([]);

  useEffect(() => {
    fetchEscolas();
  }, []);

  const fetchEscolas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('escolas')
        .select('*')
        .order('nome', { ascending: true });

      if (error) throw error;
      if (data) setEscolas(data as EscolaCadastro[]);
    } catch (error) {
      console.error('Erro ao buscar escolas:', error);
      alert(t.cadastros.erroCarregar);
    } finally {
      setLoading(false);
    }
  };

  const toggleSegmento = (segmento: string) => {
    setSegmentosSelecionados(prev =>
      prev.includes(segmento) ? prev.filter(s => s !== segmento) : [...prev, segmento]
    );
  };

  const toggleEditSegmento = (segmento: string) => {
    setEditSegmentos(prev =>
      prev.includes(segmento) ? prev.filter(s => s !== segmento) : [...prev, segmento]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || segmentosSelecionados.length === 0) {
      alert(t.common.preenchaCampos);
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase
        .from('escolas')
        .insert([{ nome, email, segmentos: segmentosSelecionados, ativo: true }]);

      if (error) throw error;

      await fetchEscolas();
      setNome('');
      setEmail('');
      setSegmentosSelecionados([]);
    } catch (error) {
      console.error('Erro ao salvar escola:', error);
      alert(t.common.erroSalvar);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (escola: EscolaCadastro) => {
    setEditando(escola);
    setEditNome(escola.nome);
    setEditEmail(escola.email);
    setEditSegmentos(escola.segmentos || []);
  };

  const handleSaveEdit = async () => {
    if (!editando) return;
    try {
      setSaving(true);
      const { error } = await supabase
        .from('escolas')
        .update({ nome: editNome, email: editEmail, segmentos: editSegmentos })
        .eq('id', editando.id);

      if (error) throw error;
      await fetchEscolas();
      setEditando(null);
    } catch (error) {
      console.error('Erro ao editar escola:', error);
      alert(t.common.erroSalvar);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAtivo = async (escola: EscolaCadastro) => {
    const novoStatus = !escola.ativo;
    const acao = novoStatus ? 'reativar' : 'desativar';
    if (!window.confirm(`Deseja ${acao} a escola "${escola.nome}"?`)) return;

    try {
      const { error } = await supabase
        .from('escolas')
        .update({ ativo: novoStatus })
        .eq('id', escola.id);

      if (error) throw error;
      setEscolas(prev => prev.map(e => e.id === escola.id ? { ...e, ativo: novoStatus } : e));
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      alert(t.common.erroGeral);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(t.escolas.confirmDeletar)) {
      try {
        const { error } = await supabase.from('escolas').delete().eq('id', id);
        if (error) throw error;
        setEscolas(prev => prev.filter(e => e.id !== id));
      } catch (error) {
        console.error('Erro ao excluir escola:', error);
        alert(t.common.erroExcluir);
      }
    }
  };

  const filteredEscolas = escolas.filter(escola => {
    const matchesSearch = escola.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (escola.email && escola.email.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesSegmento = filterSegmento
      ? (escola.segmentos || []).includes(filterSegmento)
      : true;

    return matchesSearch && matchesSegmento;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Edit Modal */}
      {editando && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800 flex items-center">
                <Pencil size={18} className="mr-2 text-blue-600" />
                {t.escolas.titulo.replace('Cadastro de ', 'Editar ')}
              </h3>
              <button onClick={() => setEditando(null)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X size={18} className="text-gray-500" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.escolas.nomeEscola} *</label>
                <input
                  type="text"
                  value={editNome}
                  onChange={(e) => setEditNome(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.login.email}</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Segmentos de Ensino</label>
              <div className="flex flex-wrap gap-2">
                {SEGMENTOS_ENSINO.map((seg) => {
                  const isSelected = editSegmentos.includes(seg);
                  return (
                    <button
                      key={seg}
                      type="button"
                      onClick={() => toggleEditSegmento(seg)}
                      className={`px-3 py-1.5 rounded-lg border text-xs transition-all flex items-center ${isSelected
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300'
                        }`}
                    >
                      {isSelected && <Check size={12} className="mr-1.5" />}
                      {seg.replace('CONJUNTO UNIFORMA ESCOLAR ', '')}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                onClick={() => setEditando(null)}
                className="px-5 py-2 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
              >
                {t.lancamentos.cancelar}
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="flex items-center px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm disabled:opacity-50"
              >
                {saving ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Save size={16} className="mr-2" />}
                {t.transferencias.salvarAlteracoes}
              </button>
            </div>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
          <School className="mr-3 text-blue-600" />
          {t.escolas.titulo}
        </h2>
        <p className="text-gray-600">{t.escolas.subtitulo}</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.escolas.nomeEscola} *</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Ex: EMEF Professora Maria Silva"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.escolas.emailEscola}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="escola@educacao.gov.br"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t.escolas.segmentosEnsino} *</label>
            <div className="flex flex-wrap gap-2">
              {SEGMENTOS_ENSINO.map((seg) => {
                const isSelected = segmentosSelecionados.includes(seg);
                return (
                  <button
                    key={seg}
                    type="button"
                    onClick={() => toggleSegmento(seg)}
                    className={`px-4 py-2 rounded-lg border text-sm transition-all flex items-center ${isSelected
                      ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300 hover:bg-blue-50'
                      }`}
                  >
                    {isSelected && <Check size={14} className="mr-2" />}
                    {seg.replace('CONJUNTO UNIFORMA ESCOLAR ', '')}
                  </button>
                );
              })}
            </div>

            {segmentosSelecionados.length > 0 && (
              <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Selecionados:</p>
                <p className="text-sm text-slate-700">
                  {segmentosSelecionados.map(s => s.replace('CONJUNTO UNIFORMA ESCOLAR ', '')).join(', ')}
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
            >
              {saving ? <Loader2 size={18} className="mr-2 animate-spin" /> : <Save size={18} className="mr-2" />}
              {saving ? t.cadastros.salvando : t.escolas.salvarEscola}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-slate-50 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">{t.escolas.cadastradas}</h3>
            <span className="text-xs text-gray-500">{filteredEscolas.length} de {escolas.length} {t.escolas.titulo.toLowerCase().replace('cadastro de ', '')}(s)</span>
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder={t.escolas.buscarEscola}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all shadow-sm"
              />
            </div>
            <div className="relative w-full md:w-72">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter size={16} className="text-gray-400" />
              </div>
              <select
                value={filterSegmento}
                onChange={(e) => setFilterSegmento(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all shadow-sm appearance-none"
              >
                <option value="">{t.escolas.todosSegmentos}</option>
                {SEGMENTOS_ENSINO.map(seg => (
                  <option key={seg} value={seg}>
                    {seg.replace('CONJUNTO UNIFORME ESCOLAR ', '').replace('EJA', 'NCEJA')}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <X
                  size={14}
                  className={`text-gray-400 cursor-pointer hover:text-red-500 transition-colors ${filterSegmento ? 'block' : 'hidden'}`}
                  onClick={() => setFilterSegmento('')}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                <th className="px-6 py-3 font-medium">{t.escolas.nomeEscola} / E-mail</th>
                <th className="px-6 py-3 font-medium">{t.escolas.segmentosEnsino}</th>
                <th className="px-6 py-3 font-medium text-center">{t.lancamentos.status}</th>
                <th className="px-6 py-3 font-medium text-right">{t.common.acoes}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    <Loader2 size={18} className="mx-auto animate-spin opacity-30 mb-2" />
                    {t.common.carregando}
                  </td>
                </tr>
              ) : filteredEscolas.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    {searchTerm || filterSegmento ? t.escolas.nenhumaEncontrada : t.lancamentos.semRegistros}
                  </td>
                </tr>
              ) : (
                filteredEscolas.map((escola) => (
                  <tr key={escola.id} className={`hover:bg-slate-50 transition-colors ${escola.ativo === false ? 'opacity-50' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-800">{escola.nome}</div>
                      <div className="text-xs text-gray-500">{escola.email || '-'}</div>
                    </td>
                    <td className="px-6 py-4">
                      {(escola.segmentos || []).length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {escola.segmentos.map(seg => (
                            <span key={seg} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] uppercase font-semibold">
                              {seg.replace('CONJUNTO UNIFORME ESCOLAR ', '').replace('EJA', 'NCEJA')}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Nenhum segmento</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${escola.ativo === false
                        ? 'bg-red-100 text-red-600'
                        : 'bg-green-100 text-green-600'
                        }`}>
                        {escola.ativo === false ? t.escolas.inativa : t.escolas.ativa}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Edit */}
                        <button
                          onClick={() => handleEdit(escola)}
                          className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Pencil size={15} />
                        </button>
                        {/* Deactivate / Reactivate */}
                        <button
                          onClick={() => handleToggleAtivo(escola)}
                          className={`p-2 rounded-lg transition-colors ${escola.ativo === false
                            ? 'text-green-500 hover:bg-green-50'
                            : 'text-amber-500 hover:bg-amber-50'
                            }`}
                          title={escola.ativo === false ? 'Reativar' : 'Desativar'}
                        >
                          <Power size={15} />
                        </button>
                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(escola.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
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
