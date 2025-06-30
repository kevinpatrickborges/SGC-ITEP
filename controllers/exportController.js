const Vestigio = require('../models/Vestigio');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

// Exportar para Excel
exports.exportVestigiosExcel = async (req, res) => {
  console.log('Iniciando exportação para Excel');
  console.log('Usuário autenticado:', req.userId);
  
  try {
    const vestigios = await Vestigio.findAll();
    console.log('Vestígios encontrados:', vestigios.length);
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Vestígios');
    worksheet.columns = [
      { header: 'Código', key: 'codigo', width: 20 },
      { header: 'Tipo', key: 'tipo', width: 20 },
      { header: 'Número Laudo', key: 'numeroLaudo', width: 20 },
      { header: 'Descrição', key: 'descricao', width: 40 },
      { header: 'Status', key: 'status', width: 16 },
      { header: 'Criado em', key: 'createdAt', width: 22 }
    ];
    vestigios.forEach(v => {
      worksheet.addRow({
        codigo: v.codigo,
        tipo: v.tipo,
        numeroLaudo: v.numeroLaudo,
        descricao: v.descricao,
        status: v.status,
        createdAt: v.createdAt ? v.createdAt.toLocaleString('pt-BR') : ''
      });
    });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=vestigios.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ error: 'Erro ao exportar vestígios para Excel.' });
  }
};

// Exportar para PDF
exports.exportVestigiosPDF = async (req, res) => {
  try {
    const vestigios = await Vestigio.findAll();
    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=vestigios.pdf');
    doc.pipe(res);
    doc.fontSize(18).text('Relatório de Vestígios', { align: 'center' });
    doc.moveDown();
    vestigios.forEach(v => {
      doc.fontSize(12).text(
        `Código: ${v.codigo} | Tipo: ${v.tipo} | Nº Laudo: ${v.numeroLaudo}\nDescrição: ${v.descricao}\nStatus: ${v.status} | Criado em: ${v.createdAt ? v.createdAt.toLocaleString('pt-BR') : ''}`
      );
      doc.moveDown();
    });
    doc.end();
  } catch (err) {
    res.status(500).json({ error: 'Erro ao exportar vestígios para PDF.' });
  }
};
