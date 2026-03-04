import React, { useState, useEffect } from 'react';
import { UsuarioCadastro, EscolaCadastro } from '../types';
import { Save, Trash2, Loader2, Search, Edit2, UserX, Key, Check, X, Shield, User } from 'lucide-react';
import { supabase, supabaseAdmin } from '../lib/supabaseClient';
import { useT } from '../lib/LanguageContext';

export const Usuarios: React.FC = () => {
  const { t } = useT();
  const [usuarios, setUsuarios] = useState<UsuarioCadastro[]>([]);
  const [escolas, setEscolas] = useState<EscolaCadastro[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    perfil: 'Escola' as 'Admin' | 'Escola',
    escola_id: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [uRes, eRes] = await Promise.all([
        supabase.from('profiles').select('*').order('nome'),
        supabase.from('escolas').select('*').order('nome')
      ]);

      if (uRes.error) throw uRes.error;
      if (eRes.error) throw eRes.error;

      setUsuarios(uRes.data || []);
      setEscolas(eRes.data || []);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome || !formData.email || (!editingId && !formData.senha)) {
      alert(t.usuarios.preenchaTodosCampos);
      return;
    }

    if (formData.perfil === 'Escola' && !formData.escola_id) {
      alert(t.usuarios.selecioneEscola);
      return;
    }

    try {
      setSaving(true);

      if (editingId) {
        // Atualizar perfil
        const { error } = await supabase
          .from('profiles')
          .update({
            nome: formData.nome,
            perfil: formData.perfil,
            escola_id: formData.perfil === 'Escola' ? formData.escola_id : null,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingId);

        if (error) throw error;

        // Se houver nova senha, atualizar no Auth via Service Role (Admin)
        if (formData.senha) {
          const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
            editingId,
            { password: formData.senha }
          );
          if (authError) throw authError;
        }
      } else {
        // Criar novo usuário (Auth + Profile)
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: formData.email,
          password: formData.senha,
          email_confirm: true,
          user_metadata: { nome: formData.nome }
        });

        if (authError) throw authError;

        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{
            id: authData.user.id,
            email: formData.email,
            nome: formData.nome,
            perfil: formData.perfil,
            escola_id: formData.perfil === 'Escola' ? formData.escola_id : null
          }]);

        if (profileError) throw profileError;
      }

      setFormData({ nome: '', email: '', senha: '', perfil: 'Escola', escola_id: '' });
      setEditingId(null);
      fetchData();
      alert(editingId ? t.usuarios.perfilAtualizado : t.usuarios.usuarioCriado);
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      alert(error.message || t.usuarios.erroSalvar);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (usuario: UsuarioCadastro) => {
    setEditingId(usuario.id);
    setFormData({
      nome: usuario.nome,
      email: usuario.email,
      senha: '',
      perfil: usuario.perfil,
      escola_id: usuario.escola_id || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string, perfil: string) => {
    if (perfil === 'Admin') {
      alert(t.usuarios.erroDeletarAdmin);
      return;
    }

    if (!confirm(t.usuarios.confirmarExclusao)) return;

    try {
      setLoading(true);
      // Deletar da Auth (via Service Role) e o Profile será deletado via Trigger/Cascade se houver, 
      // ou deletamos manualmente.
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
      if (authError) throw authError;

      const { error: profileError } = await supabase.from('profiles').delete().eq('id', id);
      if (profileError) throw profileError;

      fetchData();
      alert(t.usuarios.usuarioExcluido);
    } catch (error) {
      console.error('Erro ao deletar:', error);
      alert(t.usuarios.erroExcluir);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsuarios = usuarios.filter(u =>
    u.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Formulário Expandido */}
      <div className={`bg-white rounded-2xl shadow-sm border ${editingId ? 'border-blue-200 ring-2 ring-blue-50' : 'border-gray-100'} p-8 transition-all`}>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-6 rounded-full ${editingId ? 'bg-blue-500' : 'bg-green-500'}`}></div>
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-tight">
              {editingId ? t.usuarios.editandoPerfil : t.usuarios.novoUsuario}
            </h3>
          </div>
          {editingId && (
            <button
              onClick={() => {
                setEditingId(null);
                setFormData({ nome: '', email: '', senha: '', perfil: 'Escola', escola_id: '' });
              }}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">{t.usuarios.nomeCompleto}</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input
                  type="text"
                  value={formData.nome}
                  onChange={e => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all text-gray-700"
                  placeholder={t.usuarios.placeholderNome}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">{t.usuarios.email}</label>
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input
                  type="email"
                  value={formData.email}
                  disabled={!!editingId}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all text-gray-700 disabled:opacity-50"
                  placeholder="exemplo@email.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">
                {editingId ? t.usuarios.novaSenhaOpcional : t.usuarios.senha}
              </label>
              <div className="relative group">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.senha}
                  onChange={e => setFormData({ ...formData, senha: e.target.value })}
                  className="w-full pl-11 pr-12 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all text-gray-700"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors"
                >
                  <Search size={18} />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">{t.usuarios.perfil}</label>
              <div className="relative group">
                <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                <select
                  value={formData.perfil}
                  onChange={e => setFormData({ ...formData, perfil: e.target.value as any, escola_id: e.target.value === 'Admin' ? '' : formData.escola_id })}
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all text-gray-700 appearance-none"
                >
                  <option value="Escola">{t.usuarios.perfilEscola}</option>
                  <option value="Admin">{t.usuarios.perfilAdmin}</option>
                </select>
              </div>
            </div>

            {formData.perfil === 'Escola' && (
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">{t.usuarios.vinculoEscola}</label>
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                  <select
                    value={formData.escola_id}
                    onChange={e => setFormData({ ...formData, escola_id: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all text-gray-700 appearance-none"
                  >
                    <option value="">{t.usuarios.selecioneEscola}</option>
                    {escolas.map(e => (
                      <option key={e.id} value={e.id}>{e.nome}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="flex pt-4">
            <button
              type="submit"
              disabled={saving}
              className={`flex-1 md:flex-none md:min-w-[200px] flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-sm tracking-wide transition-all shadow-lg ${editingId ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200 text-white' : 'bg-green-600 hover:bg-green-700 shadow-green-200 text-white'} disabled:opacity-50`}
            >
              {saving ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
              {editingId ? t.usuarios.atualizarPerfil : t.usuarios.criarUsuario}
            </button>
          </div>
        </form>
      </div>

      {/* Lista de Usuários */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">{t.usuarios.usuariosCadastrados}</h3>
          <span className="text-[10px] font-black bg-gray-100 text-gray-500 px-3 py-1 rounded-full">{filteredUsuarios.length}</span>
        </div>

        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
          <input
            type="text"
            placeholder={t.usuarios.pesquisarUsuario}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500/20 transition-all outline-none text-gray-700"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredUsuarios.map(u => (
            <div key={u.id} className="group bg-white p-5 rounded-2xl border border-gray-100 hover:border-blue-200 transition-all hover:shadow-md">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${u.perfil === 'Admin' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                    {u.perfil === 'Admin' ? <Shield size={24} /> : <User size={24} />}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800">{u.nome}</h4>
                    <p className="text-xs text-gray-400 font-medium">{u.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-md ${u.perfil === 'Admin' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                        {u.perfil}
                      </span>
                      {u.escola_id && (
                        <span className="text-[10px] font-bold text-gray-400 truncate max-w-[150px]">
                          • {escolas.find(e => e.id === u.escola_id)?.nome}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEdit(u)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    title={t.usuarios.editar}
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(u.id, u.perfil)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    title={t.usuarios.excluir}
                  >
                    <UserX size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
