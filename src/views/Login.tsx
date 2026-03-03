import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { LOGO_ITAGUAI_BASE64 } from '../utils/logoBase64';

interface LoginProps {
    onLoginSuccess: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const { error: authError } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
        });

        if (authError) {
            console.error('Erro de Autenticação:', authError);

            if (authError.message === 'Invalid login credentials') {
                setError('E-mail ou senha inválidos. Verifique suas credenciais.');
            } else if (authError.status === 400 || authError.status === 401) {
                setError('Credenciais inválidas ou conta não confirmada.');
            } else {
                setError(`Erro na conexão: ${authError.message}. Verifique as configurações do Netlify.`);
            }
            setLoading(false);
        } else {
            // Sessão gerenciada pelo onAuthStateChange no App.tsx
            onLoginSuccess();
        }
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center"
            style={{ backgroundColor: '#f0f2f5' }}
        >
            <div
                className="w-full max-w-sm rounded-xl overflow-hidden"
                style={{ boxShadow: '0 4px 32px rgba(0,0,0,0.13)' }}
            >
                {/* Header azul */}
                <div
                    className="flex flex-col items-center py-8 px-6"
                    style={{ background: 'linear-gradient(180deg, #1a56c4 0%, #1a4fba 100%)' }}
                >
                    {/* Brasão */}
                    <div
                        className="mb-4 rounded-full border-4 border-white overflow-hidden flex items-center justify-center shadow-md bg-white"
                        style={{ width: 80, height: 80 }}
                    >
                        <img
                            src={LOGO_ITAGUAI_BASE64}
                            alt="Brasão de Itaguaí"
                            className="w-full h-full object-contain p-1"
                        />
                    </div>

                    <h1
                        className="text-white font-bold tracking-wide"
                        style={{ fontSize: '1.3rem', letterSpacing: '0.04em' }}
                    >
                        SMEDU | CPD
                    </h1>
                    <p className="text-blue-100 text-sm mt-1" style={{ opacity: 0.9 }}>
                        Sistema de Controle de Uniformes
                    </p>
                </div>

                {/* Formulário branco */}
                <div className="bg-white px-8 py-8">
                    <h2 className="text-center text-gray-800 font-semibold text-lg mb-6">
                        Acesso ao Sistema
                    </h2>

                    <form onSubmit={handleSubmit} noValidate>
                        {/* Campo E-mail */}
                        <div className="mb-4">
                            <label
                                htmlFor="email"
                                className="block text-xs font-semibold mb-1"
                                style={{ color: '#e53e3e' }}
                            >
                                E-mail
                            </label>
                            <div
                                className="flex items-center border rounded-md overflow-hidden"
                                style={{ borderColor: '#d1d5db' }}
                            >
                                <span className="pl-3 pr-2 text-gray-400">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="2" y="4" width="20" height="16" rx="2" />
                                        <path d="M2 8l10 6 10-6" />
                                    </svg>
                                </span>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="seu.email@educ.itaguai.rj.gov.br"
                                    className="flex-1 py-2 pr-3 text-sm text-gray-700 outline-none bg-transparent"
                                    style={{ fontSize: '0.85rem' }}
                                    required
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        {/* Campo Senha */}
                        <div className="mb-5">
                            <label
                                htmlFor="password"
                                className="block text-xs font-semibold mb-1 text-gray-700"
                            >
                                Senha
                            </label>
                            <div
                                className="flex items-center border rounded-md overflow-hidden"
                                style={{ borderColor: '#d1d5db' }}
                            >
                                <span className="pl-3 pr-2 text-gray-400">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="11" width="18" height="11" rx="2" />
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                    </svg>
                                </span>
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="flex-1 py-2 text-sm text-gray-700 outline-none bg-transparent"
                                    style={{ fontSize: '0.85rem' }}
                                    required
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="pr-3 pl-2 text-gray-400 hover:text-gray-600 focus:outline-none"
                                    tabIndex={-1}
                                >
                                    {showPassword ? (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                                            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                                            <line x1="1" y1="1" x2="23" y2="23" />
                                        </svg>
                                    ) : (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                            <circle cx="12" cy="12" r="3" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Mensagem de erro */}
                        {error && (
                            <div className="mb-4 px-3 py-2 rounded-md text-xs text-red-700 bg-red-50 border border-red-200">
                                {error}
                            </div>
                        )}

                        {/* Botão Entrar */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 rounded-md text-white font-semibold text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1"
                            style={{
                                background: loading ? '#93a9e8' : 'linear-gradient(90deg, #1a4fba 0%, #1a56c4 100%)',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                letterSpacing: '0.05em',
                            }}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                                    </svg>
                                    Entrando...
                                </span>
                            ) : (
                                'Entrar'
                            )}
                        </button>
                    </form>
                </div>

                {/* Rodapé */}
                <div className="bg-gray-50 py-3 px-8 text-center border-t border-gray-100">
                    <p className="text-xs text-gray-400">
                        Prefeitura Municipal de Itaguaí — SMEDU/CPD
                    </p>
                </div>
            </div>
        </div>
    );
};
