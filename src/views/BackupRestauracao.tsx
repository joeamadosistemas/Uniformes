import React, { useState } from 'react';
import { Database, FileJson, FileSpreadsheet, Upload, Info } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export const BackupRestauracao: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [file, setFile] = useState<File | null>(null);

    const tables = [
        'escolas',
        'uniformes',
        'estoque',
        'transferencias',
        'movimentacoes'
    ];

    const handleBackupJSON = async () => {
        setLoading(true);
        try {
            const backupData: Record<string, any> = {};

            for (const table of tables) {
                const { data, error } = await supabase.from(table).select('*');
                if (error) throw error;
                backupData[table] = data;
            }

            const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `backup_sistema_uniformes_${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Erro no backup:', error);
            alert('Falha ao gerar backup JSON.');
        } finally {
            setLoading(false);
        }
    };

    const handleBackupCSV = async () => {
        // Implementação simplificada para exportar estoque consolidado
        setLoading(true);
        try {
            const { data, error } = await supabase.from('estoque').select('*, uniformes(nome), escolas(nome)');
            if (error) throw error;

            const headers = ['Escola', 'Uniforme', 'Quantidade', 'Data Atualização'];
            const csvContent = [
                headers.join(','),
                ...data.map(row => [
                    `"${row.escolas?.nome || 'N/A'}"`,
                    `"${row.uniformes?.nome || 'N/A'}"`,
                    row.quantidade,
                    new Date(row.updated_at).toLocaleDateString()
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
            alert('Falha ao gerar relatório CSV.');
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

        const confirm = window.confirm('ATENÇÃO: Restaurar o backup substituirá todos os dados atuais. Deseja continuar?');
        if (!confirm) return;

        setLoading(true);
        try {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const content = JSON.parse(e.target?.result as string);

                    for (const table of tables) {
                        if (content[table]) {
                            // Limpar tabela (opcional - dependendo da RLS e política de deleção)
                            // Note: Supabase deletions often require filters or are restricted via RLS
                            // Para este MVP, vamos apenas tentar o Upsert
                            const { error } = await supabase.from(table).upsert(content[table]);
                            if (error) throw error;
                        }
                    }
                    alert('Restauração concluída com sucesso!');
                } catch (err) {
                    console.error(err);
                    alert('Erro ao processar arquivo JSON.');
                }
            };
            reader.readAsText(file);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-4 animate-fadeIn">
            {/* Header do Módulo */}
            <div className="flex items-center gap-4 mb-8">
                <div className="bg-[#005A9C] p-3 rounded-xl shadow-lg shadow-blue-200">
                    <Database className="text-white" size={32} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Backup e Restauração</h1>
                    <p className="text-gray-500">Gerencie a segurança e portabilidade dos seus dados.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* Card Backup Manual */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col">
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Backup Manual</h2>
                    <p className="text-gray-500 text-sm mb-8">
                        Crie e baixe uma cópia completa dos dados do sistema. Escolha o formato desejado abaixo.
                    </p>

                    <div className="space-y-4 mt-auto">
                        <button
                            onClick={handleBackupJSON}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-3 bg-[#005A9C] hover:bg-[#004a80] text-white py-4 rounded-xl font-semibold transition-all shadow-md active:scale-[0.98] disabled:opacity-50"
                        >
                            <FileJson size={22} />
                            Baixar Backup Completo (.json)
                        </button>

                        <button
                            onClick={handleBackupCSV}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-100 hover:border-[#005A9C] text-gray-700 hover:text-[#005A9C] py-4 rounded-xl font-semibold transition-all active:scale-[0.98] disabled:opacity-50"
                        >
                            <FileSpreadsheet size={22} className="text-green-600" />
                            Baixar Relatório Excel (.csv)
                        </button>
                    </div>
                </div>

                {/* Card Restauração */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col">
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Restauração</h2>
                    <p className="text-gray-500 text-sm mb-4">
                        Restaure o sistema a partir de um arquivo JSON. <span className="text-red-500 font-semibold">Atenção: Isso substituirá os dados atuais.</span>
                    </p>

                    <div
                        className={`flex-1 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-6 transition-colors mb-6 cursor-pointer ${dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
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
                        <Upload className={`mb-3 ${file ? 'text-green-500' : 'text-gray-300'}`} size={40} />
                        <p className="text-gray-600 font-medium text-center">
                            {file ? file.name : 'Clique para selecionar o arquivo'}
                        </p>
                        <p className="text-gray-400 text-xs mt-1">Suporta apenas arquivos .json</p>
                    </div>

                    <button
                        onClick={handleRestore}
                        disabled={!file || loading}
                        className="w-full flex items-center justify-center gap-3 bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 py-4 rounded-xl font-semibold transition-all disabled:opacity-40"
                    >
                        <Upload size={22} />
                        Restaurar Arquivo
                    </button>
                </div>
            </div>

            {/* Info Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <h2 className="text-lg font-bold text-gray-800 mb-6 uppercase tracking-wider">Sobre o Backup Automático</h2>
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 flex gap-5">
                    <div className="bg-white p-2 rounded-full h-fit shadow-sm">
                        <Info className="text-blue-500" size={24} />
                    </div>
                    <div className="space-y-4">
                        <p className="text-blue-900 font-medium leading-relaxed">
                            A implementação de um backup 100% automático (ex: todo dia às 8h para o Google Drive) não é tecnicamente viável neste ambiente de navegador.
                        </p>
                        <ul className="space-y-2 text-blue-800/80 text-sm list-disc pl-4">
                            <li>Limitação do Navegador: A aplicação roda no seu navegador e não possui um servidor dedicado para executar tarefas agendadas autonomamente.</li>
                            <li>Segurança: Armazenar credenciais de serviços externos diretamente no frontend não é recomendado.</li>
                        </ul>
                        <p className="text-blue-900 font-semibold pt-2">
                            Recomendação: Utilize a função de Backup Manual regularmente e salve o arquivo em um local seguro.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
