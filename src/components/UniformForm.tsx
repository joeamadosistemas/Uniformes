import React, { useState, useEffect } from 'react';
import { RegistroUniforme } from '../types';
import { CATEGORIAS_UNIFORMES, TAMANHOS_DISPONIVEIS } from '../constants';
import { Plus, Trash2, Save, RefreshCw, X, ChevronDown } from 'lucide-react';

interface UniformItem {
  id: string;
  tipo_uniforme: string;
  qtd_sobrando: number;
  tamanho_sobrando: string;
  qtd_faltando: number;
  tamanho_faltando: string;
}

// Representa um bloco inteiro de categoria + seus itens
interface CategoriaBloco {
  id: string;
  categoria: string;
  items: UniformItem[];
}

interface Props {
  onSave: (registro: Omit<RegistroUniforme, 'id' | 'data_registro' | 'escola' | 'diretor'>[]) => void;
  registroEmEdicao?: RegistroUniforme | null;
  onCancelEdit?: () => void;
  categoriaDefault?: string;
  categoriaLocked?: boolean;
}

const newItem = (): UniformItem => ({
  id: crypto.randomUUID(),
  tipo_uniforme: '',
  qtd_sobrando: 0,
  tamanho_sobrando: '',
  qtd_faltando: 0,
  tamanho_faltando: '',
});

const newBloco = (): CategoriaBloco => ({
  id: crypto.randomUUID(),
  categoria: '',
  items: [newItem()],
});

export const UniformForm: React.FC<Props> = ({ onSave, registroEmEdicao, onCancelEdit, categoriaDefault = '', categoriaLocked = false }) => {
  const [qtdAlunos, setQtdAlunos] = useState(0);
  const [blocos, setBlocos] = useState<CategoriaBloco[]>(() => [{ ...newBloco(), categoria: categoriaDefault }]);

  useEffect(() => {
    if (registroEmEdicao) {
      setQtdAlunos(registroEmEdicao.qtd_alunos || 0);
      // No modo edição mantemos compatibilidade: um único bloco
      setBlocos([{
        id: registroEmEdicao.id,
        categoria: registroEmEdicao.categoria || '',
        items: [{
          id: registroEmEdicao.id,
          tipo_uniforme: registroEmEdicao.tipo_uniforme,
          qtd_sobrando: registroEmEdicao.qtd_sobrando || 0,
          tamanho_sobrando: registroEmEdicao.tamanho_sobrando || '',
          qtd_faltando: registroEmEdicao.qtd_faltando || 0,
          tamanho_faltando: registroEmEdicao.tamanho_faltando || '',
        }],
      }]);
    } else {
      setQtdAlunos(0);
      setBlocos([{ ...newBloco(), categoria: categoriaDefault }]);
    }
  }, [registroEmEdicao, categoriaDefault]);

  // ── Funções de manipulação de blocos ──────────────────────────
  const handleAddBloco = () => {
    setBlocos(prev => [...prev, newBloco()]);
  };

  const handleRemoveBloco = (blocoId: string) => {
    if (blocos.length === 1) return;
    setBlocos(prev => prev.filter(b => b.id !== blocoId));
  };

  const handleCategoriaChange = (blocoId: string, categoria: string) => {
    setBlocos(prev => prev.map(b =>
      b.id === blocoId
        ? { ...b, categoria, items: b.items.map(item => ({ ...item, tipo_uniforme: '' })) }
        : b
    ));
  };

  // ── Funções de manipulação de itens dentro do bloco ───────────
  const handleAddItem = (blocoId: string) => {
    setBlocos(prev => prev.map(b =>
      b.id === blocoId ? { ...b, items: [...b.items, newItem()] } : b
    ));
  };

  const handleRemoveItem = (blocoId: string, itemId: string) => {
    setBlocos(prev => prev.map(b => {
      if (b.id !== blocoId || b.items.length === 1) return b;
      return { ...b, items: b.items.filter(item => item.id !== itemId) };
    }));
  };

  const handleItemChange = (blocoId: string, itemId: string, field: keyof UniformItem, value: string | number) => {
    setBlocos(prev => prev.map(b =>
      b.id !== blocoId ? b : {
        ...b,
        items: b.items.map(item =>
          item.id === itemId ? { ...item, [field]: value } : item
        ),
      }
    ));
  };

  // ── Submit ────────────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validação
    for (const bloco of blocos) {
      if (!bloco.categoria) {
        alert('Por favor, selecione a Categoria em todos os blocos.');
        return;
      }
      if (bloco.items.some(item => !item.tipo_uniforme)) {
        alert(`Por favor, selecione o Tipo de Uniforme em todos os itens do bloco "${bloco.categoria}".`);
        return;
      }
    }

    const dataToSave = blocos.flatMap(bloco =>
      bloco.items.map(item => ({
        qtd_alunos: qtdAlunos,
        categoria: bloco.categoria,
        tipo_uniforme: item.tipo_uniforme,
        qtd_sobrando: item.qtd_sobrando,
        tamanho_sobrando: item.tamanho_sobrando,
        qtd_faltando: item.qtd_faltando,
        tamanho_faltando: item.tamanho_faltando,
      }))
    );

    onSave(dataToSave);

    if (!registroEmEdicao) {
      setQtdAlunos(0);
      setBlocos([{ ...newBloco(), categoria: categoriaDefault }]);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Cabeçalho */}
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
        {/* Quantidade de Alunos */}
        <div className="max-w-xs">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quantidade de Alunos na unidade *
          </label>
          <input
            type="number"
            min="0"
            value={qtdAlunos}
            onChange={(e) => setQtdAlunos(Number(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
            required
          />
        </div>

        {/* ── Blocos de Categoria ── */}
        <div className="space-y-5">
          {blocos.map((bloco, blocoIdx) => {
            const tiposDisponiveis = bloco.categoria ? CATEGORIAS_UNIFORMES[bloco.categoria] ?? [] : [];

            return (
              <div
                key={bloco.id}
                className="border border-blue-100 rounded-xl overflow-hidden"
              >
                {/* Cabeçalho do bloco */}
                <div className="bg-blue-50/60 px-5 py-3 flex items-center justify-between gap-4 border-b border-blue-100">
                  <div className="flex items-center gap-3 flex-1">
                    <ChevronDown size={16} className="text-blue-400 shrink-0" />
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
                        Categoria / Nível Escolar {blocoIdx + 1} *
                        {blocoIdx === 0 && categoriaLocked && (
                          <span className="ml-2 text-blue-400 font-normal normal-case tracking-normal">(definida pela unidade)</span>
                        )}
                      </label>
                      <select
                        value={bloco.categoria}
                        onChange={(e) => handleCategoriaChange(bloco.id, e.target.value)}
                        disabled={blocoIdx === 0 && categoriaLocked}
                        className={`w-full px-3 py-1.5 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-sm font-medium ${blocoIdx === 0 && categoriaLocked
                          ? 'bg-blue-50 cursor-not-allowed opacity-80'
                          : 'bg-white'
                          }`}
                        required
                      >
                        <option value="">Selecione a Categoria...</option>
                        {Object.keys(CATEGORIAS_UNIFORMES).map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Botão remover bloco */}
                  {blocos.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveBloco(bloco.id)}
                      className="p-1.5 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                      title="Remover esta categoria"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                {/* Tabela de itens */}
                <div className="overflow-x-auto p-3">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="py-2 px-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">Tipo de Uniforme *</th>
                        <th className="py-2 px-2 text-xs font-semibold text-green-700 uppercase tracking-wider bg-green-50/50">Qtd Sobrando</th>
                        <th className="py-2 px-2 text-xs font-semibold text-green-700 uppercase tracking-wider bg-green-50/50">Tam. Sobrando</th>
                        <th className="py-2 px-2 text-xs font-semibold text-red-700 uppercase tracking-wider bg-red-50/50">Qtd Faltando</th>
                        <th className="py-2 px-2 text-xs font-semibold text-red-700 uppercase tracking-wider bg-red-50/50">Tam. Faltando</th>
                        <th className="py-2 px-2 text-xs font-semibold text-gray-600 uppercase tracking-wider text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {bloco.items.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-3 px-2 min-w-[200px]">
                            <select
                              value={item.tipo_uniforme}
                              onChange={(e) => handleItemChange(bloco.id, item.id, 'tipo_uniforme', e.target.value)}
                              disabled={!bloco.categoria}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none text-sm bg-white disabled:bg-gray-50 disabled:cursor-not-allowed"
                              required
                            >
                              <option value="">Selecione...</option>
                              {tiposDisponiveis.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </td>
                          <td className="py-3 px-2 bg-green-50/30">
                            <input
                              type="number" min="0"
                              value={item.qtd_sobrando}
                              onChange={(e) => handleItemChange(bloco.id, item.id, 'qtd_sobrando', Number(e.target.value))}
                              className="w-24 px-3 py-2 border border-green-200 rounded-lg focus:ring-1 focus:ring-green-500 outline-none text-sm"
                            />
                          </td>
                          <td className="py-3 px-2 bg-green-50/30">
                            <select
                              value={item.tamanho_sobrando}
                              onChange={(e) => handleItemChange(bloco.id, item.id, 'tamanho_sobrando', e.target.value)}
                              className="w-32 px-3 py-2 border border-green-200 rounded-lg focus:ring-1 focus:ring-green-500 outline-none text-sm bg-white"
                            >
                              <option value="">Selecione...</option>
                              {TAMANHOS_DISPONIVEIS.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </td>
                          <td className="py-3 px-2 bg-red-50/30">
                            <input
                              type="number" min="0"
                              value={item.qtd_faltando}
                              onChange={(e) => handleItemChange(bloco.id, item.id, 'qtd_faltando', Number(e.target.value))}
                              className="w-24 px-3 py-2 border border-red-200 rounded-lg focus:ring-1 focus:ring-red-500 outline-none text-sm"
                            />
                          </td>
                          <td className="py-3 px-2 bg-red-50/30">
                            <select
                              value={item.tamanho_faltando}
                              onChange={(e) => handleItemChange(bloco.id, item.id, 'tamanho_faltando', e.target.value)}
                              className="w-32 px-3 py-2 border border-red-200 rounded-lg focus:ring-1 focus:ring-red-500 outline-none text-sm bg-white"
                            >
                              <option value="">Selecione...</option>
                              {TAMANHOS_DISPONIVEIS.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </td>
                          <td className="py-3 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(bloco.id, item.id)}
                              disabled={bloco.items.length === 1}
                              className="p-2 text-gray-400 hover:text-red-500 disabled:opacity-30 transition-colors"
                              title="Remover linha"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Botão adicionar tipo dentro do bloco */}
                  {!registroEmEdicao && (
                    <button
                      type="button"
                      onClick={() => handleAddItem(bloco.id)}
                      className="mt-2 ml-2 flex items-center text-xs font-medium text-blue-500 hover:text-blue-700 transition-colors"
                    >
                      <Plus size={14} className="mr-1" />
                      Adicionar tipo de uniforme
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Botão adicionar nova categoria — oculto para escolas com categoria única (travada) */}
        {!registroEmEdicao && !categoriaLocked && (
          <button
            type="button"
            onClick={handleAddBloco}
            className="w-full py-3 border-2 border-dashed border-blue-200 rounded-xl text-blue-500 hover:border-blue-400 hover:bg-blue-50/40 hover:text-blue-700 transition-all font-medium text-sm flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            Adicionar outra Categoria / Nível Escolar
          </button>
        )}


        {/* Rodapé com botões */}
        <div className="flex justify-end items-center pt-4 border-t border-gray-100 gap-3">
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
      </form>
    </div>
  );
};
