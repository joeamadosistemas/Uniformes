import React from 'react';
import { RegistroUniforme } from '../types';
import { Users, AlertTriangle, TrendingDown, ClipboardList } from 'lucide-react';

interface Props {
  registros: RegistroUniforme[];
}

export const DashboardStats: React.FC<Props> = ({ registros }) => {
  const totais = registros.reduce(
    (acc, curr) => ({
      sobrando: acc.sobrando + (curr.qtd_sobrando || 0),
      faltando: acc.faltando + (curr.qtd_faltando || 0),
    }),
    { sobrando: 0, faltando: 0 }
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center space-x-4">
        <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
          <ClipboardList size={24} />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Registros Realizados</p>
          <p className="text-2xl font-bold text-gray-900">{registros.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center space-x-4">
        <div className="p-3 bg-red-100 text-red-600 rounded-lg">
          <AlertTriangle size={24} />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Total Faltando</p>
          <p className="text-2xl font-bold text-gray-900">{totais.faltando}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center space-x-4">
        <div className="p-3 bg-green-100 text-green-600 rounded-lg">
          <TrendingDown size={24} />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Total Sobrando</p>
          <p className="text-2xl font-bold text-gray-900">{totais.sobrando}</p>
        </div>
      </div>
    </div>
  );
};
