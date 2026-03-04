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
    <div className="grid grid-cols-3 gap-2 md:gap-4 mb-4 md:mb-6">
      <div className="bg-[#005A9C] dark:bg-[#1452b5] rounded-xl md:rounded-3xl p-2 md:p-6 flex flex-col justify-between shadow-lg shadow-blue-500/20 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-1 md:mb-4 gap-1 md:gap-0">
          <p className="text-[9px] sm:text-[10px] md:text-sm font-bold text-white/80 tracking-tight flex-1 pr-1 truncate">{t.lancamentos.registros}</p>
          <div className="p-1 md:p-3 bg-white/20 text-white rounded-lg md:rounded-xl backdrop-blur-sm shadow-inner shrink-0 hidden sm:block">
            <ClipboardList className="w-3 h-3 sm:w-4 sm:h-4 md:w-6 md:h-6" />
          </div>
        </div>
        <div>
          <p className="text-lg sm:text-2xl md:text-4xl font-black text-white leading-none mt-1">{registros.length}</p>
        </div>
      </div>

      <div className="bg-[#eef2ff] dark:bg-zinc-800/80 rounded-xl md:rounded-3xl p-2 md:p-6 flex flex-col justify-between shadow-sm border border-blue-100 dark:border-zinc-700 hover:shadow-md hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-12 h-12 md:w-24 md:h-24 bg-red-400/10 rounded-bl-full -z-10"></div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-1 md:mb-4 gap-1 md:gap-0 z-10">
          <p className="text-[9px] sm:text-[10px] md:text-sm font-bold text-gray-500 dark:text-zinc-400 tracking-tight flex-1 pr-1 truncate">{t.lancamentos.faltando}</p>
          <div className="p-1 md:p-3 bg-white dark:bg-zinc-700 text-red-500 rounded-lg md:rounded-xl shadow-sm shrink-0 hidden sm:block">
            <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 md:w-6 md:h-6" />
          </div>
        </div>
        <div className="z-10">
          <p className="text-lg sm:text-2xl md:text-4xl font-black text-gray-800 dark:text-white leading-none mt-1">{totais.faltando}</p>
        </div>
      </div>

      <div className="bg-[#eef2ff] dark:bg-zinc-800/80 rounded-xl md:rounded-3xl p-2 md:p-6 flex flex-col justify-between shadow-sm border border-blue-100 dark:border-zinc-700 hover:shadow-md hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-12 h-12 md:w-24 md:h-24 bg-green-400/10 rounded-bl-full -z-10"></div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-1 md:mb-4 gap-1 md:gap-0 z-10">
          <p className="text-[9px] sm:text-[10px] md:text-sm font-bold text-gray-500 dark:text-zinc-400 tracking-tight flex-1 pr-1 truncate">{t.lancamentos.sobrando}</p>
          <div className="p-1 md:p-3 bg-white dark:bg-zinc-700 text-emerald-500 rounded-lg md:rounded-xl shadow-sm shrink-0 hidden sm:block">
            <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 md:w-6 md:h-6" />
          </div>
        </div>
        <div className="z-10">
          <p className="text-lg sm:text-2xl md:text-4xl font-black text-gray-800 dark:text-white leading-none mt-1">{totais.sobrando}</p>
        </div>
      </div>
    </div>
  );
};
