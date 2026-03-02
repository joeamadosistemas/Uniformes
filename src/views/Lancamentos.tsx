import React, { useState, useEffect } from 'react';
import { RegistroUniforme, Filtros, Usuario } from '../types';
import { UniformForm } from '../components/UniformForm';
import { UniformTable } from '../components/UniformTable';
import { DashboardStats } from '../components/DashboardStats';
import { exportarParaPDF, exportarParaExcel } from '../utils/exportUtils';

const USUARIO_LOGADO: Usuario = {
  escola: 'EMEF Professora Maria Silva',
  diretor: 'Ana Paula Rodrigues'
};

export const Lancamentos: React.FC = () => {
  const [registros, setRegistros] = useState<RegistroUniforme[]>([]);
  const [registroEmEdicao, setRegistroEmEdicao] = useState<RegistroUniforme | null>(null);
  const [filtros, setFiltros] = useState<Filtros>({ categoria: '', tipo_uniforme: '', data: '' });
  const [mensagem, setMensagem] = useState<{ texto: string; tipo: 'sucesso' | 'erro' } | null>(null);

  useEffect(() => {
    const dadosSalvos = localStorage.getItem('@Uniformes:registros');
    if (dadosSalvos) {
      setRegistros(JSON.parse(dadosSalvos));
    }
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
      // No caso de edição, novosDados terá apenas um item (o editado)
      const dados = novosDados[0];
      const dadosCompletos = {
        ...dados,
        escola: USUARIO_LOGADO.escola,
        diretor: USUARIO_LOGADO.diretor
      };

      setRegistros(prev => prev.map(r =>
        r.id === registroEmEdicao.id
          ? { ...dadosCompletos, id: r.id, data_registro: r.data_registro }
          : r
      ));
      setRegistroEmEdicao(null);
      mostrarMensagem('Registro atualizado com sucesso!');
    } else {
      // No caso de novo registro, pode haver múltiplos itens
      const novosRegistros: RegistroUniforme[] = novosDados.map(dados => ({
        ...dados,
        id: crypto.randomUUID(),
        data_registro: new Date().toISOString(),
        escola: USUARIO_LOGADO.escola,
        diretor: USUARIO_LOGADO.diretor
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
    const matchEscola = r.escola === USUARIO_LOGADO.escola;
    const matchCategoria = filtros.categoria ? r.categoria === filtros.categoria : true;
    const matchTipo = filtros.tipo_uniforme ? r.tipo_uniforme === filtros.tipo_uniforme : true;
    const matchData = filtros.data ? r.data_registro.startsWith(filtros.data) : true;
    return matchEscola && matchCategoria && matchTipo && matchData;
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
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Lançamentos de Uniformes</h2>
        <p className="text-gray-600">Gerencie o estoque e registre novas entradas de uniformes.</p>
      </div>

      <DashboardStats registros={registrosFiltrados} />

      <UniformForm
        onSave={handleSave}
        registroEmEdicao={registroEmEdicao}
        onCancelEdit={() => setRegistroEmEdicao(null)}
      />

      <UniformTable
        registros={registrosFiltrados}
        filtros={filtros}
        setFiltros={setFiltros}
        onEdit={setRegistroEmEdicao}
        onDelete={handleDelete}
        onExportPDF={() => exportarParaPDF(registrosFiltrados, USUARIO_LOGADO.escola)}
        onExportExcel={() => exportarParaExcel(registrosFiltrados)}
      />
    </div>
  );
};
