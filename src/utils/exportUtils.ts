import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { RegistroUniforme, Uniforme } from '../types';
import { format } from 'date-fns';
import { LOGO_ITAGUAI_BASE64 } from './logoBase64';

/** Converte string ou Date em Date sem lançar exceção */
const safeDate = (value: string | Date): Date => {
  const d = new Date(value);
  return isNaN(d.getTime()) ? new Date() : d;
};

/** Desenha o cabeçalho institucional padrão em um documento jsPDF */
const drawGovHeader = (doc: jsPDF, titulo: string, subinfo?: string[]) => {
  // Logo no canto superior esquerdo (x, y, width, height)
  // Ajustando proporção aproximada do brasão (mais alto que largo)
  doc.addImage(LOGO_ITAGUAI_BASE64, 'JPEG', 14, 10, 20, 24);

  // Textos Institucionais (alinhados ao lado da logo)
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.setFont("helvetica", "bold");
  doc.text('ESTADO DO RIO DE JANEIRO', 38, 15);
  doc.text('PREFEITURA MUNICIPAL DE ITAGUAÍ', 38, 20);
  doc.text('SECRETARIA MUNICIPAL DE EDUCAÇÃO', 38, 25);

  // Título do Relatório
  doc.setTextColor(0);
  doc.setFontSize(16);
  doc.text(titulo.toUpperCase(), 38, 34);

  // Linha divisória
  doc.setDrawColor(200);
  doc.line(14, 38, doc.internal.pageSize.getWidth() - 14, 38);

  // Informações adicionais abaixo da linha
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.setFont("helvetica", "normal");
  doc.text(`Data de Emissão: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 44);

  if (subinfo) {
    subinfo.forEach((text, index) => {
      doc.text(text, 14, 44 + ((index + 1) * 5));
    });
  }

  return 44 + ((subinfo?.length || 0) * 5) + 10; // Retorna o próximo Y disponível
};

export const exportarParaPDF = (registros: RegistroUniforme[], escolaNome: string = 'Todas as Escolas') => {
  const doc = new jsPDF('landscape');

  const startY = drawGovHeader(doc, 'Relatório de Controle de Uniformes', [
    `Unidade Escolar: ${escolaNome}`
  ]);

  // Totais Consolidados
  const totalFaltando = registros.reduce((acc, curr) => acc + (curr.qtd_faltando || 0), 0);
  const totalSobrando = registros.reduce((acc, curr) => acc + (curr.qtd_sobrando || 0), 0);

  doc.setFontSize(10);
  doc.setTextColor(0);
  doc.text(`Resumo: Total Faltando: ${totalFaltando} | Total Sobrando: ${totalSobrando}`, 14, startY - 2);

  // Tabela
  const tableColumn = ["Data", "Categoria", "Tipo", "Alunos", "Sobrando (Qtd/Tam)", "Faltando (Qtd/Tam)"];
  const tableRows = registros.map(r => [
    format(safeDate(r.data_registro), 'dd/MM/yyyy'),
    r.categoria || '-',
    r.tipo_uniforme,
    (r.qtd_alunos ?? 0).toString(),
    `${r.qtd_sobrando ?? 0} (${r.tamanho_sobrando || '-'})`,
    `${r.qtd_faltando ?? 0} (${r.tamanho_faltando || '-'})`
  ]);

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: startY + 2,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [0, 51, 102] },
    columnStyles: {
      2: { cellWidth: 50 }
    }
  });

  doc.save(`relatorio_uniformes_${format(new Date(), 'yyyyMMdd')}.pdf`);
};

export const exportarParaExcel = (registros: RegistroUniforme[]) => {
  const worksheetData = registros.map(r => ({
    'Data de Registro': format(safeDate(r.data_registro), 'dd/MM/yyyy HH:mm'),
    'Escola': r.escola,
    'Diretor(a)': r.diretor,
    'Qtd. Alunos': r.qtd_alunos ?? 0,
    'Categoria': r.categoria || '-',
    'Tipo de Uniforme': r.tipo_uniforme,
    'Qtd. Sobrando': r.qtd_sobrando ?? 0,
    'Tamanho Sobrando': r.tamanho_sobrando || '-',
    'Qtd. Faltando': r.qtd_faltando ?? 0,
    'Tamanho Faltando': r.tamanho_faltando || '-'
  }));

  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Uniformes");

  const wscols = [
    { wch: 18 }, { wch: 30 }, { wch: 20 }, { wch: 12 }, { wch: 22 }, { wch: 42 },
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
  const startY = drawGovHeader(doc, `Relatório de Unidades: ${tipo}`);

  const tableColumn = ["Unidade Escolar", "E-mail", "Status"];
  const tableRows = escolas.map(e => [e.nome, e.email, e.status]);

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: startY,
    headStyles: { fillColor: [0, 51, 102] }
  });

  doc.save(`relatorio_unidades_${tipo.toLowerCase().replace(/\s+/g, '_')}.pdf`);
};

export const exportarResumoEstoque = (
  dados: { escola: string; totalFaltando: number; totalSobrando: number }[],
  titulo: string
) => {
  const doc = new jsPDF();
  const startY = drawGovHeader(doc, titulo);

  const tableColumn = ["Unidade Escolar", "Total Faltando", "Total Sobrando"];
  const tableRows = dados.map(d => [d.escola, d.totalFaltando.toString(), d.totalSobrando.toString()]);

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: startY,
    headStyles: { fillColor: [0, 51, 102] }
  });

  doc.save(`resumo_estoque_${format(new Date(), 'yyyyMMdd')}.pdf`);
};

export const exportarCatalogoPDF = (uniformes: Uniforme[]) => {
  const doc = new jsPDF('landscape');

  const valorTotalGeral = uniformes.reduce((acc, curr) => acc + (curr.quantidade * curr.precoUnitario), 0);

  const startY = drawGovHeader(doc, 'Catálogo de Uniformes e Preços', [
    `Total de Itens: ${uniformes.length}`,
    `Valor Total Estimado do Catálogo: R$ ${valorTotalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
  ]);

  // Tabela
  const tableColumn = ["Segmento", "Unidade", "Modelo", "Descrição", "Tamanho", "Qtd", "Preço Un.", "Total"];
  const tableRows = uniformes.map(u => [
    u.segmento.replace('CONJUNTO UNIFORMA ESCOLAR ', '').replace('CONJUNTO UNIFORME ESCOLAR ', ''),
    u.unidade || '-',
    u.modelo || '-',
    u.descricao || '-',
    u.tamanho || '-',
    u.quantidade.toString(),
    `R$ ${u.precoUnitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    `R$ ${(u.quantidade * u.precoUnitario).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
  ]);

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: startY,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [0, 51, 102], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [245, 245, 245] }
  });

  doc.save(`catalogo_uniformes_${format(new Date(), 'yyyyMMdd')}.pdf`);
};

export const exportarCatalogoExcel = (uniformes: Uniforme[]) => {
  const worksheetData = uniformes.map(u => ({
    'Segmento': u.segmento,
    'Unidade': u.unidade || '-',
    'Modelo': u.modelo || '-',
    'Descrição': u.descricao || '-',
    'Tamanho': u.tamanho || '-',
    'Quantidade': u.quantidade,
    'Preço Unitário (R$)': u.precoUnitario,
    'Preço Total (R$)': u.quantidade * u.precoUnitario
  }));

  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Catálogo");

  const wscols = [
    { wch: 30 }, { wch: 10 }, { wch: 10 }, { wch: 40 }, { wch: 12 }, { wch: 10 }, { wch: 15 }, { wch: 15 }
  ];
  worksheet['!cols'] = wscols;

  XLSX.writeFile(workbook, `catalogo_uniformes_${format(new Date(), 'yyyyMMdd')}.xlsx`);
};
