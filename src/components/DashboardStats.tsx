import React from 'react';
import { RegistroUniforme } from '../types';
import { AlertTriangle, TrendingDown, ClipboardList } from 'lucide-react';
import { useT } from '../lib/LanguageContext';

interface Props {
  registros: RegistroUniforme[];
}

export const DashboardStats: React.FC<Props> = ({ registros }) => {
  const { t } = useT();
  const totais = registros.reduce(
    (acc, curr) => ({
      sobrando: acc.sobrando + (curr.qtd_sobrando || 0),
      faltando: acc.faltando + (curr.qtd_faltando || 0),
    }),
    { sobrando: 0, faltando: 0 }
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6">
      <div className="bg-[#005A9C] dark:bg-[#1452b5] rounded-3xl p-4 md:p-6 flex flex-col justify-between shadow-lg shadow-blue-500/20 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
        <div className="flex justify-between items-start mb-2 md:mb-4">
          <p className="text-[10px] md:text-sm font-bold text-white/80 tracking-wider flex-1 pr-2">{t.lancamentos.registros}</p>
          <div className="p-1.5 md:p-3 bg-white/20 text-white rounded-xl backdrop-blur-sm shadow-inner shrink-0">
            <ClipboardList className="w-4 h-4 md:w-6 md:h-6" />
          </div>
        </div>
        <div>
          <p className="text-2xl md:text-4xl font-black text-white leading-none mt-1">{registros.length}</p>
        </div>
      </div>

      <div className="bg-[#eef2ff] dark:bg-zinc-800/80 rounded-3xl p-4 md:p-6 flex flex-col justify-between shadow-sm border border-blue-100 dark:border-zinc-700 hover:shadow-md hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-red-400/10 rounded-bl-full -z-10"></div>
        <div className="flex justify-between items-start mb-2 md:mb-4 z-10">
          <p className="text-[10px] md:text-sm font-bold text-gray-500 dark:text-zinc-400 tracking-wider flex-1 pr-2">{t.lancamentos.faltando}</p>
          <div className="p-1.5 md:p-3 bg-white dark:bg-zinc-700 text-red-500 rounded-xl shadow-sm shrink-0">
            <AlertTriangle className="w-4 h-4 md:w-6 md:h-6" />
          </div>
        </div>
        <div className="z-10">
          <p className="text-2xl md:text-4xl font-black text-gray-800 dark:text-white leading-none mt-1">{totais.faltando}</p>
        </div>
      </div>

      <div className="bg-[#eef2ff] dark:bg-zinc-800/80 rounded-3xl p-4 md:p-6 flex flex-col justify-between shadow-sm border border-blue-100 dark:border-zinc-700 hover:shadow-md hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-green-400/10 rounded-bl-full -z-10"></div>
        <div className="flex justify-between items-start mb-2 md:mb-4 z-10">
          <p className="text-[10px] md:text-sm font-bold text-gray-500 dark:text-zinc-400 tracking-wider flex-1 pr-2">{t.lancamentos.sobrando}</p>
          <div className="p-1.5 md:p-3 bg-white dark:bg-zinc-700 text-emerald-500 rounded-xl shadow-sm shrink-0">
            <TrendingDown className="w-4 h-4 md:w-6 md:h-6" />
          </div>
        </div>
        <div className="z-10">
          <p className="text-2xl md:text-4xl font-black text-gray-800 dark:text-white leading-none mt-1">{totais.sobrando}</p>
        </div>
      </div>
    </div>
  );
};
