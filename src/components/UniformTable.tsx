import React from 'react';
import { RegistroUniforme, Filtros } from '../types';
import { CATEGORIAS_UNIFORMES } from '../constants';
import { Edit2, Trash2, FileText, FileSpreadsheet } from 'lucide-react';
import { format } from 'date-fns';

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

  const tiposDisponiveisFiltro = filtros.categoria 
    ? CATEGORIAS_UNIFORMES[filtros.categoria] 
    : Object.values(CATEGORIAS_UNIFORMES).flat();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mt-8">
      <div className="p-6 border-b border-gray-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <h2 className="text-lg font-semibold text-gray-800">Registros de Uniformes</h2>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onExportPDF}
            className="flex items-center px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
          >
            <FileText size={16} className="mr-2" />
            Gerar PDF
          </button>
          <button
            onClick={onExportExcel}
            className="flex items-center px-4 py-2 bg-green-50 text-green-600 border border-green-200 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
          >
            <FileSpreadsheet size={16} className="mr-2" />
            Exportar Excel
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-slate-50 p-4 border-b border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <select
            value={filtros.categoria}
            onChange={(e) => setFiltros({ ...filtros, categoria: e.target.value, tipo_uniforme: '' })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
          >
            <option value="">Todas as Categorias</option>
            {Object.keys(CATEGORIAS_UNIFORMES).map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div>
          <select
            value={filtros.tipo_uniforme}
            onChange={(e) => setFiltros({ ...filtros, tipo_uniforme: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
          >
            <option value="">Todos os Tipos</option>
            {Array.from(new Set(tiposDisponiveisFiltro)).map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <input
            type="date"
            value={filtros.data}
            onChange={(e) => setFiltros({ ...filtros, data: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <th className="px-6 py-4 font-medium">Data</th>
              <th className="px-6 py-4 font-medium">Categoria / Item</th>
              <th className="px-6 py-4 font-medium text-center">Alunos</th>
              <th className="px-6 py-4 font-medium text-center">Sobrando</th>
              <th className="px-6 py-4 font-medium text-center">Faltando</th>
              <th className="px-6 py-4 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {registros.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  Nenhum registro encontrado com os filtros atuais.
                </td>
              </tr>
            ) : (
              registros.map((registro) => (
                <tr key={registro.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {format(new Date(registro.data_registro), 'dd/MM/yyyy')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs font-semibold text-blue-600 mb-1">{registro.categoria || 'Não definida'}</div>
                    <div className="font-medium text-gray-900 leading-tight">{registro.tipo_uniforme}</div>
                  </td>
                  <td className="px-6 py-4 text-center font-medium text-gray-700">
                    {registro.qtd_alunos}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {registro.qtd_sobrando > 0 ? (
                      <div className="inline-flex flex-col items-center">
                        <span className="font-bold text-green-600">{registro.qtd_sobrando} un.</span>
                        <span className="text-xs text-gray-500">Tam: {registro.tamanho_sobrando || '-'}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {registro.qtd_faltando > 0 ? (
                      <div className="inline-flex flex-col items-center">
                        <span className="font-bold text-red-600">{registro.qtd_faltando} un.</span>
                        <span className="text-xs text-gray-500">Tam: {registro.tamanho_faltando || '-'}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => onEdit(registro)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-flex mr-2"
                      title="Editar"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => {
                        if(window.confirm('Tem certeza que deseja excluir este registro?')) {
                          onDelete(registro.id);
                        }
                      }}
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
      
      <div className="p-4 border-t border-gray-100 bg-gray-50 text-xs text-gray-500 flex justify-between items-center">
        <span>Mostrando {registros.length} registros</span>
      </div>
    </div>
  );
};
