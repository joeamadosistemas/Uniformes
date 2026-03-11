import React, { useState, useEffect } from 'react';
import { RegistroUniforme, Filtros } from '../types';
import { UniformForm } from '../components/UniformForm';
import { UniformTable } from '../components/UniformTable';
import { DashboardStats } from '../components/DashboardStats';
import { exportarParaPDF, exportarParaExcel } from '../utils/exportUtils';
import { supabase } from '../lib/supabaseClient';
import { useT } from '../lib/LanguageContext';

/**
 * Extrai a categoria correspondente a um segmento cadastrado na tabela `escolas`.
 * Os segmentos são armazenados como "CONJUNTO UNIFORMA ESCOLAR <CATEGORIA>".
 * Retorna a parte da categoria (ex: "FUNDAMENTAL 1-3 ANOS") ou o próprio valor
 * caso não siga esse padrão.
 */
function segmentoToCategoria(segmento: string): string {
  return segmento.replace('CONJUNTO UNIFORMA ESCOLAR ', '').trim();
}

export const Lancamentos: React.FC = () => {
  const { t } = useT();
  const [registros, setRegistros] = useState<RegistroUniforme[]>([]);
  const [registroEmEdicao, setRegistroEmEdicao] = useState<RegistroUniforme | null>(null);
  const [filtros, setFiltros] = useState<Filtros>({ categoria: '', tipo_uniforme: '', data: '' });
  const [mensagem, setMensagem] = useState<{ texto: string; tipo: 'sucesso' | 'erro' } | null>(null);
  const [escola, setEscola] = useState('');
  const [escolasMap, setEscolasMap] = useState<Record<string, string>>({});
  const [categoriaDefault, setCategoriaDefault] = useState('');
  const [categoriaLocked, setCategoriaLocked] = useState(false);
  // Categorias que este escola tem permissão de registrar (vazio = todas)
  const [categoriasPermitidas, setCategoriasPermitidas] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      setLoading(true);
      const { data } = await supabase.auth.getSession();
      if (!isMounted) return;
      const email = data.session?.user?.email ?? '';
      const userId = data.session?.user?.id;
      
      setEscola(email);

      if (!email || !userId) {
        setLoading(false);
        return;
      }

      // 1. Verifica Role/Perfil
      let userIsAdmin = false;
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle();

      if (profile && profile.role) {
        userIsAdmin = profile.role === 'Super Administrador' || profile.role === 'admin';
      }

      // 2. Busca segmentos da escola
      const { data: escolaData, error } = await supabase
        .from('escolas')
        .select('segmentos')
        .ilike('email', email)
        .eq('ativo', true)
        .maybeSingle();

      if (!isMounted) return;

      if (!error && escolaData && Array.isArray(escolaData.segmentos) && escolaData.segmentos.length > 0) {
        const categorias = escolaData.segmentos.map(segmentoToCategoria);
        setCategoriasPermitidas(categorias);
        if (categorias.length === 1) {
          setCategoriaDefault(categorias[0]);
          setCategoriaLocked(true);
        } else {
          setCategoriaDefault('');
          setCategoriaLocked(false);
        }
      }

      // 3. Busca nomes das escolas para o mapeamento
      const { data: escolasMapData } = await supabase
        .from('escolas')
        .select('email, nome')
        .eq('ativo', true);
      
      const newEscolasMap: Record<string, string> = {};
      if (escolasMapData) {
        escolasMapData.forEach(e => {
          if (e.email) newEscolasMap[e.email.toLowerCase().trim()] = e.nome;
        });
      }
      if (isMounted) setEscolasMap(newEscolasMap);

      // 4. Busca lançamentos (do Supabase, filtrando por escola se não for admin)
      try {
        let query = supabase.from('registros_uniformes').select('*').order('data_registro', { ascending: false });
        
        if (!userIsAdmin) {
           query = query.ilike('escola', email);
        }

        const { data: records, error: recordsError } = await query;
        if (recordsError) throw recordsError;
        
        if (records && isMounted) {
           setRegistros(records);
        }
      } catch (err) {
        console.error("Erro ao carregar registros:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  const mostrarMensagem = (texto: string, tipo: 'sucesso' | 'erro' = 'sucesso') => {
    setMensagem({ texto, tipo });
    setTimeout(() => setMensagem(null), 3000);
  };

  const handleSave = async (novosDados: Omit<RegistroUniforme, 'id' | 'data_registro' | 'escola' | 'diretor'>[]) => {
    try {
      if (registroEmEdicao) {
        const dados = novosDados[0];
        const { error } = await supabase
          .from('registros_uniformes')
          .update({
            qtd_alunos: dados.qtd_alunos,
            categoria: dados.categoria,
            tipo_uniforme: dados.tipo_uniforme,
            qtd_sobrando: dados.qtd_sobrando,
            tamanho_sobrando: dados.tamanho_sobrando,
            qtd_faltando: dados.qtd_faltando,
            tamanho_faltando: dados.tamanho_faltando
          })
          .eq('id', registroEmEdicao.id);
          
        if (error) throw error;

        setRegistros(prev => prev.map(r =>
          r.id === registroEmEdicao.id
            ? { ...r, ...dados }
            : r
        ));
        setRegistroEmEdicao(null);
        mostrarMensagem(t.lancamentos.sucessoAtualizar);
      } else {
        const novosRegistros: RegistroUniforme[] = novosDados.map(dados => ({
          ...dados,
          id: crypto.randomUUID(),
          data_registro: new Date().toISOString(),
          escola,
          diretor: '',
        }));

        const { error } = await supabase
          .from('registros_uniformes')
          .insert(novosRegistros);
          
        if (error) throw error;

        setRegistros(prev => [...novosRegistros, ...prev]);
        mostrarMensagem(t.lancamentos.sucessoSalvar);
      }
    } catch (err) {
      console.error(err);
      mostrarMensagem('Erro ao salvar no banco de dados. Tente novamente.', 'erro');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('registros_uniformes')
        .delete()
        .eq('id', id);
        
      if (error) throw error;

      setRegistros(prev => prev.filter(r => r.id !== id));
      mostrarMensagem(t.lancamentos.sucessoExcluir);
    } catch (err) {
      console.error(err);
      mostrarMensagem('Erro ao apagar registro.', 'erro');
    }
  };

  const registrosFiltrados = registros.filter(r => {
    const matchCategoria = filtros.categoria ? r.categoria === filtros.categoria : true;
    const matchTipo = filtros.tipo_uniforme ? r.tipo_uniforme === filtros.tipo_uniforme : true;
    const matchData = filtros.data ? r.data_registro.startsWith(filtros.data) : true;
    const matchYear = r.data_registro.startsWith(selectedYear.toString());
    return matchCategoria && matchTipo && matchData && matchYear;
  });

  return (
    <div className="space-y-6">
      {mensagem && (
        <div className={`fixed top-20 right-8 px-6 py-3 rounded-lg shadow-lg text-white font-medium z-50 transition-all ${mensagem.tipo === 'sucesso' ? 'bg-green-600' : 'bg-red-600'
          }`}>
          {mensagem.texto}
        </div>
      )}

      <div className="flex justify-between items-center bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-4 rounded-2xl shadow-sm">
        <div>
          <p className="text-gray-500 dark:text-zinc-400 font-medium">{t.lancamentos.subtitulo}</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-zinc-800 rounded-xl">
          <span className="text-xs font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest">Ano:</span>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-transparent border-none text-sm font-black text-[#005A9C] dark:text-[#66b3ff] focus:ring-0 cursor-pointer"
          >
            <option value={2026}>2026</option>
            <option value={2025}>2025</option>
            <option value={2024}>2024</option>
          </select>
        </div>
      </div>

      <DashboardStats registros={registrosFiltrados} />

      <UniformForm
        onSave={handleSave}
        registroEmEdicao={registroEmEdicao}
        onCancelEdit={() => setRegistroEmEdicao(null)}
        categoriaDefault={categoriaDefault}
        categoriaLocked={categoriaLocked}
        categoriasPermitidas={categoriasPermitidas}
      />

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#005A9C]"></div>
        </div>
      ) : (
        <UniformTable
          registros={registrosFiltrados}
          filtros={filtros}
          setFiltros={setFiltros}
          onEdit={setRegistroEmEdicao}
          onDelete={handleDelete}
          onExportPDF={() => exportarParaPDF(registrosFiltrados, escola, escolasMap)}
          escolasMap={escolasMap}
          onExportExcel={() => exportarParaExcel(registrosFiltrados)}
        />
      )}
    </div>
  );
};
