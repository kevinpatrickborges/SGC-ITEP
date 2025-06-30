'use strict';

const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const { Vestigio } = require('../models');

exports.generateLabel = async (vestigioId, baseUrl) => {
  return new Promise(async (resolve, reject) => {
    try {
      const vestigio = await Vestigio.findByPk(vestigioId);
      if (!vestigio) {
        return reject(new Error('Vestígio não encontrado.'));
      }

      const doc = new PDFDocument({
        size: [226, 113], // Tamanho de uma etiqueta padrão (8x4 cm em pontos)
        margins: { top: 10, bottom: 10, left: 15, right: 15 }
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });

      // URL que será embutida no QR Code
      const qrUrl = `${baseUrl}/vestigios/${vestigio.id}`;
      const qrCodeImage = await QRCode.toDataURL(qrUrl, { errorCorrectionLevel: 'H', width: 85 });

      // --- Desenha o conteúdo da etiqueta ---

      // QR Code
      doc.image(qrCodeImage, 15, 15, { width: 85, height: 85 });

      // Textos
      doc.font('Helvetica-Bold').fontSize(10).text(`Vestígio: ${vestigio.id}`, 110, 20);
      doc.font('Helvetica').fontSize(8).text(`Tipo: ${vestigio.tipo_vestigio}`, 110, 40, { width: 100 });
      doc.font('Helvetica').fontSize(8).text(`Origem: ${vestigio.origem}`, 110, 65, { width: 100 });

      doc.end();

    } catch (error) {
      reject(error);
    }
  });
};
