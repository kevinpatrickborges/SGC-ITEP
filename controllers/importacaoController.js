const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const Vestigio = require('../models/Vestigio');

// Renderiza tela de importação
exports.formImportacao = (req, res) => {
  res.render('importacao/importacao', { preview: null, mensagem: null, erros: null });
};

// Processa upload e mostra preview
exports.previewImportacao = (req, res) => {
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
      const workbook = XLSX.readFile(req.file.path);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      preview = XLSX.utils.sheet_to_json(sheet).slice(0, 5);
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
      const workbook = XLSX.readFile(arquivoTemp);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      registros = XLSX.utils.sheet_to_json(sheet);
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
      csvParse(fileContent, { columns: true, skip_empty_lines: true }, async (err, output) => {
        if (err) return res.status(400).json({ error: 'CSV inválido.' });
        registros = output;
        await importarRegistros(tipo, registros, res);
      });
      return;
    } else if (ext === 'xlsx') {
      const workbook = XLSX.readFile(filePath);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      registros = XLSX.utils.sheet_to_json(sheet);
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
