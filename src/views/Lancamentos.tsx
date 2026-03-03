import React, { useState, useEffect } from 'react';
import { RegistroUniforme, Filtros } from '../types';
import { UniformForm } from '../components/UniformForm';
import { UniformTable } from '../components/UniformTable';
import { DashboardStats } from '../components/DashboardStats';
import { exportarParaPDF, exportarParaExcel } from '../utils/exportUtils';
import { supabase } from '../lib/supabaseClient';

/**
 * Mapeia o prefixo do e-mail da escola para a categoria padrão de uniforme.
 *   cm.*       → CRECHE
 *   emei.*     → PRÉ ESCOLA
 *   em.*       → FUNDAMENTAL 1-3 ANOS
 *   eem.*      → FUNDAMENTAL II 6 AO 9 ANOS
 *   ciep*      → FUNDAMENTAL II 6 AO 9 ANOS
 */
function getCategoriaDefault(email: string): string {
  const prefixo = email.split('@')[0].toLowerCase();
  if (prefixo.startsWith('cm.')) return 'CRECHE';
  if (prefixo.startsWith('emei.')) return 'PRÉ ESCOLA';
  if (prefixo.startsWith('em.')) return 'FUNDAMENTAL 1-3 ANOS';
  if (prefixo.startsWith('eem.')) return 'FUNDAMENTAL II 6 AO 9 ANOS';
  if (prefixo.startsWith('ciep')) return 'FUNDAMENTAL II 6 AO 9 ANOS';
  return '';
}

export const Lancamentos: React.FC = () => {
  const [registros, setRegistros] = useState<RegistroUniforme[]>([]);
  const [registroEmEdicao, setRegistroEmEdicao] = useState<RegistroUniforme | null>(null);
  const [filtros, setFiltros] = useState<Filtros>({ categoria: '', tipo_uniforme: '', data: '' });
  const [mensagem, setMensagem] = useState<{ texto: string; tipo: 'sucesso' | 'erro' } | null>(null);
  const [escola, setEscola] = useState('');
  const [categoriaDefault, setCategoriaDefault] = useState('');

  // Lê sessão do Supabase para obter e-mail e derivar categoria padrão
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const email = data.session?.user?.email ?? '';
      setEscola(email);
      setCategoriaDefault(getCategoriaDefault(email));
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
      mostrarMensagem('Registro atualizado com sucesso!');
    } else {
      const novosRegistros: RegistroUniforme[] = novosDados.map(dados => ({
        ...dados,
        id: crypto.randomUUID(),
        data_registro: new Date().toISOString(),
        escola,
        diretor: '',
      }));
      setRegistros(prev => [...novosRegistros, ...prev]);
      mostrarMensagem(`${novosRegistros.length} registro(s) salvo(s) com sucesso!`);
    }
  };

  const handleDelete = (id: string) => {
    setRegistros(prev => prev.filter(r => r.id !== id));
    mostrarMensagem('Registro excluído com sucesso!');
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
        <h2 className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight mb-2">Lançamentos de Uniformes</h2>
        <p className="text-gray-500 dark:text-zinc-400 font-medium">Gerencie o estoque e registre novas entradas de uniformes.</p>
      </div>

      <DashboardStats registros={registrosFiltrados} />

      <UniformForm
        onSave={handleSave}
        registroEmEdicao={registroEmEdicao}
        onCancelEdit={() => setRegistroEmEdicao(null)}
        categoriaDefault={categoriaDefault}
        categoriaLocked={categoriaDefault !== ''}
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
