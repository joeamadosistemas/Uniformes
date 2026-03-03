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

  const startY = drawGovHeader(doc, 'Catálogo de Uniformes e Preços', [
    `Emitido em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`
  ]);

  // 1. IMPORTANTE: Garantir que a lista geral já venha ordenada pela data de cadastro (sequência de lançamento)
  // No CadastrosUniformes.tsx o fetch já traz order('data_cadastro', { ascending: false })
  // Mas para o PDF, o usuário quer na "sequência do lançamento" (provavelmente os mais antigos primeiro ou a ordem natural)
  // Vamos re-ordenar aqui para garantir cronologia ascendente (do primeiro ao último lançado)
  const itensOrdenados = [...uniformes].sort((a, b) => {
    const dateA = a.dataCadastro ? new Date(a.dataCadastro).getTime() : 0;
    const dateB = b.dataCadastro ? new Date(b.dataCadastro).getTime() : 0;
    return dateA - dateB;
  });

  // Agrupar por segmento mantendo a ordem de descoberta (que agora é cronológica)
  const gruposMap = new Map<string, Uniforme[]>();
  itensOrdenados.forEach(u => {
    if (!gruposMap.has(u.segmento)) {
      gruposMap.set(u.segmento, []);
    }
    gruposMap.get(u.segmento)!.push(u);
  });

  let currentY = startY;

  Array.from(gruposMap.entries()).forEach(([segmento, itens], index) => {
    // Se não for o primeiro grupo e não couber na página, adiciona nova página
    if (index > 0 && currentY > doc.internal.pageSize.getHeight() - 60) {
      doc.addPage();
      currentY = 20;
    }

    // Regra da Quantidade Estimada: Sempre o valor do PRIMEIRO item do segmento
    const qtdEstimada = itens[0]?.quantidade || 0;
    const nomeLimpo = segmento.replace('CONJUNTO UNIFORMA ESCOLAR ', '').replace('CONJUNTO UNIFORME ESCOLAR ', '');

    doc.setFillColor(230, 230, 230);
    doc.rect(14, currentY, doc.internal.pageSize.getWidth() - 28, 8, 'F');
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0);

    const headerText = `CONJUNTO UNIFORME ESCOLAR ${nomeLimpo.toUpperCase()} – Quantidade Estimada: ${qtdEstimada.toLocaleString('pt-BR')} ALUNOS`;
    doc.text(headerText, doc.internal.pageSize.getWidth() / 2, currentY + 6, { align: 'center' });

    currentY += 8;

    // Itens do grupo (já estão na sequência de lançamento)
    const tableColumn = ["ITEM", "Modelo", "Unid.", "Descrição", "Qtd/Aluno", "Quantidade", "Preço Unitário", "Preço Total"];
    const tableRows = itens.map((u, i) => [
      (i + 1).toString().padStart(2, '0'),
      u.modelo || '-',
      u.unidade || '-',
      u.descricao || '-',
      "01",
      u.quantidade.toLocaleString('pt-BR'),
      `R$ ${u.precoUnitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `R$ ${(u.quantidade * u.precoUnitario).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: currentY,
      margin: { left: 14, right: 14 },
      styles: {
        fontSize: 8,
        cellPadding: 2,
        lineColor: [180, 180, 180],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        textColor: [0, 0, 0],
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 12 },
        1: { halign: 'center', cellWidth: 15 },
        2: { halign: 'center', cellWidth: 15 },
        4: { halign: 'center', cellWidth: 20 },
        5: { halign: 'center', cellWidth: 20 },
        6: { halign: 'right', cellWidth: 25 },
        7: { halign: 'right', cellWidth: 25 },
      },
      didDrawPage: (data) => {
        currentY = data.cursor?.y || currentY;
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
  });

  // Valor Total Geral no final
  const valorTotalGeral = uniformes.reduce((acc, curr) => acc + (curr.quantidade * curr.precoUnitario), 0);
  if (currentY > doc.internal.pageSize.getHeight() - 20) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`VALOR TOTAL ESTIMADO DO CATÁLOGO: R$ ${valorTotalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 14, currentY + 5);

  doc.save(`catalogo_precos_uniformes_${format(new Date(), 'yyyyMMdd')}.pdf`);
};

export const exportarCatalogoExcel = (uniformes: Uniforme[]) => {
  // 1. Ordenação Cronológica (Sequência de Lançamento)
  const itensOrdenados = [...uniformes].sort((a, b) => {
    const dateA = a.dataCadastro ? new Date(a.dataCadastro).getTime() : 0;
    const dateB = b.dataCadastro ? new Date(b.dataCadastro).getTime() : 0;
    return dateA - dateB;
  });

  // 2. Agrupamento por Segmento
  const gruposMap = new Map<string, Uniforme[]>();
  itensOrdenados.forEach(u => {
    if (!gruposMap.has(u.segmento)) {
      gruposMap.set(u.segmento, []);
    }
    gruposMap.get(u.segmento)!.push(u);
  });

  // 3. Construção do AOA (Array of Arrays) e controle de Merges
  const aoa: any[][] = [];
  const merges: { s: { r: number, c: number }, e: { r: number, c: number } }[] = [];

  // Função auxiliar para adicionar linha mesclada
  const pushMergedRow = (content: string, rowIndex: number) => {
    aoa.push([content]);
    merges.push({ s: { r: rowIndex, c: 0 }, e: { r: rowIndex, c: 7 } }); // Mescla de A até H
  };

  // Cabeçalho Institucional
  pushMergedRow('ESTADO DO RIO DE JANEIRO', 0);
  pushMergedRow('PREFEITURA MUNICIPAL DE ITAGUAÍ', 1);
  pushMergedRow('SECRETARIA MUNICIPAL DE EDUCAÇÃO', 2);
  aoa.push(['']); // Linha 3 vaga
  pushMergedRow('CATÁLOGO DE UNIFORMES E PREÇOS', 4);
  pushMergedRow(`Data de Emissão: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 5);
  aoa.push(['']); // Linha 6 vaga

  let currentRow = 7;

  Array.from(gruposMap.entries()).forEach(([segmento, itens]) => {
    const qtdEstimada = itens[0]?.quantidade || 0;
    const nomeLimpo = segmento.replace('CONJUNTO UNIFORMA ESCOLAR ', '').replace('CONJUNTO UNIFORME ESCOLAR ', '');

    // Linha de Cabeçalho do Grupo (Lote) - Mesclada
    pushMergedRow(`CONJUNTO UNIFORME ESCOLAR ${nomeLimpo.toUpperCase()} – Quantidade Estimada: ${qtdEstimada.toLocaleString('pt-BR')} ALUNOS`, currentRow);
    currentRow++;

    // Cabeçalho da Tabela
    aoa.push(["ITEM", "Modelo", "Unid.", "Descrição", "Qtd/Aluno", "Quantidade", "Preço Unitário", "Preço Total"]);
    currentRow++;

    // Itens do Grupo
    itens.forEach((u, i) => {
      aoa.push([
        (i + 1).toString().padStart(2, '0'),
        u.modelo || '-',
        u.unidade || '-',
        u.descricao || '-',
        "01",
        u.quantidade,
        u.precoUnitario,
        u.quantidade * u.precoUnitario
      ]);
      currentRow++;
    });

    // Linhas em branco para separar blocos
    aoa.push(['']);
    aoa.push(['']);
    currentRow += 2;
  });

  // Valor Total Geral
  const valorTotalGeral = uniformes.reduce((acc, curr) => acc + (curr.quantidade * curr.precoUnitario), 0);
  aoa.push(['VALOR TOTAL ESTIMADO DO CATÁLOGO:', '', '', '', '', '', '', valorTotalGeral]);
  // Mescla o rótulo do total (opcional, vamos mesclar A-G e deixar o valor no H)
  merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: 6 } });

  // Criar Worksheet e Workbook
  const worksheet = XLSX.utils.aoa_to_sheet(aoa);

  // Aplicar as Mesclagens
  worksheet['!merges'] = merges;

  // Aplicar Formatação de Moeda nas colunas G e H (Preço Unitário e Preço Total)
  // Nota: Itera as células para aplicar o formato 'z' (formato de moeda local)
  // Mas no SheetJS básico (xlsx), o formato de número é 'z' ou 'numFmt'
  const range = XLSX.utils.decode_range(worksheet['!ref']!);
  for (let r = range.s.r; r <= range.e.r; ++r) {
    // Coluna G (índice 6) e H (índice 7)
    [6, 7].forEach(c => {
      const cellRef = XLSX.utils.encode_cell({ r, c });
      if (worksheet[cellRef] && typeof worksheet[cellRef].v === 'number') {
        worksheet[cellRef].t = 'n';
        worksheet[cellRef].z = '"R$ "#,##0.00';
      }
    });
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Catálogo");

  // Ajuste de largura das colunas
  const wscols = [
    { wch: 8 },  // ITEM
    { wch: 10 }, // Modelo
    { wch: 10 }, // Unid.
    { wch: 60 }, // Descrição (Maior para caber textos longos)
    { wch: 12 }, // Qtd/Aluno
    { wch: 15 }, // Quantidade
    { wch: 18 }, // Preço Unitário
    { wch: 18 }  // Preço Total
  ];
  worksheet['!cols'] = wscols;

  // Salvar
  XLSX.writeFile(workbook, `catalogo_precos_uniformes_${format(new Date(), 'yyyyMMdd')}.xlsx`);
};
