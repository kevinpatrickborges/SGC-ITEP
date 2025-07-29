// Controlador de relatórios
// TODO: Implementar geração e exportação de relatórios
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const Usuario = require('../models/Usuario');

module.exports = {
  apiGerarRelatorio: async (req, res) => {
    const { tipo, formato } = req.body;
    try {
      let registros = [];
      if (tipo === 'usuarios') {
        registros = await Usuario.findAll({ attributes: { exclude: ['senha'] } });
      } else {
        return res.status(400).json({ error: 'Tipo de relatório inválido.' });
      }

      if (formato === 'pdf') {
        const doc = new PDFDocument();
        const filePath = path.join('downloads', `relatorio-${tipo}-${Date.now()}.pdf`);
        doc.pipe(fs.createWriteStream(filePath));
        doc.fontSize(18).text(`Relatório de ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`);
        doc.moveDown();
        registros.forEach((item, idx) => {
          doc.fontSize(12).text(JSON.stringify(item.toJSON()));
          doc.moveDown();
        });
        doc.end();
        doc.on('finish', () => {
          res.json({ success: true, url: `/${filePath}` });
        });
        return;
      } else if (formato === 'excel') {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Relatório');
        if (registros.length > 0) {
          sheet.columns = Object.keys(registros[0].toJSON()).map(key => ({ header: key, key }));
          registros.forEach(item => {
            sheet.addRow(item.toJSON());
          });
        }
        const filePath = path.join('downloads', `relatorio-${tipo}-${Date.now()}.xlsx`);
        await workbook.xlsx.writeFile(filePath);
        res.json({ success: true, url: `/${filePath}` });
        return;
      } else {
        return res.status(400).json({ error: 'Formato de relatório inválido.' });
      }
    } catch (err) {
      res.status(500).json({ error: 'Erro ao gerar relatório.' });
    }
  }
};
