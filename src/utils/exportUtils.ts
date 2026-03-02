import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { RegistroUniforme } from '../types';
import { format } from 'date-fns';

export const exportarParaPDF = (registros: RegistroUniforme[], escolaNome: string = 'Todas as Escolas') => {
  const doc = new jsPDF('landscape');

  // Cabeçalho
  doc.setFontSize(18);
  doc.text('Relatório de Controle de Uniformes', 14, 22);

  doc.setFontSize(11);
  doc.text(`Escola: ${escolaNome}`, 14, 30);
  doc.text(`Data de Emissão: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 36);

  // Totais Consolidados
  const totalFaltando = registros.reduce((acc, curr) => acc + (curr.qtd_faltando || 0), 0);
  const totalSobrando = registros.reduce((acc, curr) => acc + (curr.qtd_sobrando || 0), 0);

  doc.text(`Total Faltando: ${totalFaltando} | Total Sobrando: ${totalSobrando}`, 14, 44);

  // Tabela
  const tableColumn = ["Data", "Categoria", "Tipo", "Alunos", "Sobrando (Qtd/Tam)", "Faltando (Qtd/Tam)"];
  const tableRows = registros.map(r => [
    format(new Date(r.data_registro), 'dd/MM/yyyy'),
    r.categoria || '-',
    r.tipo_uniforme,
    r.qtd_alunos.toString(),
    `${r.qtd_sobrando} (${r.tamanho_sobrando || '-'})`,
    `${r.qtd_faltando} (${r.tamanho_faltando || '-'})`
  ]);

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 50,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [41, 128, 185] },
    columnStyles: {
      2: { cellWidth: 60 } // Dá mais espaço para o nome do uniforme
    }
  });

  doc.save(`relatorio_uniformes_${format(new Date(), 'yyyyMMdd')}.pdf`);
};

export const exportarParaExcel = (registros: RegistroUniforme[]) => {
  const worksheetData = registros.map(r => ({
    'Data de Registro': format(new Date(r.data_registro), 'dd/MM/yyyy HH:mm'),
    'Escola': r.escola,
    'Diretor(a)': r.diretor,
    'Qtd. Alunos': r.qtd_alunos,
    'Categoria': r.categoria || '-',
    'Tipo de Uniforme': r.tipo_uniforme,
    'Qtd. Sobrando': r.qtd_sobrando,
    'Tamanho Sobrando': r.tamanho_sobrando,
    'Qtd. Faltando': r.qtd_faltando,
    'Tamanho Faltando': r.tamanho_faltando
  }));

  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Uniformes");

  // Ajustar largura das colunas
  const wscols = [
    { wch: 18 }, { wch: 25 }, { wch: 20 }, { wch: 12 }, { wch: 20 }, { wch: 40 },
    { wch: 15 }, { wch: 18 }, { wch: 15 }, { wch: 18 }
  ];
  worksheet['!cols'] = wscols;

  XLSX.writeFile(workbook, `controle_uniformes_${format(new Date(), 'yyyyMMdd')}.xlsx`);
};

export const exportarRelatorioEscolas = (
  escolas: { nome: string; email: string; status: string }[],
  tipo: string
) => {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text(`Relatório de Unidades: ${tipo}`, 14, 22);
  doc.setFontSize(11);
  doc.text(`Data de Emissão: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 30);

  const tableColumn = ["Unidade Escolar", "E-mail", "Status"];
  const tableRows = escolas.map(e => [e.nome, e.email, e.status]);

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 40,
    headStyles: { fillColor: [41, 128, 185] }
  });

  doc.save(`relatorio_unidades_${tipo.toLowerCase().replace(/\s+/g, '_')}.pdf`);
};

export const exportarResumoEstoque = (
  dados: { escola: string; totalFaltando: number; totalSobrando: number }[],
  titulo: string
) => {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text(titulo, 14, 22);
  doc.setFontSize(11);
  doc.text(`Data de Emissão: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 30);

  const tableColumn = ["Unidade Escolar", "Total Faltando", "Total Sobrando"];
  const tableRows = dados.map(d => [d.escola, d.totalFaltando.toString(), d.totalSobrando.toString()]);

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 40,
    headStyles: { fillColor: [41, 128, 185] }
  });

  doc.save(`resumo_estoque_${format(new Date(), 'yyyyMMdd')}.pdf`);
};
