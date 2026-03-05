import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export const UniControlAI: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'system-start',
            role: 'assistant',
            content: 'Olá! Sou o UniControl AI, seu assistente logístico. Posso te ajudar com dados reais sobre o estoque, distribuição, escolas pendentes, etc. O que você gostaria de saber?',
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input.trim(),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {

            // Format history for the AI, skipping the initial greeting if preferred, but here we send all except the first one if it's too long, or just mapping to role/content
            const history = messages.filter(m => m.id !== 'system-start').map(m => ({
                role: m.role,
                content: m.content
            }));

            // Call Edge Function using Supabase client
            const { data, error } = await supabase.functions.invoke('unicontrol-ai', {
                body: {
                    message: userMsg.content,
                    history: history.slice(-6) // Keep only last 6 messages to avoid token limit
                }
            });

            if (error) {
                console.error('Edge function invoke error:', error);
                throw new Error('Falha técnica ao acessar a rede da IA.');
            }

            if (data && data.error) {
                console.error('Edge function internal error:', data.error);
                throw new Error(`Erro na Função: ${data.error}`);
            }

            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data?.response || 'Desculpe, não consegui gerar uma resposta.',
                timestamp: new Date()
            };

            setMessages(prev => [...prev, aiMsg]);

        } catch (error) {
            console.error('AI Error:', error);
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: 'Desculpe, ocorreu um erro ao conectar com o serviço de Inteligência Artificial. Verifique sua conexão ou tente novamente mais tarde.',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Floating Action Button */}
            <div className="fixed bottom-24 right-6 md:bottom-8 md:right-8 z-[100]">
                <button
                    onClick={() => setIsOpen(true)}
                    className={`${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'} transition-all duration-300 bg-gradient-to-r from-[#005A9C] to-blue-500 hover:shadow-blue-500/30 hover:scale-105 text-white p-4 rounded-full shadow-xl flex items-center justify-center relative group`}
                >
                    <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
                    <Sparkles size={20} className="absolute top-2 right-2 text-blue-200 animate-pulse" />
                    <Bot size={28} />
                </button>
            </div>

            {/* Chat Window */}
            <div
                className={`fixed z-[110] transition-all duration-400 ease-out flex flex-col bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-2xl rounded-tr-3xl rounded-tl-3xl md:rounded-3xl
                ${isOpen
                        ? 'bottom-0 right-0 w-full h-[85vh] md:bottom-8 md:right-8 md:w-[400px] md:h-[600px] translate-y-0 opacity-100'
                        : 'bottom-0 right-0 w-full h-0 md:bottom-8 md:right-8 md:w-[400px] md:h-[600px] translate-y-[100%] opacity-0 pointer-events-none'
                    }`}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-[#005A9C] to-blue-600 p-4 md:rounded-t-3xl flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                            <Bot className="text-white w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-black text-white text-lg tracking-tight flex items-center gap-2">
                                UniControl AI
                                <span className="bg-blue-400 text-blue-900 text-[9px] px-2 py-0.5 rounded-full uppercase tracking-widest">Beta</span>
                            </h3>
                            <p className="text-blue-100 text-[11px] font-medium">Seu analista logístico 24/7</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="text-white/70 hover:text-white hover:bg-white/10 p-2 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-black/20">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                        >
                            <div className="flex items-end gap-2 mb-1">
                                {msg.role === 'assistant' && (
                                    <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0 mb-1">
                                        <Bot size={14} className="text-blue-600" />
                                    </div>
                                )}
                                <div
                                    className={`px-4 py-3 rounded-2xl text-sm ${msg.role === 'user'
                                        ? 'bg-[#005A9C] text-white rounded-br-none shadow-md shadow-blue-500/10'
                                        : 'bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 rounded-bl-none border border-gray-100 dark:border-zinc-700/50 shadow-sm'
                                        }`}
                                >
                                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                </div>
                            </div>
                            <span className="text-[9px] text-gray-400 px-8">
                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex items-end gap-2 mr-auto max-w-[85%]">
                            <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0 mb-1">
                                <Bot size={14} className="text-blue-600" />
                            </div>
                            <div className="px-4 py-3 rounded-2xl bg-white dark:bg-zinc-800 rounded-bl-none border border-gray-100 dark:border-zinc-700/50 shadow-sm flex items-center gap-2">
                                <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></span>
                                <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                                <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white dark:bg-zinc-900 border-t border-gray-100 dark:border-zinc-800 rounded-b-3xl">
                    <form onSubmit={handleSend} className="relative flex items-center">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ex: Quais escolas ainda não informaram o recebimento?"
                            className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-full pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-white"
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            className={`absolute right-1 w-10 h-10 flex items-center justify-center rounded-full transition-all ${input.trim() && !isLoading
                                ? 'bg-[#005A9C] text-white hover:bg-blue-700 shadow-md'
                                : 'bg-transparent text-gray-400'
                                }`}
                        >
                            <Send size={18} className={input.trim() && !isLoading ? 'ml-1' : ''} />
                        </button>
                    </form>
                    <div className="mt-2 text-center text-[9px] text-gray-400 flex items-center justify-center gap-1">
                        <Sparkles size={10} /> IA sujeita a erros. Confira os dados painel.
                    </div>
                </div>
            </div>

            {/* Backdrop for Mobile */}
            {isOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-[105]"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </>
    );
};
