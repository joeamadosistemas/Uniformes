import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeftRight, 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Package, 
  Search, 
  Filter, 
  Download, 
  RefreshCcw,
  CheckCircle2,
  Plus,
  X
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useT } from '../lib/LanguageContext';
import { RegistroUniforme } from '../types';
import { CATEGORIAS_UNIFORMES } from '../constants';
import { exportarRemanejamentoPDF } from '../utils/exportUtils';

interface RemanejamentoItem {
  escola: string;
  escolaNome: string;
  categoria: string;
  tipo: string;
  tamanho: string;
  sobra: number;
  falta: number;
}

interface SugestaoRemanejamento {
  id: string;
  tipo: string;
  tamanho: string;
  categoria: string;
  origem: string;
  origemNome: string;
  destino: string;
  destinoNome: string;
  quantidade: number;
  qtdOrigem: number;
  qtdDestino: number;
}

export const Remanejamento: React.FC = () => {
  const { t } = useT();
  const [loading, setLoading] = useState(true);
  const [registros, setRegistros] = useState<RegistroUniforme[]>([]);
  const [escolasMap, setEscolasMap] = useState<Record<string, string>>({});
  
  // Filtros
  const [filtroEscola, setFiltroEscola] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroTamanho, setFiltroTamanho] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Escolas
      const { data: escolaData } = await supabase
        .from('escolas')
        .select('*')
        .eq('ativo', true);
      
      if (escolaData) {
        const map: Record<string, string> = {};
        escolaData.forEach(e => {
          if (e.email) map[e.email.toLowerCase().trim()] = e.nome;
        });
        setEscolasMap(map);
      }

      // Fetch Registros
      const { data: registroData } = await supabase
        .from('registros_uniformes')
        .select('*')
        .order('data_registro', { ascending: false });
      
      if (registroData) {
        setRegistros(registroData);
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  // Processar dados para a tabela de controle
  const dadosControle = useMemo(() => {
    const items: RemanejamentoItem[] = [];
    
    // Pegar o último registro de cada escola para cada tipo
    // (Poderia ser mais complexo se houvesse múltiplos registros ativos)
    const lastRegistros: Record<string, RegistroUniforme> = {};
    registros.forEach(r => {
      const key = `${r.escola}-${r.tipo_uniforme}`;
      if (!lastRegistros[key]) {
        lastRegistros[key] = r;
      }
    });

    Object.values(lastRegistros).forEach(r => {
      const escolaEmail = (r.escola || '').toLowerCase().trim();
      const escolaNome = escolasMap[escolaEmail] || r.escola || 'Escola Desconhecida';

      // Processar Sobra
      if (r.qtd_sobrando > 0 && r.tamanho_sobrando) {
        items.push({
          escola: r.escola,
          escolaNome,
          categoria: r.categoria,
          tipo: r.tipo_uniforme,
          tamanho: r.tamanho_sobrando,
          sobra: r.qtd_sobrando,
          falta: 0
        });
      }

      // Processar Falta
      if (r.qtd_faltando > 0 && r.tamanho_faltando) {
        // Se for o mesmo tamanho que a sobra (improvável mas possível), somar ao item existente ou criar separado?
        // Aqui criamos uma entrada para falta
        items.push({
          escola: r.escola,
          escolaNome,
          categoria: r.categoria,
          tipo: r.tipo_uniforme,
          tamanho: r.tamanho_faltando,
          sobra: 0,
          falta: r.qtd_faltando
        });
      }
    });

    return items;
  }, [registros, escolasMap]);

  // Aplicar filtros nos dados de controle
  const dadosFiltrados = useMemo(() => {
    return dadosControle.filter(item => {
      const matchEscola = !filtroEscola || item.escolaNome.toLowerCase().includes(filtroEscola.toLowerCase());
      const matchCategoria = !filtroCategoria || item.categoria === filtroCategoria;
      const matchTipo = !filtroTipo || item.tipo === filtroTipo;
      const matchTamanho = !filtroTamanho || item.tamanho === filtroTamanho;
      return matchEscola && matchCategoria && matchTipo && matchTamanho;
    });
  }, [dadosControle, filtroEscola, filtroCategoria, filtroTipo, filtroTamanho]);

  // Algoritmo de Sugestão de Remanejamento
  const sugestoes = useMemo(() => {
    const s: SugestaoRemanejamento[] = [];
    
    // Agrupar por Tipo + Tamanho
    const grupos: Record<string, { sobras: RemanejamentoItem[], faltas: RemanejamentoItem[] }> = {};
    
    dadosControle.forEach(item => {
      const key = `${item.tipo}-${item.tamanho}`;
      if (!grupos[key]) {
        grupos[key] = { sobras: [], faltas: [] };
      }
      if (item.sobra > 0) grupos[key].sobras.push({ ...item });
      if (item.falta > 0) grupos[key].faltas.push({ ...item });
    });

    Object.values(grupos).forEach((grupo) => {
      // Criar cópias para trabalhar
      let sobras = [...grupo.sobras].sort((a, b) => b.sobra - a.sobra);
      let faltas = [...grupo.faltas].sort((a, b) => b.falta - a.falta);

      let i = 0; // index sobras
      let j = 0; // index faltas

      while (i < sobras.length && j < faltas.length) {
        const sbr = sobras[i];
        const flt = faltas[j];
        
        const qtdTransferir = Math.min(sbr.sobra, flt.falta);
        
        if (qtdTransferir > 0) {
          s.push({
            id: crypto.randomUUID(),
            tipo: sbr.tipo,
            tamanho: sbr.tamanho,
            categoria: sbr.categoria,
            origem: sbr.escola,
            origemNome: sbr.escolaNome,
            destino: flt.escola,
            destinoNome: flt.escolaNome,
            quantidade: qtdTransferir,
            qtdOrigem: sbr.sobra,
            qtdDestino: flt.falta
          });

          sobras[i].sobra -= qtdTransferir;
          faltas[j].falta -= qtdTransferir;
        }

        if (sobras[i].sobra === 0) i++;
        if (faltas[j].falta === 0) j++;
      }
    });

    return s;
  }, [dadosControle]);

  // Aplicar filtros nas sugestões
  const sugestoesFiltradas = useMemo(() => {
    return sugestoes.filter(s => {
      const matchOrigem = !filtroEscola || s.origemNome.toLowerCase().includes(filtroEscola.toLowerCase()) || s.destinoNome.toLowerCase().includes(filtroEscola.toLowerCase());
      const matchCategoria = !filtroCategoria || s.categoria === filtroCategoria;
      const matchTipo = !filtroTipo || s.tipo === filtroTipo;
      const matchTamanho = !filtroTamanho || s.tamanho === filtroTamanho;
      return matchOrigem && matchCategoria && matchTipo && matchTamanho;
    });
  }, [sugestoes, filtroEscola, filtroCategoria, filtroTipo, filtroTamanho]);

  // Totais Resumo
  const totalSobra = useMemo(() => dadosControle.reduce((acc, curr) => acc + curr.sobra, 0), [dadosControle]);
  const totalFalta = useMemo(() => dadosControle.reduce((acc, curr) => acc + curr.falta, 0), [dadosControle]);
  const totalRemanejamentos = useMemo(() => sugestoes.length, [sugestoes]);

  const categorias = Object.keys(CATEGORIAS_UNIFORMES);
  const tiposUniformes = Array.from(new Set(dadosControle.map(i => i.tipo))).sort();
  const tamanhos = Array.from(new Set(dadosControle.map(i => i.tamanho))).sort();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <RefreshCcw className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-gray-500 font-medium">{t.common.carregando}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20 max-w-[1400px] mx-auto animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-3">
            <div className="p-2 bg-[#005A9C] text-white rounded-xl">
              <ArrowLeftRight size={28} />
            </div>
            {t.remanejamento.titulo}
          </h1>
          <p className="text-gray-500 dark:text-zinc-400 mt-2 font-medium">
            {t.remanejamento.subtitulo}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => exportarRemanejamentoPDF(
              sugestoes, 
              { totalSobra, totalFalta, totalRotas: totalRemanejamentos }, 
              t
            )}
            className="flex items-center px-6 py-3 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all text-sm font-bold shadow-sm"
          >
            <Download size={18} className="mr-2 text-blue-600" />
            {t.remanejamento.baixarPlano}
          </button>
        </div>
      </div>

      {/* Seção 1: Painel de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass p-8 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-xl shadow-blue-500/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <TrendingUp size={80} />
          </div>
          <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">{t.remanejamento.totalSobras}</p>
          <h3 className="text-4xl font-black text-zinc-900 dark:text-white mt-1">{totalSobra} <span className="text-lg font-bold text-gray-400">un.</span></h3>
          <div className="mt-4 flex items-center text-xs font-bold text-emerald-500">
            <TrendingUp size={14} className="mr-1" />
            <span>Estoque excedente identificado</span>
          </div>
        </div>

        <div className="glass p-8 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-xl shadow-red-500/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <TrendingDown size={80} />
          </div>
          <p className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest mb-1">{t.remanejamento.totalFaltas}</p>
          <h3 className="text-4xl font-black text-zinc-900 dark:text-white mt-1">{totalFalta} <span className="text-lg font-bold text-gray-400">un.</span></h3>
          <div className="mt-4 flex items-center text-xs font-bold text-red-500">
            <TrendingDown size={14} className="mr-1" />
            <span>Demanda pendente acumulada</span>
          </div>
        </div>

        <div className="glass p-8 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-xl shadow-blue-500/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <ArrowLeftRight size={80} />
          </div>
          <p className="text-[10px] font-black text-[#005A9C] dark:text-[#66b3ff] uppercase tracking-widest mb-1">{t.remanejamento.remanejamentosPossiveis}</p>
          <h3 className="text-4xl font-black text-zinc-900 dark:text-white mt-1">{totalRemanejamentos} <span className="text-lg font-bold text-gray-400">rotas</span></h3>
          <div className="mt-4 flex items-center text-xs font-bold text-blue-500">
            <CheckCircle2 size={14} className="mr-1" />
            <span>Otimizações de estoque disponíveis</span>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="glass p-6 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-lg">
        <div className="flex items-center gap-2 mb-6 border-b border-gray-50 dark:border-zinc-900 pb-4">
          <Filter size={18} className="text-[#005A9C]" />
          <h2 className="text-sm font-black text-zinc-800 dark:text-white uppercase tracking-wider">{t.remanejamento.filtros}</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t.remanejamento.escola}</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                value={filtroEscola}
                onChange={(e) => setFiltroEscola(e.target.value)}
                placeholder="Nome da escola..."
                className="w-full pl-11 pr-4 py-3 bg-gray-50/50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl text-sm font-semibold outline-none focus:ring-2 focus:ring-[#005A9C] transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t.remanejamento.categoria}</label>
            <select 
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50/50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl text-sm font-semibold outline-none focus:ring-2 focus:ring-[#005A9C] transition-all cursor-pointer"
            >
              <option value="">{t.lancamentos.todasCategorias}</option>
              {categorias.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t.remanejamento.tipo}</label>
            <select 
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50/50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl text-sm font-semibold outline-none focus:ring-2 focus:ring-[#005A9C] transition-all cursor-pointer"
            >
              <option value="">{t.lancamentos.todosTipos}</option>
              {tiposUniformes.map(tp => <option key={tp} value={tp}>{tp}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t.remanejamento.tamanho}</label>
            <select 
              value={filtroTamanho}
              onChange={(e) => setFiltroTamanho(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50/50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl text-sm font-semibold outline-none focus:ring-2 focus:ring-[#005A9C] transition-all cursor-pointer"
            >
              <option value="">Todos os Tamanhos</option>
              {tamanhos.map(tm => <option key={tm} value={tm}>{tm}</option>)}
            </select>
          </div>
        </div>

        {(filtroEscola || filtroCategoria || filtroTipo || filtroTamanho) && (
          <button 
            onClick={() => {
              setFiltroEscola('');
              setFiltroCategoria('');
              setFiltroTipo('');
              setFiltroTamanho('');
            }}
            className="mt-6 text-xs font-bold text-red-500 hover:text-red-600 flex items-center gap-1.5 transition-colors"
          >
            <X size={14} />
            {t.remanejamento.limparFiltros}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Seção 2: Tabela de Controle */}
        <div className="glass rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-xl overflow-hidden flex flex-col h-[600px]">
          <div className="p-6 border-b border-gray-100 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-zinc-900 dark:text-white tracking-tight">{t.remanejamento.tabelaControle}</h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Status detalhado por item e unidade</p>
            </div>
            <BarChart3 size={20} className="text-gray-300" />
          </div>

          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-gray-50/95 dark:bg-zinc-950/95 backdrop-blur z-10">
                <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-zinc-800">
                  <th className="px-6 py-4">{t.remanejamento.escola}</th>
                  <th className="px-6 py-4">{t.remanejamento.tipo}</th>
                  <th className="px-6 py-4 text-center">{t.remanejamento.tamanho}</th>
                  <th className="px-6 py-4 text-center">{t.remanejamento.qtdSobrando}</th>
                  <th className="px-6 py-4 text-center">{t.remanejamento.qtdFaltando}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-zinc-900">
                {dadosFiltrados.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{item.escolaNome}</p>
                      <p className="text-[10px] font-black text-blue-600/60 uppercase tracking-widest">{item.categoria}</p>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-zinc-600 dark:text-zinc-400">{item.tipo}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-1 bg-gray-100 dark:bg-zinc-800 rounded-lg text-xs font-black text-zinc-500">{item.tamanho}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {item.sobra > 0 ? (
                        <div className="flex flex-col items-center">
                          <span className="text-sm font-black text-emerald-600">+{item.sobra}</span>
                          <span className="text-[8px] font-black text-emerald-500 uppercase tracking-tighter">Sobra</span>
                        </div>
                      ) : <span className="text-gray-200 dark:text-zinc-800">—</span>}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {item.falta > 0 ? (
                        <div className="flex flex-col items-center">
                          <span className="text-sm font-black text-red-600">-{item.falta}</span>
                          <span className="text-[8px] font-black text-red-500 uppercase tracking-tighter">Falta</span>
                        </div>
                      ) : <span className="text-gray-200 dark:text-zinc-800">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Seção 3: Sugestões de Remanejamento */}
        <div className="glass rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-xl overflow-hidden flex flex-col h-[600px]">
          <div className="p-6 border-b border-gray-100 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-zinc-900 dark:text-white tracking-tight">{t.remanejamento.sugestoes}</h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Algoritmo de pareamento sobra vs falta</p>
              </div>
              <TrendingUp size={20} className="text-[#005A9C]" />
            </div>
            
            <button 
              onClick={() => exportarRemanejamentoPDF(
                sugestoes, 
                { totalSobra, totalFalta, totalRotas: totalRemanejamentos }, 
                t
              )}
              className="w-full py-3 bg-gradient-to-r from-[#005A9C] to-[#004a80] text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Download size={16} />
              {t.remanejamento.baixarPlano}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {sugestoesFiltradas.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-12 text-center gap-4 text-gray-400">
                <Package size={48} className="opacity-20" />
                <p className="text-sm font-medium leading-relaxed">{t.remanejamento.nenhumaSugestao}</p>
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {sugestoesFiltradas.map((s) => (
                  <div key={s.id} className="p-5 bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex items-center justify-between mb-4 border-b border-gray-50 dark:border-zinc-950 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-[10px] font-black text-blue-600 rounded-lg uppercase tracking-wider">{s.tipo}</span>
                        <span className="px-2 py-1 bg-gray-100 dark:bg-zinc-800 text-[10px] font-black text-gray-500 rounded-lg">{s.tamanho}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-lg font-black text-[#005A9C]">{s.quantidade}</span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">un.</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 relative">
                      <div className="flex-1 space-y-1">
                        <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">{t.remanejamento.origem}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 line-clamp-1">{s.origemNome}</p>
                          <span className="px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 text-[9px] font-black text-emerald-600 rounded-md border border-emerald-100 dark:border-emerald-900">+{s.qtdOrigem}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-center p-2 bg-gray-50 dark:bg-zinc-800 rounded-full text-gray-400 z-10 group-hover:scale-110 transition-transform">
                        <ArrowLeftRight size={14} />
                      </div>

                      <div className="flex-1 space-y-1 text-right">
                        <p className="text-[8px] font-black text-red-500 uppercase tracking-widest">{t.remanejamento.destino}</p>
                        <div className="flex items-center justify-end gap-2">
                          <span className="px-1.5 py-0.5 bg-red-50 dark:bg-red-900/30 text-[9px] font-black text-red-600 rounded-md border border-red-100 dark:border-red-900">-{s.qtdDestino}</span>
                          <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 line-clamp-1">{s.destinoNome}</p>
                        </div>
                      </div>
                      
                      <div className="absolute top-1/2 left-1/4 right-1/4 h-px bg-dashed border-b border-dashed border-gray-100 dark:border-zinc-800 -translate-y-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
