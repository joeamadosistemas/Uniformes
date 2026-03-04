import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { RegistroUniforme, Uniforme, Recebimento } from '../types';
import { RecebimentoModelo } from '../constants/recebimentosConstants';
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
export const exportarRecebimentosExcel = (
  recebimentos: Recebimento[],
  escolaNome: string,
  modelosInfo: { id: string, nome: string, descricao: string, tamanhos: string[] }[]
) => {
  const aoa: any[][] = [];
  const merges: { s: { r: number, c: number }, e: { r: number, c: number } }[] = [];

  // Agrupar por modelo para criar tabelas separadas ou uma grande tabela
  // A imagem mostra um modelo por vez (ou pelo menos um cabeçalho de modelo gigante)
  const porModelo = new Map<string, Recebimento[]>();
  recebimentos.forEach(r => {
    if (!porModelo.has(r.modelo_id)) porModelo.set(r.modelo_id, []);
    porModelo.get(r.modelo_id)!.push(r);
  });

  const lastColIdx = (tamanhos: string[]) => tamanhos.length + 1;

  let currentRow = 0;

  Array.from(porModelo.entries()).forEach(([modeloId, itens], modIdx) => {
    const modelo = modelosInfo.find(m => m.id === modeloId);
    if (!modelo) return;

    const maxCol = lastColIdx(modelo.tamanhos);

    // 1. Cabeçalho Institucional
    aoa.push(['PREFEITURA MUNICIPAL DE ITAGUAÍ']);
    merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: maxCol } });
    currentRow++;

    aoa.push(['SECRETARIA MUNICIPAL DE EDUCAÇÃO']);
    merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: maxCol } });
    currentRow++;

    aoa.push([escolaNome.toUpperCase()]);
    merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: maxCol } });
    currentRow++;

    aoa.push(['']); // Espaço
    currentRow++;

    // 2. Cabeçalho da Tabela (Estrutura da Imagem)
    // Linha de Título do Modelo (Mesclada no topo dos tamanhos)
    const modelHeaderRow = Array(maxCol + 1).fill('');
    modelHeaderRow[0] = 'UNIDADE ESCOLAR /';
    modelHeaderRow[1] = `${modelo.nome.toUpperCase()}`;
    aoa.push(modelHeaderRow);

    // Mescla "UNIDADE ESCOLAR / SOLICITAÇÕES..." na primeira coluna (2 linhas)
    merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow + 1, c: 0 } });
    // Mescla o Título do Modelo nas colunas de tamanhos
    merges.push({ s: { r: currentRow, c: 1 }, e: { r: currentRow, c: maxCol - 1 } });

    // Segunda linha do título esquerdo
    const subTitleRow = Array(maxCol + 1).fill('');
    subTitleRow[0] = 'SOLICITAÇÕES DO PRÉ AO 9º ANO';
    subTitleRow[1] = `- ${modelo.descricao} -`;
    aoa.push(subTitleRow);

    // Mescla a descrição do modelo na segunda linha
    merges.push({ s: { r: currentRow + 1, c: 1 }, e: { r: currentRow + 1, c: maxCol - 1 } });

    // Mescla "TOTAL ENTREGUE" na última coluna (2 linhas)
    modelHeaderRow[maxCol] = 'TOTAL';
    subTitleRow[maxCol] = 'ENTREGUE';
    merges.push({ s: { r: currentRow, c: maxCol }, e: { r: currentRow + 1, c: maxCol } });

    currentRow += 2;

    // 3. Cabeçalho de Tamanhos (Apenas Nº X)
    // A descrição já está na linha de cima (mesclada), então aqui encurtamos para ficar elegante
    const sizeHeaderRow = ["", ...modelo.tamanhos.map(t => {
      // Se for apenas número, mantém N.º X. Se for BB/P/M, mantém o texto.
      return isNaN(Number(t)) ? t : `N.º ${t}`;
    }), ""];
    aoa.push(sizeHeaderRow);
    currentRow++;

    // 4. Dados
    const dataRow: any[] = [escolaNome.toUpperCase()];
    let rowTotal = 0;
    modelo.tamanhos.forEach(t => {
      const item = itens.find(i => i.tamanho === t);
      const qtd = item ? item.quantidade : 0;
      dataRow.push(qtd);
      rowTotal += qtd;
    });
    dataRow.push(rowTotal);
    aoa.push(dataRow);
    currentRow++;

    // Espaço entre modelos (Mais respiro)
    aoa.push([]);
    aoa.push([]);
    aoa.push([]);
    currentRow += 3;
  });

  const worksheet = XLSX.utils.aoa_to_sheet(aoa);
  worksheet['!merges'] = merges;

  // Ajuste de largura das colunas (UX: Colunsa de tamanhos mais estreitas e uniformes)
  const wscols = [
    { wch: 45 }, // Unidade Escolar
    ...Array(20).fill({ wch: 8 }), // Tamanhos mais estreitos
    { wch: 15 }  // Total
  ];
  worksheet['!cols'] = wscols;

  // Tenta configurar paisagem (suporte limitado em JSON, mas ajuda em softwares que leem metadados)
  worksheet['!margins'] = { left: 0.7, right: 0.7, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 };

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Recebimentos");

  XLSX.writeFile(workbook, `recebimento_uniformes_${format(new Date(), 'yyyyMMdd')}.xlsx`);
};

export const exportarRecebimentosPDF = (
  recebimentos: Recebimento[],
  escolaNome: string
) => {
  const doc = new jsPDF('landscape');

  // Desenha o cabeçalho sem a escola para destacar manualmente
  const headerNextY = drawGovHeader(doc, 'Relatório de Recebimento de Uniformes', []);

  // Destaque do Nome da Escola
  doc.setFontSize(11);
  doc.setTextColor(0, 90, 156); // Azul institucional #005A9C
  doc.setFont("helvetica", "bold");
  doc.text(`UNIDADE ESCOLAR: ${escolaNome.toUpperCase()}`, 14, 50);

  const tableColumn = ["MODELO", "DESCRIÇÃO", "TAMANHO", "QUANTIDADE"];
  const tableRows = recebimentos.map(r => [
    r.modelo_nome,
    r.descricao,
    r.tamanho,
    r.quantidade.toString()
  ]);

  const totalQuantidade = recebimentos.reduce((acc, current) => acc + current.quantidade, 0);

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    foot: [["Total Geral", "", "", totalQuantidade.toString()]],
    startY: headerNextY + 2,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [0, 90, 156] }, // Cor #005A9C
    footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    columnStyles: {
      3: { halign: 'center', cellWidth: 30 }
    }
  });

  // Agrupamento por Item
  const finalY = (doc as any).lastAutoTable.finalY + 10;

  const totaisPorItem: Record<string, number> = {};
  recebimentos.forEach(r => {
    const nomeItem = `${r.modelo_nome} - ${r.descricao}`;
    totaisPorItem[nomeItem] = (totaisPorItem[nomeItem] || 0) + r.quantidade;
  });

  const summaryRows = Object.entries(totaisPorItem).map(([nome, qtd]) => [nome, qtd.toString()]);
  const summaryTotal = Object.values(totaisPorItem).reduce((acc, curr) => acc + curr, 0);

  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.text("Total Geral por Item", 14, finalY);

  autoTable(doc, {
    head: [["Item (Modelo - Descrição)", "Quantidade Total"]],
    body: summaryRows,
    foot: [["Total", summaryTotal.toString()]],
    startY: finalY + 3,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [0, 90, 156] },
    footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
    columnStyles: {
      1: { halign: 'center', cellWidth: 40 }
    }
  });

  doc.save(`recebimento_uniformes_${format(new Date(), 'yyyyMMdd')}.pdf`);
};

export const exportarControleRecebimentoPDF = (
  escolas: { nome: string; email: string; segmentos?: string[]; jaLancou: boolean; dataUltimoLancamento?: string }[]
) => {
  const doc = new jsPDF();
  const startY = drawGovHeader(doc, 'Controle de Recebimento por Unidade Escolar');

  const tableColumn = ["Unidade Escolar", "Etapas Atendidas", "Status", "Último Lançamento"];
  const tableRows = escolas.map(e => [
    e.nome,
    e.segmentos ? e.segmentos.map(s => s.replace('CONJUNTO UNIFORMA ESCOLAR ', '')).join(', ') : '-',
    e.jaLancou ? 'CONCLUÍDO' : 'PENDENTE',
    e.dataUltimoLancamento ? format(safeDate(e.dataUltimoLancamento), 'dd/MM/yyyy HH:mm') : '-'
  ]);

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: startY + 5,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [0, 51, 102] },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 50 },
      2: { cellWidth: 30, halign: 'center' },
      3: { cellWidth: 35, halign: 'right' }
    },
    didParseCell: (hookData) => {
      // Colorize the Status column
      if (hookData.section === 'body' && hookData.column.index === 2) {
        if (hookData.cell.raw === 'CONCLUÍDO') {
          hookData.cell.styles.textColor = [22, 163, 74]; // green-600
          hookData.cell.styles.fontStyle = 'bold';
        } else if (hookData.cell.raw === 'PENDENTE') {
          hookData.cell.styles.textColor = [217, 119, 6]; // amber-600
          hookData.cell.styles.fontStyle = 'bold';
        }
      }
    }
  });

  doc.save(`controle_recebimento_${format(new Date(), 'yyyyMMdd')}.pdf`);
};

export const exportarModelosPDF = (
  modelos: RecebimentoModelo[]
) => {
  const doc = new jsPDF();
  const startY = drawGovHeader(doc, 'Relatório de Gestão de Modelos de Uniformes');

  // ID Local, Modelo / Descrição, Tamanhos, e Segmentos
  const tableColumn = ["ID Local", "Modelo / Descrição", "Tamanhos", "Segmentos Atendidos"];
  const tableRows = modelos.map(m => [
    m.id.substring(0, 8), // Show abbreviated UUIDs or full short IDs
    `${m.nome}\n${m.descricao}`,
    m.tamanhos.join(', '),
    m.segmentos.map((s: string) => s.replace('CONJUNTO UNIFORMA ESCOLAR ', '')).join('\n')
  ]);

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: startY + 5,
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [0, 51, 102] },
    columnStyles: {
      0: { cellWidth: 25, halign: 'center' },
      1: { cellWidth: 65 },
      2: { cellWidth: 50 },
      3: { cellWidth: 40 }
    }
  });

  doc.save(`gestao_modelos_${format(new Date(), 'yyyyMMdd')}.pdf`);
};
