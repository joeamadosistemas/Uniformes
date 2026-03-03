import React, { useState, useEffect } from 'react';
import { RegistroUniforme } from '../types';
import { CATEGORIAS_UNIFORMES, TAMANHOS_DISPONIVEIS } from '../constants';
import { Plus, Trash2, Save, RefreshCw, X, ChevronDown } from 'lucide-react';
import { useT } from '../lib/LanguageContext';

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
  /** Lista de categorias que a escola está autorizada a usar. Vazio = todas. */
  categoriasPermitidas?: string[];
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

export const UniformForm: React.FC<Props> = ({ onSave, registroEmEdicao, onCancelEdit, categoriaDefault = '', categoriaLocked = false, categoriasPermitidas = [] }) => {
  const { t } = useT();
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
        alert(t.common.selecioneUnidade); // Or similar key, but let's use a specific one if needed
        return;
      }
      if (bloco.items.some(item => !item.tipo_uniforme)) {
        alert(t.lancamentos.selecione);
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
    <div className="glass rounded-3xl overflow-hidden shadow-xl border border-gray-100 dark:border-zinc-800 transition-all duration-300">
      {/* Cabeçalho */}
      <div className="bg-white/50 dark:bg-zinc-900/50 border-b border-gray-100 dark:border-zinc-800 px-6 py-5 flex justify-between items-center transition-colors">
        <h2 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">
          {registroEmEdicao ? t.lancamentos.editando : t.lancamentos.novoRegistro}
        </h2>
        {registroEmEdicao && (
          <button onClick={onCancelEdit} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-400 hover:text-red-500 transition-all">
            <X size={18} />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-8">
        {/* Quantidade de Alunos */}
        <div className="max-w-xs space-y-2">
          <label className="block text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest ml-1">
            {t.lancamentos.qtdAlunosUnidade}
          </label>
          <input
            type="number"
            min="0"
            value={qtdAlunos}
            onChange={(e) => setQtdAlunos(Number(e.target.value))}
            className="w-full px-5 py-3 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-[#005A9C] dark:focus:ring-[#66b3ff] outline-none transition-all text-zinc-900 dark:text-white font-semibold"
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
                className="bg-gray-50/30 dark:bg-zinc-900/10 border border-gray-100 dark:border-zinc-800 rounded-2xl overflow-hidden transition-all duration-300"
              >
                {/* Cabeçalho do bloco */}
                <div className="bg-[#005A9C]/5 dark:bg-[#66b3ff]/5 px-6 py-4 flex items-center justify-between gap-4 border-b border-gray-100 dark:border-zinc-800">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#005A9C]/10 dark:bg-[#66b3ff]/10 text-[#005A9C] dark:text-[#66b3ff]">
                      <ChevronDown size={18} className={!bloco.categoria ? "animate-pulse" : ""} />
                    </div>
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-[#005A9C] dark:text-[#66b3ff] uppercase tracking-widest mb-1.5 ml-1">
                        {t.lancamentos.categoria} {blocoIdx + 1} *
                        {blocoIdx === 0 && categoriaLocked && (
                          <span className="ml-2 text-zinc-400 font-normal normal-case tracking-normal">{t.lancamentos.padraoUnidade}</span>
                        )}
                      </label>
                      <select
                        value={bloco.categoria}
                        onChange={(e) => handleCategoriaChange(bloco.id, e.target.value)}
                        disabled={(blocoIdx === 0 && categoriaLocked) || qtdAlunos === 0}
                        className={`w-full px-4 py-2.5 border border-gray-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-[#005A9C] outline-none transition-all text-sm font-bold ${((blocoIdx === 0 && categoriaLocked) || qtdAlunos === 0)
                          ? 'bg-gray-100 dark:bg-zinc-800 cursor-not-allowed text-zinc-400 dark:text-zinc-600'
                          : 'bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white'
                          }`}
                        required
                      >
                        <option value="">{t.lancamentos.selecione}</option>
                        {/* Mostra apenas as categorias permitidas para a escola; sem restrição para admins */}
                        {(categoriasPermitidas.length > 0
                          ? categoriasPermitidas.filter(cat => cat in CATEGORIAS_UNIFORMES)
                          : Object.keys(CATEGORIAS_UNIFORMES)
                        ).map(cat => (
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
                      title={t.lancamentos.excluir}
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
                        <th className="py-2 px-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">{t.lancamentos.tipoUniforme} *</th>
                        <th className="py-2 px-2 text-xs font-semibold text-green-700 uppercase tracking-wider bg-green-50/50">{t.lancamentos.qtdSobrando}</th>
                        <th className="py-2 px-2 text-xs font-semibold text-green-700 uppercase tracking-wider bg-green-50/50">{t.lancamentos.tamanhoSobrando}</th>
                        <th className="py-2 px-2 text-xs font-semibold text-red-700 uppercase tracking-wider bg-red-50/50">{t.lancamentos.qtdFaltando}</th>
                        <th className="py-2 px-2 text-xs font-semibold text-red-700 uppercase tracking-wider bg-red-50/50">{t.lancamentos.tamanhoFaltando}</th>
                        <th className="py-2 px-2 text-xs font-semibold text-gray-600 uppercase tracking-wider text-center">{t.common.acoes}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {bloco.items.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-3 px-2 min-w-[200px]">
                            <select
                              value={item.tipo_uniforme}
                              onChange={(e) => handleItemChange(bloco.id, item.id, 'tipo_uniforme', e.target.value)}
                              disabled={!bloco.categoria || qtdAlunos === 0}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-800 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none text-sm bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white disabled:bg-gray-50 dark:disabled:bg-zinc-900 disabled:cursor-not-allowed disabled:text-zinc-400"
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
                      {t.lancamentos.adicionarTipo}
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
            {t.lancamentos.adicionarCategoria}
          </button>
        )}


        {/* Rodapé com botões */}
        <div className="flex justify-end items-center pt-8 border-t border-gray-100 dark:border-zinc-800 gap-4">
          {registroEmEdicao && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="px-8 py-3 bg-gray-100 dark:bg-zinc-900 text-gray-600 dark:text-zinc-400 rounded-xl hover:bg-gray-200 dark:hover:bg-zinc-800 transition-all font-bold text-sm tracking-wide"
            >
              {t.common.cancelar}
            </button>
          )}
          <button
            type="submit"
            className="flex items-center px-10 py-3.5 bg-gradient-to-r from-[#005A9C] to-[#004a80] text-white rounded-xl hover:scale-[1.02] active:scale-95 transition-all font-black text-sm uppercase tracking-widest shadow-lg shadow-blue-500/20"
          >
            {registroEmEdicao ? <RefreshCw size={18} className="mr-2" /> : <Save size={18} className="mr-3" />}
            {registroEmEdicao ? t.lancamentos.atualizarRegistro : t.lancamentos.salvarNoBanco}
          </button>
        </div>
      </form>
    </div>
  );
};
