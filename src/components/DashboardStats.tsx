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
      <div className="glass rounded-2xl p-6 flex items-center space-x-4 shadow-sm hover:shadow-md transition-all duration-300">
        <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
          <ClipboardList size={24} />
        </div>
        <div>
          <p className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Registros Realizados</p>
          <p className="text-3xl font-black text-zinc-900 dark:text-white leading-none mt-1">{registros.length}</p>
        </div>
      </div>

      <div className="glass rounded-2xl p-6 flex items-center space-x-4 shadow-sm hover:shadow-md transition-all duration-300">
        <div className="p-3 bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl">
          <AlertTriangle size={24} />
        </div>
        <div>
          <p className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Total Faltando</p>
          <p className="text-3xl font-black text-zinc-900 dark:text-white leading-none mt-1">{totais.faltando}</p>
        </div>
      </div>

      <div className="glass rounded-2xl p-6 flex items-center space-x-4 shadow-sm hover:shadow-md transition-all duration-300">
        <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
          <TrendingDown size={24} />
        </div>
        <div>
          <p className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Total Sobrando</p>
          <p className="text-3xl font-black text-zinc-900 dark:text-white leading-none mt-1">{totais.sobrando}</p>
        </div>
      </div>
    </div>
  );
};
