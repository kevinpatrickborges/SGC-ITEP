const fs = require('fs');
const path = require('path');
const Vestigio = require('../models/Vestigio');
const Usuario = require('../models/Usuario'); // Adicionado para apiImportarPlanilha
const { lerXLSX } = require('../services/planilhaService');

// Renderiza tela de importação
exports.formImportacao = (req, res) => {
  res.render('importacao/importacao', { preview: null, mensagem: null, erros: null });
};

// Processa upload e mostra preview
exports.previewImportacao = async (req, res) => {
  if (!req.file) {
    return res.render('importacao/importacao', { preview: null, mensagem: null, erros: ['Arquivo não enviado.'] });
  }
  const ext = path.extname(req.file.originalname).toLowerCase();
  let preview = [];
  try {
    if (ext === '.csv') {
      const fileContent = fs.readFileSync(req.file.path, 'utf8');
      const lines = fileContent.split('\n');
      const headers = lines[0].split(',');
      preview = lines.slice(1, 6).filter(Boolean).map(line => {
        const values = line.split(',');
        let obj = {};
        headers.forEach((h, i) => obj[h.trim()] = values[i] ? values[i].trim() : '');
        return obj;
      });
    } else if (ext === '.xlsx') {
      const jsonData = await lerXLSX(req.file.buffer);
      preview = jsonData.slice(0, 5);
    } else {
      throw new Error('Formato de arquivo não suportado.');
    }
    // Salva arquivo temporário para confirmar depois
    req.session.arquivoTemp = req.file.path;
    res.render('importacao/importacao', { preview, arquivoTemp: req.file.filename, mensagem: null, erros: null });
  } catch (err) {
    res.render('importacao/importacao', { preview: null, mensagem: null, erros: [err.message] });
  }
};

// Confirma importação
exports.confirmarImportacao = async (req, res) => {
  const arquivoTemp = req.session.arquivoTemp;
  if (!arquivoTemp) {
    return res.render('importacao/importacao', { preview: null, mensagem: null, erros: ['Arquivo temporário não encontrado.'] });
  }
  try {
    const ext = path.extname(arquivoTemp).toLowerCase();
    let registros = [];
    if (ext === '.csv') {
      const fileContent = fs.readFileSync(arquivoTemp, 'utf8');
      const lines = fileContent.split('\n');
      const headers = lines[0].split(',');
      registros = lines.slice(1).filter(Boolean).map(line => {
        const values = line.split(',');
        let obj = {};
        headers.forEach((h, i) => obj[h.trim()] = values[i] ? values[i].trim() : '');
        return obj;
      });
    } else if (ext === '.xlsx') {
      const fileBuffer = fs.readFileSync(arquivoTemp);
      registros = await lerXLSX(fileBuffer);
    }
    await Vestigio.bulkCreate(registros);
    fs.unlinkSync(arquivoTemp);
    req.session.arquivoTemp = null;
    res.render('importacao/importacao', { preview: null, mensagem: 'Importação realizada com sucesso!', erros: null });
  } catch (err) {
    res.render('importacao/importacao', { preview: null, mensagem: null, erros: [err.message] });
  }
};

// API REST para integração externa (opcional)
exports.apiImportarPlanilha = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Arquivo não enviado.' });
  }
  const { tipo } = req.body;
  const filePath = req.file.path;
  const ext = filePath.split('.').pop().toLowerCase();
  try {
    let registros = [];
    if (ext === 'csv') {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      // csvParse is not defined in this scope, assuming it's imported elsewhere or needs to be added
      // For now, I'll keep the original csv parsing logic as is, as the focus is on XLSX refactoring.
      // If csvParse is a global or imported from another file, it will work.
      // If not, this part will need further attention.
      const lines = fileContent.split('\n');
      const headers = lines[0].split(',');
      registros = lines.slice(1).filter(Boolean).map(line => {
        const values = line.split(',');
        let obj = {};
        headers.forEach((h, i) => obj[h.trim()] = values[i] ? values[i].trim() : '');
        return obj;
      });
      await importarRegistros(tipo, registros, res);
      return;
    } else if (ext === 'xlsx') {
      registros = await lerXLSX(req.file.buffer);
      await importarRegistros(tipo, registros, res);
      return;
    } else {
      return res.status(400).json({ error: 'Formato de arquivo não suportado.' });
    }
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao importar planilha.' });
  } finally {
    fs.unlinkSync(filePath);
  }
};

async function importarRegistros(tipo, registros, res) {
  try {
    if (tipo === 'vestigios') {
      await Vestigio.bulkCreate(registros);
      return res.json({ success: true, count: registros.length });
    }
    if (tipo === 'usuarios') {
      await Usuario.bulkCreate(registros);
      return res.json({ success: true, count: registros.length });
    }
    return res.status(400).json({ error: 'Tipo de importação inválido.' });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao importar registros.' });
  }
}
