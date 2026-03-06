import React, { useState, useEffect } from 'react';
import { Package, Plus, Trash2, FileSpreadsheet, FileText, Edit2, Check, X, Loader2, ClipboardList, Layers, RefreshCw } from 'lucide-react';
import { useT } from '../lib/LanguageContext';
import { RECEBIMENTOS_MODELOS, RecebimentoModelo } from '../constants/recebimentosConstants';
import { Recebimento } from '../types';
import { supabase } from '../lib/supabaseClient';
import { exportarRecebimentosExcel, exportarRecebimentosPDF } from '../utils/exportUtils';

const CRECHES_AUTORIZADAS = [
    'cm.aparecidaazedo@edu.itaguai.rj.gov.br',
    'cm.mariaeduvigesdorosariosilva@edu.itaguai.rj.gov.br',
    'cm.daniellebatistadasilva@edu.itaguai.rj.gov.br',
    'cm.edsoncruzamado@edu.itaguai.rj.gov.br',
    'cm.euclydesjoseborges@edu.itaguai.rj.gov.br',
    'cm.estreladoceu@edu.itaguai.rj.gov.br',
    'cm.florentinoelias@edu.itaguai.rj.gov.br',
    'cm.franciscoxavierdemourabrito@edu.itaguai.rj.gov.br',
    'cm.jardimmar@edu.itaguai.rj.gov.br',
    'cm.joaquiminoue@edu.itaguai.rj.gov.br',
    'cm.renatobarbosaladislau@edu.itaguai.rj.gov.br',
    'cm.elianelopesbarbosa@edu.itaguai.rj.gov.br',
    'cm.mariacristinapadelacabraldasilva@edu.itaguai.rj.gov.br',
    'cm.mariadelurdessgarcia@edu.itaguai.rj.gov.br',
    'cm.taniamaramottademenezes@edu.itaguai.rj.gov.br',
    'cm.ritaferreirafeijo@edu.itaguai.rj.gov.br',
    'cm.mariarosagomesdonascimento@edu.itaguai.rj.gov.br'
];

export const Recebimentos: React.FC = () => {
    const { t } = useT();
    const [recebimentos, setRecebimentos] = useState<Recebimento[]>([]);
    const [modelosDisponiveis, setModelosDisponiveis] = useState<RecebimentoModelo[]>(RECEBIMENTOS_MODELOS);
    const [modeloSelecionado, setModeloSelecionado] = useState<RecebimentoModelo | null>(null);
    const [quantidades, setQuantidades] = useState<Record<string, number>>({});
    const [escola, setEscola] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState<string>('');
    const [segmentosEscola, setSegmentosEscola] = useState<string[]>([]);
    const [escolaNome, setEscolaNome] = useState<string>('');
    const [userRole, setUserRole] = useState<string>('usuario');
    const [saving, setSaving] = useState(false);
    const [mensagem, setMensagem] = useState<{ texto: string; tipo: 'sucesso' | 'erro' } | null>(null);
    const [isInitialLoadDone, setIsInitialLoadDone] = useState(false);
    const [isSynced, setIsSynced] = useState<boolean | null>(null); // null: loading, true: synced, false: error
    const [selectedYear, setSelectedYear] = useState<number>(2026);

    useEffect(() => {
        let isMounted = true;

        supabase.auth.getSession().then(({ data }) => {
            if (!isMounted) return;
            const emailUser = data.session?.user?.email ?? '';
            const userId = data.session?.user?.id;

            if (emailUser && emailUser.toLowerCase() !== escola.toLowerCase()) {
                setEscola(emailUser.toLowerCase());
            }

            if (userId) {
                // Get user role from Profile table
                supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', userId)
                    .single()
                    .then(({ data: profileData, error }) => {
                        if (!isMounted) return;
                        if (profileData?.role) {
                            setUserRole(profileData.role);
                        } else if (error || !profileData) {
                            // Fallback para caso haja profiles antigas (mesma lógica do App.tsx)
                            supabase
                                .from('profiles')
                                .select('role')
                                .eq('id', userId)
                                .single()
                                .then(({ data: oldProfileData }) => {
                                    if (!isMounted) return;
                                    if (oldProfileData?.role) {
                                        setUserRole(oldProfileData.role);
                                    }
                                });
                        }
                    });
            }

            if (emailUser) {
                // Carregar registros do Supabase para esta escola e ano selecionado
                const normalizedEmail = emailUser.toLowerCase().trim();
                const startDate = `${selectedYear}-01-01T00:00:00Z`;
                const endDate = `${selectedYear}-12-31T23:59:59Z`;

                supabase
                    .from('recebimentos')
                    .select('*')
                    .eq('escola', normalizedEmail)
                    .gte('data_recebimento', startDate)
                    .lte('data_recebimento', endDate)
                    .order('data_recebimento', { ascending: false })
                    .then(({ data: dbData, error: dbError }) => {
                        if (!isMounted) return;

                        const storageKey = `@Uniformes:recebimentos:${normalizedEmail}:${selectedYear}`;

                        if (!dbError) {
                            // Se não houver erro, o banco é a fonte da verdade (mesmo que vazio)
                            const finalData = dbData || [];
                            setRecebimentos(finalData);
                            setIsInitialLoadDone(true);
                            setIsSynced(true);
                            // Atualiza o cache local para refletir o estado real do banco
                            localStorage.setItem(storageKey, JSON.stringify(finalData));
                        } else {
                            // Houve erro (offline ou falha no banco) -> Fallback para LocalStorage
                            const dadosSalvos = localStorage.getItem(storageKey);
                            if (dadosSalvos) {
                                setRecebimentos(JSON.parse(dadosSalvos));
                            } else {
                                setRecebimentos([]);
                            }
                            setIsInitialLoadDone(true);
                            setIsSynced(false);
                        }
                    });

                supabase
                    .from('escolas')
                    .select('nome, segmentos')
                    .eq('email', normalizedEmail)
                    .single()
                    .then(({ data: escolaData }) => {
                        if (!isMounted) return;
                        if (escolaData) {
                            setEscolaNome(escolaData.nome || '');
                            setSegmentosEscola(escolaData.segmentos || []);
                        }
                    });
            } else {
                setIsInitialLoadDone(true);
            }
        });

        const carregarModelosCustomizados = async () => {
            try {
                const { data, error } = await supabase.from('modelos_recebimento').select('*').order('created_at', { ascending: false });
                if (!isMounted) return;

                if (!error && data && data.length > 0) {
                    const mapped: RecebimentoModelo[] = data.map((m: any) => ({
                        id: m.id,
                        nome: m.nome,
                        descricao: m.descricao,
                        tamanhos: Array.isArray(m.tamanhos) ? m.tamanhos : m.tamanhos.split(',').map((t: string) => t.trim()),
                        segmentos: Array.isArray(m.segmentos) ? m.segmentos : m.segmentos.split(',').map((s: string) => s.trim())
                    }));

                    const combined = [...mapped];
                    RECEBIMENTOS_MODELOS.forEach(standard => {
                        if (!combined.find(m => m.id === standard.id)) {
                            combined.push(standard);
                        }
                    });

                    setModelosDisponiveis(combined);
                    localStorage.setItem('@Uniformes:modelos_customizados', JSON.stringify(combined));
                } else {
                    setModelosDisponiveis(RECEBIMENTOS_MODELOS);
                    localStorage.setItem('@Uniformes:modelos_customizados', JSON.stringify(RECEBIMENTOS_MODELOS));
                }
            } catch (e) {
                if (!isMounted) return;
                const local = localStorage.getItem('@Uniformes:modelos_customizados');
                if (local) {
                    try {
                        setModelosDisponiveis(JSON.parse(local));
                    } catch {
                        setModelosDisponiveis(RECEBIMENTOS_MODELOS);
                    }
                } else {
                    setModelosDisponiveis(RECEBIMENTOS_MODELOS);
                }
            }
        };

        carregarModelosCustomizados();

        return () => {
            isMounted = false;
        };
    }, [selectedYear]);

    useEffect(() => {
        if (escola && isInitialLoadDone) {
            localStorage.setItem(`@Uniformes:recebimentos:${escola.toLowerCase().trim()}:${selectedYear}`, JSON.stringify(recebimentos));
        }
    }, [recebimentos, escola, isInitialLoadDone, selectedYear]);

    const handleModeloChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const modelo = modelosDisponiveis.find(m => m.id === e.target.value) || null;
        setModeloSelecionado(modelo);
        setQuantidades({});
    };

    const handleQuantidadeChange = (tamanho: string, valor: string) => {
        const num = parseInt(valor) || 0;
        setQuantidades(prev => ({ ...prev, [tamanho]: num }));
    };

    const adcionarItem = async () => {
        if (!modeloSelecionado) return;

        // Filtramos os tamanhos que ainda não foram lançados para este modelo
        const tamanhosPendentes = modeloSelecionado.tamanhos.filter(tamanho =>
            !recebimentos.some(r => r.modelo_id === modeloSelecionado.id && r.tamanho === tamanho)
        );

        const novosItens: Recebimento[] = tamanhosPendentes.map(tamanho => ({
            id: crypto.randomUUID(),
            escola,
            data_recebimento: new Date().toISOString(),
            modelo_id: modeloSelecionado.id,
            modelo_nome: modeloSelecionado.nome,
            descricao: modeloSelecionado.descricao,
            tamanho,
            quantidade: quantidades[tamanho] || 0,
        }));

        if (novosItens.length === 0) return;

        try {
            setSaving(true);

            // 1. Tentar salvar no Supabase se possível
            const payload = novosItens.map(item => ({
                escola: item.escola,
                modelo_id: item.modelo_id,
                modelo_nome: item.modelo_nome,
                descricao: item.descricao,
                tamanho: item.tamanho,
                quantidade: item.quantidade,
                data_recebimento: item.data_recebimento
            }));

            const { error } = await supabase
                .from('recebimentos')
                .insert(payload);

            if (error) {
                console.warn('Erro ao salvar no Supabase:', error.message);
                setIsSynced(false);
                mostrarMensagem('Dados salvos apenas LOCALMENTE. O servidor não respondeu.', 'erro');
            } else {
                setIsSynced(true);
                mostrarMensagem(t.recebimentos.sucessoSalvar);
            }

            // 2. Atualizar estado local
            setRecebimentos(prev => [...novosItens, ...prev]);
            setQuantidades({});
            setModeloSelecionado(null);

        } catch (error) {
            console.error('Erro ao processar recebimento:', error);
        } finally {
            setSaving(false);
        }
    };

    const sincronizarTudo = async () => {
        if (recebimentos.length === 0) return;

        try {
            setSaving(true);
            const payload = recebimentos.map(item => ({
                escola: item.escola,
                modelo_id: item.modelo_id,
                modelo_nome: item.modelo_nome,
                descricao: item.descricao,
                tamanho: item.tamanho,
                quantidade: item.quantidade,
                data_recebimento: item.data_recebimento
            }));

            // Tentar inserir todos. O Supabase pode dar erro de duplicata se alguns já existirem, 
            // mas como o id é gerado no banco, aqui ele vai tentar inserir todos como novos.
            // Para ser mais robusto, poderíamos usar upsert se tivéssemos uma constraint.
            const { error } = await supabase
                .from('recebimentos')
                .insert(payload);

            if (error) {
                console.error('Erro na sincronização em massa:', error);
                mostrarMensagem('Falha ao sincronizar com o servidor.', 'erro');
                setIsSynced(false);
            } else {
                mostrarMensagem('Todos os dados foram sincronizados com a nuvem!', 'sucesso');
                setIsSynced(true);
            }
        } catch (error) {
            console.error('Erro ao sincronizar:', error);
            mostrarMensagem('Erro inesperado ao sincronizar.', 'erro');
        } finally {
            setSaving(false);
        }
    };

    const removerItem = async (id: string) => {
        if (window.confirm(t.recebimentos.confirmExcluir)) {
            try {
                // Tenta excluir do banco (opcional, se a tabela existir)
                await supabase.from('recebimentos').delete().eq('id', id);

                setRecebimentos(prev => prev.filter(item => item.id !== id));
                mostrarMensagem(t.lancamentos.sucessoExcluir);
            } catch (err) {
                console.error('Erro ao remover item:', err);
            }
        }
    };

    const removerModelo = async (modeloId: string, modeloNome: string) => {
        if (window.confirm(`Deseja realmente excluir TODOS os tamanhos do modelo "${modeloNome}"?`)) {
            try {
                setSaving(true);
                // 1. Tentar remover do Supabase
                const { error } = await supabase
                    .from('recebimentos')
                    .delete()
                    .eq('modelo_id', modeloId)
                    .eq('escola', escola);

                if (error) {
                    console.warn('Erro ao remover modelo do Supabase:', error.message);
                }

                // 2. Atualizar estado local
                setRecebimentos(prev => prev.filter(item => item.modelo_id !== modeloId));
                mostrarMensagem(`Todos os tamanhos do modelo "${modeloNome}" foram removidos.`);

            } catch (error) {
                console.error('Erro ao remover modelo:', error);
                mostrarMensagem('Erro ao remover modelo.', 'erro');
            } finally {
                setSaving(false);
            }
        }
    };

    const mostrarMensagem = (texto: string, tipo: 'sucesso' | 'erro' = 'sucesso') => {
        setMensagem({ texto, tipo });
        setTimeout(() => setMensagem(null), 3000);
    };

    const iniciarEdicao = (item: Recebimento) => {
        setEditingId(item.id);
        setEditValue(item.quantidade.toString());
    };

    const salvarEdicao = (id: string) => {
        const novaQtd = parseInt(editValue) || 0;
        setRecebimentos(prev => prev.map(item =>
            item.id === id ? { ...item, quantidade: novaQtd } : item
        ));
        setEditingId(null);
    };

    // Filtra os modelos baseados no segmento da escola e na role do usuário
    const modelosFiltrados = modelosDisponiveis.filter(modelo => {
        const userRoleLower = userRole?.toLowerCase() || '';
        const isAdmin = userRoleLower === 'admin' || userRoleLower === 'administrador' || userRoleLower === 'super administrador' || userRoleLower.includes('admin');

        // Administradores veem todos os modelos por padrão
        if (isAdmin) return true;

        const schoolSegmentsUpper = segmentosEscola.map(s => s.toUpperCase());
        const modelSegmentsUpper = modelo.segmentos.map(s => s.toUpperCase());
        const normalizedEscola = escola.toLowerCase().trim();

        // Se o modelo é GERAL, todos veem
        if (modelSegmentsUpper.includes('GERAL')) return true;

        // Lógica de Interseção com Restrição de Segurança (Granular por Segmento)
        const hasValidSegmentMatch = modelSegmentsUpper.some(ms => {
            // Normaliza nomes de segmentos para comparação flexível
            const normalizedMS = ms.replace('CONJUNTO UNIFORME ESCOLAR ', '').trim();

            // Verifica se o segmento da escola combina com este segmento do modelo
            const isMatch = schoolSegmentsUpper.some(ss => {
                const normalizedSS = ss.replace('CONJUNTO UNIFORMA ESCOLAR ', '').trim();

                // Caso especial: INICIAIS costuma se referir a FUNDAMENTAL 1-3 ou 1-5
                if (normalizedMS === 'INICIAIS' && normalizedSS.includes('FUNDAMENTAL')) return true;
                if (normalizedSS === 'INICIAIS' && normalizedMS.includes('FUNDAMENTAL')) return true;

                return normalizedSS.includes(normalizedMS) || normalizedMS.includes(normalizedSS);
            });

            if (isMatch) {
                // Se o match for em CRECHE ou BERÇÁRIO, aplica a trava de e-mail
                const isRestrictedSegment = normalizedMS.includes('CRECHE') || normalizedMS.includes('BERÇÁRIO');
                if (isRestrictedSegment) {
                    return CRECHES_AUTORIZADAS.includes(normalizedEscola);
                }
                // Se for match em qualquer outro segmento (Fundamental, EJA, etc), é válido!
                return true;
            }
            return false;
        });

        // Caso especial secundário: Material Pedagógico (mantendo flexibilidade de EJA)
        const isMaterialPedagogico = modelo.nome.toUpperCase().includes('MATERIAL PEDAGÓGICO');
        if (isMaterialPedagogico && !hasValidSegmentMatch) {
            const temEJA = schoolSegmentsUpper.some(s => s.includes('EJA') || s.includes('NCEJA'));
            // Se tiver EJA e o modelo for EJA, permite (mesmo sem match estrito de segmento)
            if (temEJA && modelSegmentsUpper.includes('EJA')) return true;
        }

        return hasValidSegmentMatch;
    });

    const handleExportExcel = () => {
        if (recebimentos.length === 0) return;
        exportarRecebimentosExcel(recebimentos, escolaNome || escola, modelosDisponiveis);
    };

    const handleExportPDF = () => {
        if (recebimentos.length === 0) return;
        exportarRecebimentosPDF(recebimentos, escolaNome || escola);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 relative">
            {mensagem && (
                <div className={`fixed top-20 right-8 px-6 py-3 rounded-lg shadow-lg text-white font-medium z-50 transition-all ${mensagem.tipo === 'sucesso' ? 'bg-green-600' : 'bg-red-600'
                    }`}>
                    {mensagem.texto}
                </div>
            )}
            <div className="pt-4 pb-2 flex justify-between items-center">
                <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 px-4 py-2 rounded-2xl shadow-sm">
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

            {/* Metric Cards - Exact UI match */}
            <div className="grid grid-cols-3 gap-3 md:gap-6 mb-4 md:mb-8 mt-2">
                {/* Card 1: Registros */}
                <div className="bg-white dark:bg-zinc-900/40 dark:backdrop-blur-xl py-5 px-2 md:p-6 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm dark:shadow-2xl dark:shadow-black/20 flex flex-col items-center justify-center text-center">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-[#5193EB] dark:text-blue-400 rounded-2xl mb-2">
                        <ClipboardList className="w-5 h-5 md:w-8 md:h-8" strokeWidth={2} />
                    </div>
                    <p className="text-[9px] md:text-xs font-black text-gray-400 dark:text-zinc-500 uppercase tracking-[0.15em] mb-1">
                        Registros
                    </p>
                    <p className="text-xl md:text-4xl font-black text-slate-800 dark:text-white leading-none">
                        {recebimentos.length}
                    </p>
                </div>

                {/* Card 2: Peças */}
                <div className="bg-white dark:bg-zinc-900/40 dark:backdrop-blur-xl py-5 px-2 md:p-6 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm dark:shadow-2xl dark:shadow-black/20 flex flex-col items-center justify-center text-center">
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 rounded-2xl mb-2">
                        <Package className="w-5 h-5 md:w-8 md:h-8" strokeWidth={2} />
                    </div>
                    <p className="text-[9px] md:text-xs font-black text-gray-400 dark:text-zinc-500 uppercase tracking-[0.15em] mb-1">
                        Peças
                    </p>
                    <p className="text-xl md:text-4xl font-black text-slate-800 dark:text-white leading-none">
                        {recebimentos.reduce((acc, curr) => acc + (curr.quantidade || 0), 0)}
                    </p>
                </div>

                {/* Card 3: Modelos */}
                <div className="bg-white dark:bg-zinc-900/40 dark:backdrop-blur-xl py-5 px-2 md:p-6 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm dark:shadow-2xl dark:shadow-black/20 flex flex-col items-center justify-center text-center relative overflow-hidden">
                    <div className="p-3 bg-purple-50 dark:bg-purple-900/30 text-purple-500 rounded-2xl mb-2">
                        <Layers className="w-5 h-5 md:w-8 md:h-8" strokeWidth={2} />
                    </div>
                    <p className="text-[9px] md:text-xs font-black text-gray-400 dark:text-zinc-500 uppercase tracking-[0.15em] mb-1">
                        Modelos
                    </p>
                    <p className="text-xl md:text-4xl font-black text-slate-800 dark:text-white leading-none">
                        {new Set(recebimentos.map(r => r.modelo_id)).size}
                    </p>
                    {/* Status de Sincronização */}
                    <div className="absolute top-3 right-3 flex items-center gap-1">
                        {isSynced === true ? (
                            <div className="flex items-center gap-1.5 bg-green-50/50 dark:bg-green-900/30 px-2 py-1 rounded-full border border-green-100/50 dark:border-green-800/20" title="Sincronizado com a nuvem">
                                <Check className="text-green-500 w-3 h-3" />
                                <span className="text-[8px] font-bold text-green-600 dark:text-green-400 uppercase">Sinc</span>
                            </div>
                        ) : isSynced === false ? (
                            <button
                                onClick={sincronizarTudo}
                                disabled={saving}
                                className="flex items-center gap-1.5 bg-amber-50/50 dark:bg-amber-900/30 px-2 py-1 rounded-full border border-amber-100/50 dark:border-amber-800/20 animate-pulse hover:bg-amber-100 dark:hover:bg-amber-800/50 transition-colors"
                            >
                                <RefreshCw className={`text-amber-500 w-3 h-3 ${saving ? 'animate-spin' : ''}`} />
                                <span className="text-[8px] font-bold text-amber-600 dark:text-amber-400 uppercase">Pend</span>
                            </button>
                        ) : (
                            <div className="flex items-center gap-1.5 bg-blue-50/50 dark:bg-blue-900/30 px-2 py-1 rounded-full border border-blue-100/50 dark:border-blue-800/20">
                                <Loader2 className="text-blue-500 w-3 h-3 animate-spin" />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Form Card */}
            <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-[0_4px_12px_rgba(0,0,0,0.06)] p-5 md:p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-3">
                        <label className="text-xs md:text-sm font-black text-gray-900 dark:text-zinc-200 uppercase tracking-widest block">
                            MODELO
                        </label>
                        <select
                            className="w-full h-12 bg-gray-50 dark:bg-zinc-800 border-none rounded-xl px-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#005A9C] transition-all cursor-pointer"
                            value={modeloSelecionado?.id || ''}
                            onChange={handleModeloChange}
                        >
                            <option value="">{t.lancamentos.selecione}</option>
                            {modelosFiltrados
                                .filter(m => {
                                    const tamanhosRegistrados = recebimentos
                                        .filter(r => r.modelo_id === m.id)
                                        .map(r => r.tamanho);
                                    // Oculta apenas se todos os tamanhos definidos para o modelo já estiverem na lista de recebimentos
                                    return !m.tamanhos.every(t => tamanhosRegistrados.includes(t));
                                })
                                .sort((a, b) => a.nome.localeCompare(b.nome, undefined, { numeric: true, sensitivity: 'base' }))
                                .map(m => (
                                    <option key={m.id} value={m.id}>
                                        {m.nome} - {m.descricao}
                                        {recebimentos.some(r => r.modelo_id === m.id) ? ` (${t.common.editar || 'Já Lançado'})` : ''}
                                    </option>
                                ))
                            }
                        </select>
                    </div>
                </div>

                {modeloSelecionado && (
                    <div className="space-y-6 p-6 bg-gray-50 dark:bg-zinc-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-zinc-700">
                        <h3 className="text-lg font-bold text-[#005A9C] dark:text-[#66b3ff] flex items-center gap-2">
                            <Package size={20} />
                            {modeloSelecionado.descricao}
                        </h3>

                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2">
                            {modeloSelecionado.tamanhos.map(tamanho => {
                                const itemExistente = recebimentos.find(r => r.modelo_id === modeloSelecionado.id && r.tamanho === tamanho);
                                const isRegistrado = !!itemExistente;

                                return (
                                    <div key={tamanho} className="space-y-1">
                                        <label
                                            className={`text-[10px] md:text-sm font-black uppercase text-center block truncate px-1 ${isRegistrado ? 'text-green-600 dark:text-green-400' : 'text-gray-700 dark:text-zinc-300'
                                                }`}
                                            title={tamanho}
                                        >
                                            {tamanho}
                                            {isRegistrado && <span className="ml-1 text-[8px] md:text-[10px]">✓</span>}
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="0"
                                                placeholder="0"
                                                className={`w-full h-9 bg-white dark:bg-zinc-900 border ${isRegistrado ? 'border-green-200 dark:border-green-900/30' : 'border-gray-200 dark:border-zinc-700'
                                                    } rounded-lg px-1 text-center text-sm focus:ring-2 focus:ring-[#005A9C] dark:text-white transition-all`}
                                                value={quantidades[tamanho] || ''}
                                                onChange={(e) => handleQuantidadeChange(tamanho, e.target.value)}
                                            />
                                            {isRegistrado && itemExistente && (
                                                <div className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 bg-green-500 text-white text-[8px] font-bold rounded-full shadow-sm animate-in zoom-in duration-300" title={`Já lançado: ${itemExistente.quantidade}`}>
                                                    {itemExistente.quantidade}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex justify-end pt-4">
                            <button
                                onClick={adcionarItem}
                                disabled={saving}
                                className="flex items-center gap-2 bg-[#005A9C] hover:bg-[#004a80] text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-[#005A9C]/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
                                {saving ? t.common.salvar : t.recebimentos.adicionar}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Result Table */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-gray-100 dark:border-zinc-800 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#005A9C]/10 rounded-xl flex items-center justify-center">
                            <FileText className="text-[#005A9C]" size={20} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-tight">
                                {t.recebimentos.itensRecebidos}
                            </h3>
                            <p className="text-[10px] text-gray-500 font-medium">{recebimentos.length} registro(s) no total</p>
                        </div>
                    </div>

                    {recebimentos.length > 0 && (
                        <div className="flex gap-2">
                            <button
                                onClick={handleExportExcel}
                                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-md shadow-green-600/10 active:scale-95"
                            >
                                <FileSpreadsheet size={16} /> Excel
                            </button>
                            <button
                                onClick={handleExportPDF}
                                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-md shadow-red-600/10 active:scale-95"
                            >
                                <FileText size={16} /> PDF
                            </button>
                        </div>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-zinc-50 dark:bg-zinc-900/50">
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t.recebimentos.modelo}</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t.recebimentos.tamanho}</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">{t.recebimentos.quantidade}</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">{t.common.acoes}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                            {recebimentos.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-400 dark:text-zinc-500 italic">
                                        {t.lancamentos.semRegistros}
                                    </td>
                                </tr>
                            ) : (
                                recebimentos.map(item => (
                                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1">
                                                    <div className="text-sm font-bold text-gray-900 dark:text-white uppercase truncate max-w-xs">{item.modelo_nome}</div>
                                                    <div className="text-[10px] text-gray-500 font-medium">{item.descricao}</div>
                                                </div>
                                                <button
                                                    onClick={() => removerModelo(item.modelo_id, item.modelo_nome)}
                                                    className="p-1.5 text-gray-300 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                    title="Remover todos os tamanhos deste modelo"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2.5 py-1 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 rounded text-[10px] font-bold border border-gray-200 dark:border-zinc-700 uppercase">
                                                {item.tamanho}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {editingId === item.id ? (
                                                <div className="flex items-center justify-center gap-2">
                                                    <input
                                                        type="number"
                                                        className="w-20 h-8 bg-white dark:bg-zinc-900 border border-[#005A9C] rounded px-2 text-center text-sm font-bold dark:text-white focus:outline-none"
                                                        value={editValue}
                                                        onChange={(e) => setEditValue(e.target.value)}
                                                        autoFocus
                                                    />
                                                    <button
                                                        onClick={() => salvarEdicao(item.id)}
                                                        className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                                                    >
                                                        <Check size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingId(null)}
                                                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <span className="text-sm font-extrabold text-[#005A9C] dark:text-[#66b3ff]">{item.quantidade}</span>
                                                    <span className="ml-1 text-[10px] text-gray-400 uppercase">un.</span>
                                                </>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right flex justify-end gap-1 items-center">
                                            <button
                                                onClick={() => iniciarEdicao(item)}
                                                className={`text-gray-300 hover:text-[#005A9C] p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5 transition-all ${editingId === item.id ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`}
                                                title={t.common.editar}
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => removerItem(item.id)}
                                                className={`text-gray-300 hover:text-red-500 dark:hover:text-red-400 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-all ${editingId === item.id ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`}
                                                title={t.common.excluir}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
