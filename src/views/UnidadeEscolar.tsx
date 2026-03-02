import React, { useState, useEffect } from 'react';
import { EscolaCadastro } from '../types';
import { Save, Trash2, School, Check } from 'lucide-react';
import { SEGMENTOS_ENSINO } from '../constants';

export const UnidadeEscolar: React.FC = () => {
  const [escolas, setEscolas] = useState<EscolaCadastro[]>([]);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [segmentosSelecionados, setSegmentosSelecionados] = useState<string[]>([]);

  useEffect(() => {
    const dadosSalvos = localStorage.getItem('@Uniformes:escolas');
    if (dadosSalvos) {
      setEscolas(JSON.parse(dadosSalvos));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('@Uniformes:escolas', JSON.stringify(escolas));
  }, [escolas]);

  const toggleSegmento = (segmento: string) => {
    setSegmentosSelecionados(prev =>
      prev.includes(segmento)
        ? prev.filter(s => s !== segmento)
        : [...prev, segmento]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !email || segmentosSelecionados.length === 0) {
      alert('Por favor, preencha todos os campos e selecione ao menos um segmento.');
      return;
    }

    const novaEscola: EscolaCadastro = {
      id: crypto.randomUUID(),
      nome,
      email,
      segmentos: segmentosSelecionados
    };

    setEscolas([...escolas, novaEscola]);
    setNome('');
    setEmail('');
    setSegmentosSelecionados([]);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Deseja realmente excluir esta unidade escolar?')) {
      setEscolas(escolas.filter(e => e.id !== id));
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
          <School className="mr-3 text-blue-600" />
          Cadastro de Unidade Escolar
        </h2>
        <p className="text-gray-600">Registre as escolas que utilizarão o sistema.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Escola *</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mail da Escola *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="escola@educacao.gov.br"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Segmentos de Ensino (Etapas Atendidas) *</label>
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
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Save size={18} className="mr-2" />
              Salvar Escola
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-slate-50">
          <h3 className="font-semibold text-gray-800">Escolas Cadastradas</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                <th className="px-6 py-3 font-medium">Escola / E-mail</th>
                <th className="px-6 py-3 font-medium">Segmentos Atendidos</th>
                <th className="px-6 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {escolas.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                    Nenhuma escola cadastrada ainda.
                  </td>
                </tr>
              ) : (
                escolas.map((escola) => (
                  <tr key={escola.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-800">{escola.nome}</div>
                      <div className="text-xs text-gray-500">{escola.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {(escola.segmentos || []).map(seg => (
                          <span key={seg} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] uppercase font-semibold">
                            {seg.replace('CONJUNTO UNIFORMA ESCOLAR ', '')}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(escola.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors inline-flex"
                        title="Excluir"
                      >
                        <Trash2 size={16} />
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
