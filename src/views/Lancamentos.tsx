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
  const [categoriaDefault, setCategoriaDefault] = useState('');
  const [categoriaLocked, setCategoriaLocked] = useState(false);
  // Categorias que este escola tem permissão de registrar (vazio = todas)
  const [categoriasPermitidas, setCategoriasPermitidas] = useState<string[]>([]);

  // Busca a sessão e depois consulta os segmentos reais da escola no banco
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const email = data.session?.user?.email ?? '';
      setEscola(email);

      if (!email) return;

      // Busca a escola cadastrada cujo e-mail corresponde ao usuário logado
      const { data: escolaData, error } = await supabase
        .from('escolas')
        .select('segmentos')
        .ilike('email', email)
        .eq('ativo', true)
        .maybeSingle();

      if (!error && escolaData && Array.isArray(escolaData.segmentos) && escolaData.segmentos.length > 0) {
        const categorias = escolaData.segmentos.map(segmentoToCategoria);
        // Restringe o dropdown apenas às categorias cadastradas para esta escola
        setCategoriasPermitidas(categorias);
        // Se a escola atende apenas 1 segmento, pré-seleciona e trava o campo.
        // Se atende vários, deixa o usuário escolher (sem travar).
        if (categorias.length === 1) {
          setCategoriaDefault(categorias[0]);
          setCategoriaLocked(true);
        } else {
          setCategoriaDefault(''); // sem pré-seleção quando há múltiplos segmentos
          setCategoriaLocked(false);
        }
      }
    });
  }, []);

  useEffect(() => {
    const dadosSalvos = localStorage.getItem('@Uniformes:registros');
    if (dadosSalvos) setRegistros(JSON.parse(dadosSalvos));
  }, []);

  useEffect(() => {
    localStorage.setItem('@Uniformes:registros', JSON.stringify(registros));
  }, [registros]);

  const mostrarMensagem = (texto: string, tipo: 'sucesso' | 'erro' = 'sucesso') => {
    setMensagem({ texto, tipo });
    setTimeout(() => setMensagem(null), 3000);
  };

  const handleSave = (novosDados: Omit<RegistroUniforme, 'id' | 'data_registro' | 'escola' | 'diretor'>[]) => {
    if (registroEmEdicao) {
      const dados = novosDados[0];
      setRegistros(prev => prev.map(r =>
        r.id === registroEmEdicao.id
          ? { ...dados, id: r.id, data_registro: r.data_registro, escola, diretor: '' }
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
      setRegistros(prev => [...novosRegistros, ...prev]);
      mostrarMensagem(t.lancamentos.sucessoSalvar);
    }
  };

  const handleDelete = (id: string) => {
    setRegistros(prev => prev.filter(r => r.id !== id));
    mostrarMensagem(t.lancamentos.sucessoExcluir);
  };

  const registrosFiltrados = registros.filter(r => {
    const matchCategoria = filtros.categoria ? r.categoria === filtros.categoria : true;
    const matchTipo = filtros.tipo_uniforme ? r.tipo_uniforme === filtros.tipo_uniforme : true;
    const matchData = filtros.data ? r.data_registro.startsWith(filtros.data) : true;
    return matchCategoria && matchTipo && matchData;
  });

  return (
    <div className="space-y-6">
      {mensagem && (
        <div className={`fixed top-20 right-8 px-6 py-3 rounded-lg shadow-lg text-white font-medium z-50 transition-all ${mensagem.tipo === 'sucesso' ? 'bg-green-600' : 'bg-red-600'
          }`}>
          {mensagem.texto}
        </div>
      )}

      <div>
        <h2 className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight mb-2">{t.lancamentos.titulo}</h2>
        <p className="text-gray-500 dark:text-zinc-400 font-medium">{t.lancamentos.subtitulo}</p>
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


      <UniformTable
        registros={registrosFiltrados}
        filtros={filtros}
        setFiltros={setFiltros}
        onEdit={setRegistroEmEdicao}
        onDelete={handleDelete}
        onExportPDF={() => exportarParaPDF(registrosFiltrados, escola)}
        onExportExcel={() => exportarParaExcel(registrosFiltrados)}
      />
    </div>
  );
};
