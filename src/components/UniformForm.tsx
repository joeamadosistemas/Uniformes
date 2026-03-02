import React, { useState, useEffect } from 'react';
import { RegistroUniforme } from '../types';
import { CATEGORIAS_UNIFORMES, TAMANHOS_DISPONIVEIS } from '../constants';
import { Plus, Trash2, Save, RefreshCw, X } from 'lucide-react';

interface UniformItem {
  id: string;
  tipo_uniforme: string;
  qtd_sobrando: number;
  tamanho_sobrando: string;
  qtd_faltando: number;
  tamanho_faltando: string;
}

interface Props {
  onSave: (registro: Omit<RegistroUniforme, 'id' | 'data_registro' | 'escola' | 'diretor'>[]) => void;
  registroEmEdicao?: RegistroUniforme | null;
  onCancelEdit?: () => void;
}

export const UniformForm: React.FC<Props> = ({ onSave, registroEmEdicao, onCancelEdit }) => {
  const [qtdAlunos, setQtdAlunos] = useState(0);
  const [categoria, setCategoria] = useState('');
  const [items, setItems] = useState<UniformItem[]>([
    { id: crypto.randomUUID(), tipo_uniforme: '', qtd_sobrando: 0, tamanho_sobrando: '', qtd_faltando: 0, tamanho_faltando: '' }
  ]);

  useEffect(() => {
    if (registroEmEdicao) {
      setQtdAlunos(registroEmEdicao.qtd_alunos || 0);
      setCategoria(registroEmEdicao.categoria || '');
      setItems([{
        id: registroEmEdicao.id,
        tipo_uniforme: registroEmEdicao.tipo_uniforme,
        qtd_sobrando: registroEmEdicao.qtd_sobrando || 0,
        tamanho_sobrando: registroEmEdicao.tamanho_sobrando || '',
        qtd_faltando: registroEmEdicao.qtd_faltando || 0,
        tamanho_faltando: registroEmEdicao.tamanho_faltando || '',
      }]);
    } else {
      setQtdAlunos(0);
      setCategoria('');
      setItems([{ id: crypto.randomUUID(), tipo_uniforme: '', qtd_sobrando: 0, tamanho_sobrando: '', qtd_faltando: 0, tamanho_faltando: '' }]);
    }
  }, [registroEmEdicao]);

  const handleAddItem = () => {
    setItems(prev => [
      ...prev,
      { id: crypto.randomUUID(), tipo_uniforme: '', qtd_sobrando: 0, tamanho_sobrando: '', qtd_faltando: 0, tamanho_faltando: '' }
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length === 1) return;
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleItemChange = (id: string, field: keyof UniformItem, value: string | number) => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoria || items.some(item => !item.tipo_uniforme)) {
      alert('Por favor, preencha a Categoria e todos os Tipos de Uniforme.');
      return;
    }

    const dataToSave = items.map(item => ({
      qtd_alunos: qtdAlunos,
      categoria,
      tipo_uniforme: item.tipo_uniforme,
      qtd_sobrando: item.qtd_sobrando,
      tamanho_sobrando: item.tamanho_sobrando,
      qtd_faltando: item.qtd_faltando,
      tamanho_faltando: item.tamanho_faltando,
    }));

    onSave(dataToSave);

    if (!registroEmEdicao) {
      setItems([{ id: crypto.randomUUID(), tipo_uniforme: '', qtd_sobrando: 0, tamanho_sobrando: '', qtd_faltando: 0, tamanho_faltando: '' }]);
    }
  };

  const tiposDisponiveis = categoria ? CATEGORIAS_UNIFORMES[categoria] : [];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="bg-slate-50 border-b border-gray-100 px-6 py-4 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800">
          {registroEmEdicao ? 'Editar Registro' : 'Registrar Uniformes'}
        </h2>
        {registroEmEdicao && (
          <button onClick={onCancelEdit} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-gray-100">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade de Alunos na unidade *</label>
            <input
              type="number"
              min="0"
              value={qtdAlunos}
              onChange={(e) => setQtdAlunos(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria / Nível Escolar *</label>
            <select
              value={categoria}
              onChange={(e) => {
                setCategoria(e.target.value);
                setItems(prev => prev.map(item => ({ ...item, tipo_uniforme: '' })));
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors bg-white"
              required
            >
              <option value="">Selecione a Categoria...</option>
              {Object.keys(CATEGORIAS_UNIFORMES).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-3 px-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">Tipo de Uniforme *</th>
                <th className="py-3 px-2 text-xs font-semibold text-green-700 uppercase tracking-wider bg-green-50/50">Qtd Sobrando</th>
                <th className="py-3 px-2 text-xs font-semibold text-green-700 uppercase tracking-wider bg-green-50/50">Tam. Sobrando</th>
                <th className="py-3 px-2 text-xs font-semibold text-red-700 uppercase tracking-wider bg-red-50/50">Qtd Faltando</th>
                <th className="py-3 px-2 text-xs font-semibold text-red-700 uppercase tracking-wider bg-red-50/50">Tam. Faltando</th>
                <th className="py-3 px-2 text-xs font-semibold text-gray-600 uppercase tracking-wider text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 px-2 min-w-[200px]">
                    <select
                      value={item.tipo_uniforme}
                      onChange={(e) => handleItemChange(item.id, 'tipo_uniforme', e.target.value)}
                      disabled={!categoria}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none text-sm bg-white disabled:bg-gray-50"
                      required
                    >
                      <option value="">Selecione...</option>
                      {tiposDisponiveis.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </td>
                  <td className="py-4 px-2 bg-green-50/30">
                    <input
                      type="number"
                      min="0"
                      value={item.qtd_sobrando}
                      onChange={(e) => handleItemChange(item.id, 'qtd_sobrando', Number(e.target.value))}
                      className="w-24 px-3 py-2 border border-green-200 rounded-lg focus:ring-1 focus:ring-green-500 outline-none text-sm"
                    />
                  </td>
                  <td className="py-4 px-2 bg-green-50/30">
                    <select
                      value={item.tamanho_sobrando}
                      onChange={(e) => handleItemChange(item.id, 'tamanho_sobrando', e.target.value)}
                      className="w-32 px-3 py-2 border border-green-200 rounded-lg focus:ring-1 focus:ring-green-500 outline-none text-sm bg-white"
                    >
                      <option value="">Selecione...</option>
                      {TAMANHOS_DISPONIVEIS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </td>
                  <td className="py-4 px-2 bg-red-50/30">
                    <input
                      type="number"
                      min="0"
                      value={item.qtd_faltando}
                      onChange={(e) => handleItemChange(item.id, 'qtd_faltando', Number(e.target.value))}
                      className="w-24 px-3 py-2 border border-red-200 rounded-lg focus:ring-1 focus:ring-red-500 outline-none text-sm"
                    />
                  </td>
                  <td className="py-4 px-2 bg-red-50/30">
                    <select
                      value={item.tamanho_faltando}
                      onChange={(e) => handleItemChange(item.id, 'tamanho_faltando', e.target.value)}
                      className="w-32 px-3 py-2 border border-red-200 rounded-lg focus:ring-1 focus:ring-red-500 outline-none text-sm bg-white"
                    >
                      <option value="">Selecione...</option>
                      {TAMANHOS_DISPONIVEIS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </td>
                  <td className="py-4 px-2 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      disabled={items.length === 1}
                      className="p-2 text-gray-400 hover:text-red-500 disabled:opacity-30 transition-colors"
                      title="Remover linha"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
          {!registroEmEdicao && (
            <button
              type="button"
              onClick={handleAddItem}
              className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              <Plus size={18} className="mr-1" />
              Adicionar outro Tipo de Uniforme
            </button>
          )}

          <div className="flex space-x-3">
            {registroEmEdicao && (
              <button
                type="button"
                onClick={onCancelEdit}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
            >
              {registroEmEdicao ? <RefreshCw size={18} className="mr-2" /> : <Save size={18} className="mr-2" />}
              {registroEmEdicao ? 'Atualizar Registro' : 'Salvar no Banco de Dados'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
