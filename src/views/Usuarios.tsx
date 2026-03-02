import React, { useState, useEffect } from 'react';
import { UsuarioCadastro, EscolaCadastro } from '../types';
import { Save, Trash2, Users } from 'lucide-react';

export const Usuarios: React.FC = () => {
  const [usuarios, setUsuarios] = useState<UsuarioCadastro[]>([]);
  const [escolas, setEscolas] = useState<EscolaCadastro[]>([]);
  
  const [nome, setNome] = useState('');
  const [emailEscola, setEmailEscola] = useState('');

  useEffect(() => {
    const usuariosSalvos = localStorage.getItem('@Uniformes:usuarios');
    if (usuariosSalvos) setUsuarios(JSON.parse(usuariosSalvos));

    const escolasSalvas = localStorage.getItem('@Uniformes:escolas');
    if (escolasSalvas) setEscolas(JSON.parse(escolasSalvas));
  }, []);

  useEffect(() => {
    localStorage.setItem('@Uniformes:usuarios', JSON.stringify(usuarios));
  }, [usuarios]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !emailEscola) return;

    const novoUsuario: UsuarioCadastro = {
      id: crypto.randomUUID(),
      nome,
      email_escola: emailEscola
    };

    setUsuarios([...usuarios, novoUsuario]);
    setNome('');
    setEmailEscola('');
  };

  const handleDelete = (id: string) => {
    if(window.confirm('Deseja realmente excluir este usuário?')) {
      setUsuarios(usuarios.filter(u => u.id !== id));
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
          <Users className="mr-3 text-blue-600" />
          Cadastro de Usuários
        </h2>
        <p className="text-gray-600">Cadastre os diretores e vincule-os aos e-mails das escolas.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Usuário *</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Ex: Ana Paula Rodrigues"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mail da Escola (Vínculo) *</label>
              {escolas.length > 0 ? (
                <select
                  value={emailEscola}
                  onChange={(e) => setEmailEscola(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  required
                >
                  <option value="">Selecione a escola...</option>
                  {escolas.map(escola => (
                    <option key={escola.id} value={escola.email}>
                      {escola.nome} ({escola.email})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="email"
                  value={emailEscola}
                  onChange={(e) => setEmailEscola(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Digite o e-mail da escola"
                  required
                />
              )}
              {escolas.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  Dica: Cadastre escolas primeiro no menu "Unidade Escolar" para selecioná-las aqui.
                </p>
              )}
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Save size={18} className="mr-2" />
              Salvar Usuário
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-slate-50">
          <h3 className="font-semibold text-gray-800">Usuários Cadastrados</h3>
        </div>
        <div className="p-0">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                <th className="px-6 py-3 font-medium">Nome do Usuário</th>
                <th className="px-6 py-3 font-medium">E-mail da Escola Vinculada</th>
                <th className="px-6 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {usuarios.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                    Nenhum usuário cadastrado ainda.
                  </td>
                </tr>
              ) : (
                usuarios.map((usuario) => {
                  const escolaVinculada = escolas.find(e => e.email === usuario.email_escola);
                  return (
                    <tr key={usuario.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-gray-800">{usuario.nome}</td>
                      <td className="px-6 py-4 text-gray-600">
                        {usuario.email_escola}
                        {escolaVinculada && (
                          <span className="block text-xs text-blue-600 mt-0.5">{escolaVinculada.nome}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDelete(usuario.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors inline-flex"
                          title="Excluir"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
