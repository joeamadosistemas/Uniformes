import React from 'react';
import { RegistroUniforme, Filtros } from '../types';
import { CATEGORIAS_UNIFORMES } from '../constants';
import { Edit2, Trash2, FileText, FileSpreadsheet } from 'lucide-react';
import { format } from 'date-fns';
import { useT } from '../lib/LanguageContext';

interface Props {
  registros: RegistroUniforme[];
  filtros: Filtros;
  setFiltros: React.Dispatch<React.SetStateAction<Filtros>>;
  onEdit: (registro: RegistroUniforme) => void;
  onDelete: (id: string) => void;
  onExportPDF: () => void;
  onExportExcel: () => void;
}

export const UniformTable: React.FC<Props> = ({
  registros,
  filtros,
  setFiltros,
  onEdit,
  onDelete,
  onExportPDF,
  onExportExcel
}) => {
  const { t } = useT();

  const tiposDisponiveisFiltro = filtros.categoria
    ? CATEGORIAS_UNIFORMES[filtros.categoria]
    : Object.values(CATEGORIAS_UNIFORMES).flat();

  return (
    <div className="glass rounded-3xl shadow-xl border border-gray-100 dark:border-zinc-800 overflow-hidden mt-12 transition-all duration-300">
      <div className="p-8 border-b border-gray-100 dark:border-zinc-800 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h2 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">{t.lancamentos.registros}</h2>
          <p className="text-xs font-medium text-gray-400 dark:text-zinc-500 mt-1 uppercase tracking-widest">{t.lancamentos.histMovimentacoes}</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={onExportPDF}
            className="flex items-center px-5 py-2.5 bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-500/20 transition-all text-xs font-bold uppercase tracking-widest"
          >
            <FileText size={16} className="mr-2" />
            {t.lancamentos.gerarPDF}
          </button>
          <button
            onClick={onExportExcel}
            className="flex items-center px-5 py-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl hover:bg-emerald-500/20 transition-all text-xs font-bold uppercase tracking-widest"
          >
            <FileSpreadsheet size={16} className="mr-2" />
            {t.lancamentos.exportarExcel}
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-gray-50/50 dark:bg-zinc-900/30 p-6 border-b border-gray-100 dark:border-zinc-800 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest ml-1">{t.lancamentos.categoria}</label>
          <select
            value={filtros.categoria}
            onChange={(e) => setFiltros({ ...filtros, categoria: e.target.value, tipo_uniforme: '' })}
            className="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl text-sm font-semibold text-zinc-900 dark:text-white focus:ring-2 focus:ring-[#005A9C] outline-none transition-all"
          >
            <option value="">{t.lancamentos.todasCategorias}</option>
            {Object.keys(CATEGORIAS_UNIFORMES).map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest ml-1">{t.lancamentos.tipoUniforme}</label>
          <select
            value={filtros.tipo_uniforme}
            onChange={(e) => setFiltros({ ...filtros, tipo_uniforme: e.target.value })}
            className="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl text-sm font-semibold text-zinc-900 dark:text-white focus:ring-2 focus:ring-[#005A9C] outline-none transition-all"
          >
            <option value="">{t.lancamentos.todosTipos}</option>
            {Array.from(new Set(tiposDisponiveisFiltro)).map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest ml-1">{t.lancamentos.dataRegistro}</label>
          <input
            type="date"
            value={filtros.data}
            onChange={(e) => setFiltros({ ...filtros, data: e.target.value })}
            className="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl text-sm font-semibold text-zinc-900 dark:text-white focus:ring-2 focus:ring-[#005A9C] outline-none transition-all"
          />
        </div>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 dark:bg-zinc-900/50 text-gray-400 dark:text-zinc-500 text-[10px] font-bold uppercase tracking-widest border-b border-gray-100 dark:border-zinc-800">
              <th className="px-8 py-4">{t.lancamentos.data}</th>
              <th className="px-8 py-4">{t.lancamentos.categoriaItem}</th>
              <th className="px-8 py-4 text-center">{t.lancamentos.alunos}</th>
              <th className="px-8 py-4 text-center">{t.lancamentos.sobrando}</th>
              <th className="px-8 py-4 text-center">{t.lancamentos.faltando}</th>
              <th className="px-8 py-4 text-right">{t.common.acoes}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {registros.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  {t.lancamentos.semRegistros}
                </td>
              </tr>
            ) : (
              registros.map((registro) => (
                <tr key={registro.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-8 py-5 whitespace-nowrap text-xs font-bold text-gray-400 dark:text-zinc-500 tracking-wider">
                    {format(new Date(registro.data_registro), 'dd/MM/yyyy')}
                  </td>
                  <td className="px-8 py-5">
                    <div className="text-[10px] font-black text-[#005A9C] dark:text-[#66b3ff] mb-1 uppercase tracking-widest">{registro.categoria || t.lancamentos.naoDefinida}</div>
                    <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-tight">{registro.tipo_uniforme}</div>
                  </td>
                  <td className="px-8 py-5 text-center font-black text-zinc-900 dark:text-white">
                    {registro.qtd_alunos}
                  </td>
                  <td className="px-8 py-5 text-center">
                    {registro.qtd_sobrando > 0 ? (
                      <div className="inline-flex flex-col items-center">
                        <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">{registro.qtd_sobrando} {t.lancamentos.unidades}</span>
                        <span className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest mt-1">{t.lancamentos.tamanhoSobrando}: {registro.tamanho_sobrando || '-'}</span>
                      </div>
                    ) : (
                      <span className="text-gray-300 dark:text-zinc-800">-</span>
                    )}
                  </td>
                  <td className="px-8 py-5 text-center">
                    {registro.qtd_faltando > 0 ? (
                      <div className="inline-flex flex-col items-center">
                        <span className="text-sm font-black text-red-600 dark:text-red-400">{registro.qtd_faltando} {t.lancamentos.unidades}</span>
                        <span className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest mt-1">{t.lancamentos.tamanhoFaltando}: {registro.tamanho_faltando || '-'}</span>
                      </div>
                    ) : (
                      <span className="text-gray-300 dark:text-zinc-800">-</span>
                    )}
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => onEdit(registro)}
                        className="w-9 h-9 flex items-center justify-center text-blue-600 hover:bg-blue-500/10 dark:hover:bg-blue-500/20 rounded-xl transition-all"
                        title={t.common.editar}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(t.lancamentos.confirmExcluir)) {
                            onDelete(registro.id);
                          }
                        }}
                        className="w-9 h-9 flex items-center justify-center text-red-600 hover:bg-red-500/10 dark:hover:bg-red-500/20 rounded-xl transition-all"
                        title={t.common.excluir}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-gray-100 bg-gray-50 text-xs text-gray-500 flex justify-between items-center">
        <span>{t.lancamentos.mostrando} {registros.length} {t.lancamentos.registros}</span>
      </div>
    </div>
  );
};
