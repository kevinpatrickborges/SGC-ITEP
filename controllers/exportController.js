const { Desarquivamento } = require('../models');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

// Funções de exportação de vestígios removidas na simplificação

// --- Funções de Exportação para Desarquivamentos ---

exports.exportDesarquivamentosExcel = async (req, res) => {
  try {
    const desarquivamentos = await Desarquivamento.findAll();
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Desarquivamentos');
    worksheet.columns = [
      { header: 'Nº Documento', key: 'numDocumento', width: 20 },
      { header: 'Nome Completo', key: 'nomeCompleto', width: 40 },
      { header: 'Tipo de Documento', key: 'tipoDocumento', width: 25 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Setor Demandante', key: 'setorDemandante', width: 30 },
      { header: 'Data de Solicitação', key: 'dataSolicitacao', width: 20 },
      { header: 'Data de Devolução', key: 'dataDevolucao', width: 20 },
    ];

    desarquivamentos.forEach(d => {
      worksheet.addRow({
        numDocumento: d.numDocumento,
        nomeCompleto: d.nomeCompleto,
        tipoDocumento: d.tipoDocumento,
        status: d.status,
        setorDemandante: d.setorDemandante,
        dataSolicitacao: d.dataSolicitacao ? new Date(d.dataSolicitacao).toLocaleDateString('pt-BR') : '',
        dataDevolucao: d.dataDevolucao ? new Date(d.dataDevolucao).toLocaleDateString('pt-BR') : '',
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=desarquivamentos.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("Erro ao exportar desarquivamentos para Excel:", err);
    res.status(500).json({ error: 'Erro ao exportar desarquivamentos para Excel.' });
  }
};

exports.exportDesarquivamentosPDF = async (req, res) => {
  try {
    const desarquivamentos = await Desarquivamento.findAll();
    const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=desarquivamentos.pdf');
    doc.pipe(res);

    doc.fontSize(16).text('Relatório de Desarquivamentos', { align: 'center' });
    doc.moveDown();

    const tableTop = doc.y;
    const itemHeight = 40;
    const headers = ['Nº Doc', 'Nome Completo', 'Tipo Documento', 'Status', 'Setor Demandante', 'Data Solicitação'];
    
    // Simula uma tabela para melhor alinhamento
    function drawTableRow(y, rowData) {
        const colPositions = [30, 100, 250, 380, 480, 650];
        rowData.forEach((text, i) => {
            doc.fontSize(8).text(text, colPositions[i], y, { width: colPositions[i+1] - colPositions[i] - 5, align: 'left' });
        });
    }

    // Cabeçalho da tabela
    drawTableRow(tableTop, headers);
    doc.moveTo(30, tableTop + 15).lineTo(750, tableTop + 15).stroke();

    let y = tableTop + 20;
    desarquivamentos.forEach(d => {
        const row = [
            d.numDocumento || 'N/A',
            d.nomeCompleto || 'N/A',
            d.tipoDocumento || 'N/A',
            d.status || 'N/A',
            d.setorDemandante || 'N/A',
            d.dataSolicitacao ? new Date(d.dataSolicitacao).toLocaleDateString('pt-BR') : ''
        ];
        drawTableRow(y, row);
        y += itemHeight;
        if (y > doc.page.height - 50) {
            doc.addPage({ margin: 30, size: 'A4', layout: 'landscape' });
            y = 30;
            drawTableRow(y, headers);
            doc.moveTo(30, y + 15).lineTo(750, y + 15).stroke();
            y += 20;
        }
    });

    doc.end();
  } catch (err) {
    console.error("Erro ao exportar desarquivamentos para PDF:", err);
    res.status(500).json({ error: 'Erro ao exportar desarquivamentos para PDF.' });
  }
};
