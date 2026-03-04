import React, { useState } from 'react';
import { FileJson, FileSpreadsheet, Upload, Info } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useT } from '../lib/LanguageContext';

export const BackupRestauracao: React.FC = () => {
    const { t } = useT();
    const [loading, setLoading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [file, setFile] = useState<File | null>(null);

    const tables = [
        'profiles',
        'escolas',
        'uniformes',
        'uniformes_catalogo',
        'estoque',
        'transferencias',
        'movimentacoes'
    ];

    const handleBackupJSON = async () => {
        setLoading(true);
        try {
            const backupData: Record<string, any> = {
                timestamp: new Date().toISOString(),
                database: {},
                localStorage: {}
            };

            // 1. Coleta de dados do Supabase (Tentar todas as tabelas, mas não travar se alguma falhar)
            for (const table of tables) {
                try {
                    const { data, error } = await supabase.from(table).select('*');
                    if (error) {
                        console.warn(`Aviso: Falha ao ler tabela ${table}: `, error.message);
                        backupData.database[table] = [];
                    } else {
                        backupData.database[table] = data;
                    }
                } catch (e) {
                    console.warn(`Erro na tabela ${table}: `, e);
                }
            }

            // 2. Coleta de dados do LocalStorage
            const lsKeys = [
                '@Uniformes:registros',
                '@Uniformes:transferencias',
                '@Uniformes:escolas',
                '@Uniformes:tema'
            ];
            lsKeys.forEach(key => {
                const val = localStorage.getItem(key);
                if (val) backupData.localStorage[key] = JSON.parse(val);
            });

            const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `backup_sistema_uniformes_${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Erro no backup:', error);
            alert(t.backup.erroBackup);
        } finally {
            setLoading(false);
        }
    };

    const handleBackupCSV = async () => {
        setLoading(true);
        try {
            // Tenta buscar do estoque do Supabase, mas com os nomes de colunas corretos (descricao em vez de nome)
            // Caso a tabela de estoque do banco esteja vazia ou incompleta, buscamos dos Lançamentos (localStorage)
            const { data, error } = await supabase.from('estoque').select('*, uniformes(descricao), escolas(nome)');

            let reportData = [];

            if (!error && data && data.length > 0) {
                reportData = (data as any[]).map((row: any) => ({
                    escola: row.escolas?.nome || 'N/A',
                    uniforme: row.uniformes?.descricao || 'N/A',
                    quantidade: row.quantidade,
                    data: new Date(row.updated_at).toLocaleDateString()
                }));
            } else {
                // FALLBACK: Usar dados do localStorage (Lançamentos)
                const localRegistros = localStorage.getItem('@Uniformes:registros');
                if (localRegistros) {
                    const registros = JSON.parse(localRegistros);
                    reportData = registros.map((r: any) => ({
                        escola: r.escola || 'N/A',
                        uniforme: r.tipo_uniforme || r.descricao || 'N/A',
                        quantidade: r.quantidade_alunos || 0,
                        data: new Date(r.data_registro).toLocaleDateString()
                    }));
                }
            }

            if (reportData.length === 0) {
                alert(t.backup.semDadosEstoque);
                return;
            }

            const headers = ['Escola', 'Uniforme/Item', 'Quantidade', 'Data Registro'];
            const csvContent = [
                headers.join(','),
                ...reportData.map(row => [
                    `"${row.escola}"`,
                    `"${row.uniforme}"`,
                    row.quantidade,
                    row.data
                ].join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `relatorio_estoque_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Erro no CSV:', error);
            alert(t.backup.erroCSV);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleRestore = async () => {
        if (!file) return;

        const confirm = window.confirm(t.backup.confirmRestaurar);
        if (!confirm) return;

        setLoading(true);
        try {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const content = JSON.parse(e.target?.result as string);
                    const dbData = content.database || content; // Suporte ao formato antigo

                    // 1. Restaurar Supabase
                    for (const table of tables) {
                        if (dbData[table] && dbData[table].length > 0) {
                            const { error } = await supabase.from(table).upsert(dbData[table]);
                            if (error) console.warn(`Erro ao restaurar tabela ${table}: `, error.message);
                        }
                    }

                    // 2. Restaurar LocalStorage
                    if (content.localStorage) {
                        Object.entries(content.localStorage).forEach(([key, val]) => {
                            localStorage.setItem(key, JSON.stringify(val));
                        });
                    }

                    alert(t.backup.sucessoRestaurar);
                    window.location.reload(); // Recarregar para aplicar mudanças do localStorage
                } catch (err) {
                    console.error(err);
                    alert(t.backup.erroJSON);
                }
            };
            reader.readAsText(file);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-4 animate-fadeIn">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* Card Backup Manual */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col">
                    <h2 className="text-xl font-bold text-gray-800 mb-2">{t.backup.manual}</h2>
                    <p className="text-gray-500 text-sm mb-8">
                        {t.backup.manualSub}
                    </p>

                    <div className="space-y-4 mt-auto">
                        <button
                            onClick={handleBackupJSON}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-3 bg-[#005A9C] hover:bg-[#004a80] text-white py-4 rounded-xl font-semibold transition-all shadow-md active:scale-[0.98] disabled:opacity-50"
                        >
                            <FileJson size={22} />
                            {t.backup.baixarJSON}
                        </button>

                        <button
                            onClick={handleBackupCSV}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-100 hover:border-[#005A9C] text-gray-700 hover:text-[#005A9C] py-4 rounded-xl font-semibold transition-all active:scale-[0.98] disabled:opacity-50"
                        >
                            <FileSpreadsheet size={22} className="text-green-600" />
                            {t.backup.baixarCSV}
                        </button>
                    </div>
                </div>

                {/* Card Restauração */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col">
                    <h2 className="text-xl font-bold text-gray-800 mb-2">{t.backup.restauracao}</h2>
                    <p className="text-gray-500 text-sm mb-4">
                        {t.backup.restauracaoSub} <span className="text-red-500 font-semibold">{t.backup.avisoSubstituir}</span>
                    </p>

                    <div
                        className={`flex - 1 border - 2 border - dashed rounded - 2xl flex flex - col items - center justify - center p - 6 transition - colors mb - 6 cursor - pointer ${dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300'} `}
                        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                        onDragLeave={() => setDragActive(false)}
                        onDrop={(e) => { e.preventDefault(); setDragActive(false); if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]); }}
                        onClick={() => document.getElementById('file-upload')?.click()}
                    >
                        <input
                            id="file-upload"
                            type="file"
                            accept=".json"
                            className="hidden"
                            onChange={handleFileUpload}
                        />
                        <Upload className={`mb - 3 ${file ? 'text-green-500' : 'text-gray-300'} `} size={40} />
                        <p className="text-gray-600 font-medium text-center">
                            {file ? file.name : t.backup.cliqueArquivo}
                        </p>
                        <p className="text-gray-400 text-xs mt-1">{t.backup.apenasJSON}</p>
                    </div>

                    <button
                        onClick={handleRestore}
                        disabled={!file || loading}
                        className="w-full flex items-center justify-center gap-3 bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 py-4 rounded-xl font-semibold transition-all disabled:opacity-40"
                    >
                        <Upload size={22} />
                        {t.backup.restaurarArquivo}
                    </button>
                </div>
            </div>

            {/* Info Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <h2 className="text-lg font-bold text-gray-800 mb-6 uppercase tracking-wider">{t.backup.sobreBackupAuto}</h2>
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 flex gap-5">
                    <div className="bg-white p-2 rounded-full h-fit shadow-sm">
                        <Info className="text-blue-500" size={24} />
                    </div>
                    <div className="space-y-4">
                        <p className="text-blue-900 font-medium leading-relaxed">
                            {t.backup.viabilidadeAuto}
                        </p>
                        <ul className="space-y-2 text-blue-800/80 text-sm list-disc pl-4">
                            <li>{t.backup.limitacaoNavegador}</li>
                            <li>{t.backup.seguranca}</li>
                        </ul>
                        <p className="text-blue-900 font-semibold pt-2">
                            {t.backup.recomendacao}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
