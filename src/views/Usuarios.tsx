import React, { useState, useEffect } from 'react';
import { UsuarioCadastro, EscolaCadastro } from '../types';
import { Save, Trash2, Users, Loader2, Search, Edit2, UserX, Key, Check, X, Shield, User } from 'lucide-react';
import { supabase, supabaseAdmin } from '../lib/supabaseClient';
import { useT } from '../lib/LanguageContext';

export const Usuarios: React.FC = () => {
  const { t } = useT();
  const [usuarios, setUsuarios] = useState<UsuarioCadastro[]>([]);
  const [escolas, setEscolas] = useState<EscolaCadastro[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Estados para Cadastro/Edição
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const [emailEscola, setEmailEscola] = useState('');

  // Novos campos para Auth e Role
  const [emailUsuario, setEmailUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [userRole, setUserRole] = useState<'admin' | 'usuario'>('usuario');

  const [currentAdminEmail, setCurrentAdminEmail] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
    supabase.auth.getSession().then(({ data }) => {
      setCurrentAdminEmail(data.session?.user?.email || null);
    });
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: dataEscolas, error: errorEscolas } = await supabase
        .from('escolas')
        .select('*')
        .order('nome', { ascending: true });

      if (errorEscolas) throw errorEscolas;
      if (dataEscolas) setEscolas(dataEscolas as EscolaCadastro[]);

      const { data: dataUsuarios, error: errorUsuarios } = await supabase
        .from('Profile')
        .select('*')
        .order('nome', { ascending: true });

      if (errorUsuarios) {
        console.warn('Erro ao buscar perfis:', errorUsuarios.message);
      } else if (dataUsuarios) {
        setUsuarios(dataUsuarios as UsuarioCadastro[]);
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      alert(t.cadastros.erroCarregar);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !emailEscola) return;

    try {
      setSaving(true);

      if (editingId) {
        // Atualização simples do perfil
        const { error } = await supabase
          .from('Profile')
          .update({
            nome,
            email_escola: emailEscola,
            role: userRole
          })
          .eq('id', editingId);

        if (error) throw error;

        setUsuarios(prev => prev.map(u => u.id === editingId ? { ...u, nome, email_escola: emailEscola, role: userRole } : u));
        setEditingId(null);
        alert(t.cadastros.sucessoAtualizar);
      } else {
        // NOVO CADASTRO: Envolve Auth + Profile
        if (!emailUsuario || !password) {
          alert(t.common.preenchaCampos);
          setSaving(false);
          return;
        }

        if (!supabaseAdmin) {
          throw new Error('Cliente admin não configurado corretamente.');
        }

        // 1. Criar no Authentication
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: emailUsuario,
          password: password,
          email_confirm: true,
          user_metadata: { nome }
        });

        if (authError) throw authError;

        if (authData?.user) {
          // 2. Criar no Profile vinculado ao ID do Auth
          const { data: profileData, error: profileError } = await supabase
            .from('Profile')
            .upsert([{
              id: authData.user.id,
              nome,
              email_escola: emailEscola,
              email_usuario: emailUsuario,
              role: userRole
            }])
            .select();

          if (profileError) {
            // Se falhar no profile, avisamos mas a conta no auth foi criada
            console.error('Erro ao criar perfil:', profileError.message);
            alert(t.common.erroGeral);
          }

          if (profileData) {
            setUsuarios(prev => [...prev, profileData[0] as UsuarioCadastro]);
            alert(t.cadastros.sucessoAtualizar);
          }
        }
      }

      // Limpar campos
      setNome('');
      setEmailEscola('');
      setEmailUsuario('');
      setPassword('');
      setUserRole('usuario');
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      alert(error.message || t.common.erroGeral);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (usuario: UsuarioCadastro) => {
    setEditingId(usuario.id);
    setNome(usuario.nome);
    setEmailEscola(usuario.email_escola);
    setEmailUsuario(usuario.email_usuario || '');
    setUserRole(usuario.role || 'usuario');
    // Senha não é editável aqui, apenas via funçao específica
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNome('');
    setEmailEscola('');
    setEmailUsuario('');
    setPassword('');
    setUserRole('usuario');
  };

  const handleDelete = async (id: string, email?: string) => {
    if (window.confirm(t.usuarios.confirmExcluirUsu + ` ${email || ''}?`)) {
      try {
        setLoading(true);
        // 1. Remover do Authentication
        if (supabaseAdmin) {
          const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
          if (authError) console.warn('Aviso: Erro ao remover do Authentication:', authError.message);
        }

        // 2. Remover do Profile
        const { error } = await supabase.from('Profile').delete().eq('id', id);
        if (error) throw error;

        setUsuarios(prev => prev.filter(u => u.id !== id));
        alert(t.cadastros.sucessoAtualizar);
      } catch (error) {
        console.error('Erro ao excluir:', error);
        alert(t.common.erroExcluir);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeactivate = async (usuario: UsuarioCadastro) => {
    const status = usuario.nome.includes('(DESATIVADO)') ? t.common.sim.toLowerCase() : t.common.nao.toLowerCase();
    if (window.confirm(`${t.common.editar}?`)) {
      try {
        let novoNome = usuario.nome;
        if (status === 'desativar') {
          novoNome = `${usuario.nome} (DESATIVADO)`;
        } else {
          novoNome = usuario.nome.replace(' (DESATIVADO)', '');
        }

        const { error } = await supabase
          .from('Profile')
          .update({ nome: novoNome })
          .eq('id', usuario.id);

        if (error) throw error;
        setUsuarios(prev => prev.map(u => u.id === usuario.id ? { ...u, nome: novoNome } : u));
      } catch (error) {
        console.error('Erro ao alterar status:', error);
      }
    }
  };

  const handleChangePassword = async (id: string, email: string) => {
    const isAdmin = currentAdminEmail === 'cpdinfra@edu.itaguai.rj.gov.br';
    if (!isAdmin) {
      alert(t.common.acessoRestrito);
      return;
    }

    if (!supabaseAdmin) {
      alert('Erro: Cliente administrativo não configurado.');
      return;
    }

    const newPassword = window.prompt(`Digite a nova senha para ${email}:`);
    if (newPassword && newPassword.length >= 6) {
      try {
        setLoading(true);
        const { error } = await supabaseAdmin.auth.admin.updateUserById(id, { password: newPassword });
        if (error) throw error;
        alert(t.cadastros.sucessoAtualizar);
      } catch (error: any) {
        alert('Erro: ' + error.message);
      } finally {
        setLoading(false);
      }
    } else if (newPassword) {
      alert('Mínimo de 6 caracteres.');
    }
  };

  const filteredUsuarios = usuarios.filter(u =>
    u.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email_escola.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.email_usuario && u.email_usuario.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg text-white shadow-lg shadow-blue-200">
            <Users size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{t.usuarios.titulo}</h2>
            <p className="text-gray-600">{t.usuarios.subtitulo}</p>
          </div>
        </div>
      </div>

      {/* Formulário Expandido */}
      <div className={`bg-white rounded-2xl shadow-sm border ${editingId ? 'border-blue-200 ring-2 ring-blue-50' : 'border-gray-100'} p-8 transition-all`}>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-6 rounded-full ${editingId ? 'bg-blue-500' : 'bg-green-500'}`}></div>
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-tight">
              {editingId ? t.usuarios.editandoPerfil : t.usuarios.novoUsuario}
            </h3>
          </div>
          {!editingId && <span className="text-[10px] bg-slate-100 px-3 py-1 rounded-full font-bold text-slate-500">AUTH + PROFILE</span>}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {/* Seção Dados Pessoais */}
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">{t.usuarios.nomeCompleto} *</label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-medium"
                  placeholder="Nome do Diretor ou Admin"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">{t.escolas.nomeEscola} *</label>
                <select
                  value={emailEscola}
                  onChange={(e) => setEmailEscola(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-medium"
                  required
                >
                  <option value="">{t.lancamentos.selecione}</option>
                  {escolas.map(escola => (
                    <option key={escola.id} value={escola.email}>{escola.nome}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">{t.usuarios.nivelAcesso} *</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setUserRole('usuario')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 border rounded-xl font-bold text-xs transition-all ${userRole === 'usuario' ? 'bg-blue-50 border-blue-500 text-blue-600 shadow-sm' : 'bg-white border-slate-200 text-slate-400'}`}
                  >
                    <User size={14} /> {t.usuarios.usuarioDiretor}
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserRole('admin')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 border rounded-xl font-bold text-xs transition-all ${userRole === 'admin' ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white border-slate-200 text-slate-400'}`}
                  >
                    <Shield size={14} /> {t.usuarios.adminCentral}
                  </button>
                </div>
              </div>
            </div>

            {/* Seção Dados de Login (Apenas novo ou visível) */}
            <div className={`space-y-4 ${editingId ? 'opacity-60 pointer-events-none' : ''}`}>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">{t.usuarios.emailLogin} *</label>
                <input
                  type="email"
                  value={emailUsuario}
                  onChange={(e) => setEmailUsuario(e.target.value)}
                  disabled={!!editingId}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-medium"
                  placeholder="ex: diretor@edu.itaguai.rj.gov.br"
                  required={!editingId}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">{t.usuarios.senhaInicial} *</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={!!editingId}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-medium"
                  placeholder="Mínimo 6 caracteres"
                  required={!editingId}
                />
                {editingId && <p className="text-[9px] text-amber-600 mt-2 font-bold uppercase tracking-tight">{t.usuarios.avisoSenha}</p>}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-50">
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="flex items-center px-6 py-3.5 bg-gray-100 text-gray-600 rounded-2xl hover:bg-gray-200 transition-all font-bold"
              >
                <X size={18} className="mr-2" /> {t.lancamentos.cancelar}
              </button>
            )}
            <button
              type="submit"
              disabled={saving}
              className="flex items-center px-8 py-3.5 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all font-bold shadow-lg shadow-blue-200 disabled:opacity-50"
            >
              {saving ? <Loader2 size={18} className="mr-2 animate-spin" /> : editingId ? <Check size={18} className="mr-2" /> : <Save size={18} className="mr-2" />}
              {saving ? t.usuarios.processando : editingId ? t.transferencias.salvarAlteracoes : t.usuarios.novoUsuario}
            </button>
          </div>
        </form>
      </div>

      {/* Lista com Busca Cruzada */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
            {t.usuarios.perfisSinc}
            {loading && <Loader2 size={14} className="text-blue-500 animate-spin" />}
          </h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder={t.usuarios.buscarUsuarios}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all w-full md:w-80 shadow-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/30 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                <th className="px-8 py-4">{t.login.entrar} / {t.login.senha}</th>
                <th className="px-8 py-4">{t.escolas.nomeEscola}</th>
                <th className="px-8 py-4 text-right pr-12">{t.common.acoes}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading && usuarios.length === 0 ? (
                <tr><td colSpan={3} className="px-8 py-20 text-center"><Loader2 className="animate-spin mx-auto opacity-20" size={40} /></td></tr>
              ) : filteredUsuarios.length === 0 ? (
                <tr><td colSpan={3} className="px-8 py-12 text-center text-gray-500 italic">{t.lancamentos.semRegistros}</td></tr>
              ) : (
                filteredUsuarios.map((usuario) => {
                  const escola = escolas.find(e => e.email === usuario.email_escola);
                  const isDesativado = usuario.nome.includes('(DESATIVADO)');
                  const isAdmin = usuario.role === 'admin';

                  return (
                    <tr key={usuario.id} className={`hover:bg-slate-50/50 transition-colors ${isDesativado ? 'opacity-50 grayscale bg-slate-100' : ''}`}>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${isAdmin ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                            {isAdmin ? <Shield size={16} /> : <User size={16} />}
                          </div>
                          <div>
                            <p className={`font-bold transition-colors ${editingId === usuario.id ? 'text-blue-600' : 'text-gray-800'}`}>
                              {usuario.nome}
                            </p>
                            <p className="text-[10px] text-blue-600 font-bold uppercase tracking-tight">{usuario.email_usuario || usuario.email_escola}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-700">{escola?.nome || 'Escola não encontrada'}</span>
                          <span className="text-[10px] text-gray-400 font-mono uppercase tracking-tighter opacity-70 italic">{usuario.email_escola}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center justify-end gap-1 shadow-sm rounded-xl p-1 bg-white border border-slate-100">
                          <button
                            onClick={() => handleEdit(usuario)}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title={t.common.editar}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeactivate(usuario)}
                            className={`p-2 rounded-lg transition-all ${isDesativado ? 'text-green-500 hover:bg-green-50' : 'text-amber-500 hover:bg-amber-50'}`}
                            title={isDesativado ? "Ativar" : "Desativar"}
                          >
                            <UserX size={16} />
                          </button>
                          <button
                            onClick={() => handleChangePassword(usuario.id, (usuario.email_usuario || usuario.email_escola))}
                            className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                            title={t.usuarios.resetarSenha}
                          >
                            <Key size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(usuario.id, usuario.nome)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title={t.common.excluir}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
