const Desarquivamento = require('../../../models/Desarquivamento');
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const excel = require('exceljs');
const xlsx = require('xlsx');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

const MODULE_PATH = 'nugecid/views/desarquivamento';
const REDIRECT_URL = '/nugecid/desarquivamento';

/**
 * @desc Exibe a lista de desarquivamentos com filtros
 * @route GET /nugecid/desarquivamento
 */
exports.getList = async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};

    // Garante que o status seja sempre um array para a consulta e para a view
    const selectedStatus = status ? (Array.isArray(status) ? status : [status]) : [];

    if (selectedStatus.length > 0) {
      where.status = { [Op.in]: selectedStatus };
    }

    const desarquivamentos = await Desarquivamento.findAll({
      where,
      order: [['dataSolicitacao', 'DESC']],
      include: ['criadoPor', 'atualizadoPor']
    });

    const allStatus = Desarquivamento.getAttributes().status.values;

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    res.render(`${MODULE_PATH}/index`, {
      title: 'NUGECID – Desarquivamentos',
      desarquivamentos,
      allStatus, // Passa todos os status para renderizar os checkboxes
      selectedStatus, // Passa os status selecionados para marcar os checkboxes
      user: req.session.user,
      layout: 'layout'
    });
  } catch (error) {
    console.error('Erro ao buscar desarquivamentos:', error);
    req.flash('error_msg', 'Não foi possível carregar os registros.');
    res.redirect('/dashboard');
  }
};

/**
 * @desc Exibe o formulário para um NOVO desarquivamento
 * @route GET /nugecid/desarquivamento/novo
 */
exports.getForm = (req, res) => {
  res.render(`${MODULE_PATH}/form`, {
    title: 'Novo Desarquivamento',
    desarquivamento: {},
    errors: [],
    user: req.session.user,
    layout: 'layout'
  });
};

// Middleware de validação reutilizável
const validateForm = [
  body('tipoDesarquivamento').isIn(['Físico', 'Digital', 'Não Localizado']).withMessage('Tipo de desarquivamento inválido.'),
    body('status').isIn(Desarquivamento.getAttributes().status.values).withMessage('Status inválido.'),
  body('nomeCompleto').notEmpty().trim().withMessage('Nome completo é obrigatório.'),
  body('numDocumento').notEmpty().trim().withMessage('Nº do Documento é obrigatório.'),
  body('numProcesso').optional({ checkFalsy: true }).trim(),
  body('tipoDocumento').optional({ checkFalsy: true }).trim(),
  body('dataSolicitacao').isISO8601().toDate().withMessage('Data de solicitação inválida.'),
  body('dataDesarquivamento').optional({ checkFalsy: true }).isISO8601().toDate(),
  body('dataDevolucao').optional({ checkFalsy: true }).isISO8601().toDate(),
  body('setorDemandante').notEmpty().trim().withMessage('Setor demandante é obrigatório.'),
  body('servidorResponsavel').optional({ checkFalsy: true }).trim(),
  body('finalidade').optional({ checkFalsy: true }).trim(),
  body('prazoSolicitado').optional({ checkFalsy: true }).trim(),
];

/**
 * @desc Processa o POST do formulário de um NOVO desarquivamento
 * @route POST /nugecid/desarquivamento/novo
 */
exports.postNewForm = [
  ...validateForm,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render(`${MODULE_PATH}/form`, {
        title: 'Novo Desarquivamento',
        desarquivamento: req.body,
        errors: errors.array(),
  
        user: req.session.user,
        layout: 'layout'
      });
    }

    try {
      if (req.body.status === 'Devolvido' && !req.body.dataDevolucao) {
        req.body.dataDevolucao = new Date();
      }

      await Desarquivamento.create({
        ...req.body,
        createdBy: req.session.user.id,
        updatedBy: req.session.user.id
      });

      req.flash('success_msg', 'Registro de desarquivamento criado com sucesso!');
      res.redirect(REDIRECT_URL);
    } catch (error) {
      console.error('Erro ao criar desarquivamento:', error);
      req.flash('error_msg', 'Erro ao criar o registro. Tente novamente.');
      res.render(`${MODULE_PATH}/form`, {
        title: 'Novo Desarquivamento',
        desarquivamento: req.body,
  
        errors: [{ msg: 'Ocorreu um erro no servidor ao salvar o registro.' }],
        user: req.session.user,
        layout: 'layout'
      });
    }
  }
];

/**
 * @desc Exibe o formulário de EDIÇÃO de um desarquivamento
 * @route GET /nugecid/desarquivamento/:id/editar
 */
exports.getEditForm = async (req, res) => {
  try {
    const { id } = req.params;
    const desarquivamento = await Desarquivamento.findByPk(id);

    if (!desarquivamento) {
      req.flash('error_msg', 'Registro não encontrado.');
      return res.redirect(REDIRECT_URL);
    }

    res.render(`${MODULE_PATH}/form`, {
      title: 'Editar Desarquivamento',
      desarquivamento,

      errors: [],
      user: req.session.user,
      layout: 'layout'
    });
  } catch (error) {
    console.error('Erro ao buscar desarquivamento para edição:', error);
    req.flash('error_msg', 'Erro ao carregar o formulário de edição.');
    res.redirect(REDIRECT_URL);
  }
};

/**
 * @desc Processa o POST do formulário de EDIÇÃO
 * @route POST /nugecid/desarquivamento/:id/editar
 */
exports.postEditForm = [
  ...validateForm,
  async (req, res) => {
    const { id } = req.params;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      req.body.id = id;
      return res.render(`${MODULE_PATH}/form`, {
        title: 'Editar Desarquivamento',
        desarquivamento: { id, ...req.body },
        errors: errors.array(),
  
        user: req.session.user,
        layout: 'layout'
      });
    }

    try {
      const desarquivamento = await Desarquivamento.findByPk(id);
      if (!desarquivamento) {
        req.flash('error_msg', 'Registro não encontrado.');
        return res.redirect(REDIRECT_URL);
      }

      if (req.body.status === 'Devolvido' && !desarquivamento.dataDevolucao) {
        req.body.dataDevolucao = new Date();
      }

      await desarquivamento.update({
        ...req.body,
        updatedBy: req.session.user.id
      });

      req.flash('success_msg', 'Registro atualizado com sucesso!');
      res.redirect(REDIRECT_URL);
    } catch (error) {
      console.error('Erro ao atualizar desarquivamento:', error);
      req.flash('error_msg', 'Erro ao atualizar o registro. Tente novamente.');
      res.render(`${MODULE_PATH}/form`, {
        title: 'Editar Desarquivamento',
        desarquivamento: { id, ...req.body },
        errors: [{ msg: 'Ocorreu um erro no servidor.' }],
  
        user: req.session.user,
        layout: 'layout'
      });
    }
  }
];

/**
 * @desc Exclui (soft-delete) um desarquivamento
 * @route POST /nugecid/desarquivamento/:id/excluir
 */
// Funções de Importação e Exportação

exports.getImportForm = (req, res) => {
  res.render(`${MODULE_PATH}/import`, {
    title: 'Importar Registros',
    user: req.session.user,
    layout: 'layout'
  });
};

// Helper to convert Excel serial dates to JS Date objects
const convertToDate = (value) => {
    if (value instanceof Date) return value;
    if (value === null || value === undefined || value === '') return null;

    // Check if it's a number or a string that looks like a number (Excel serial date)
    if (!isNaN(value)) {
        const num = Number(value);
        // Heuristic for Excel serial dates (numbers between 1 and ~100000)
        if (num > 1 && num < 100000) {
            // Formula to convert Excel serial date to JS Date
            const date = new Date((num - 25569) * 86400 * 1000);
            // Adjust for timezone offset to get correct local date
            const userOffset = date.getTimezoneOffset() * 60000;
            const adjustedDate = new Date(date.getTime() + userOffset);
            if (!isNaN(adjustedDate.getTime())) {
                return adjustedDate;
            }
        }
    }
    // Fallback for standard date strings
    if (typeof value === 'string') {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
            return date;
        }
    }
    return value; // Return original value if conversion fails
};

// Helper to normalize header keys for reliable mapping
const normalizeHeaderKey = (str) => {
    if (!str) return '';
    return str
        .toString()
        .normalize('NFD') // Decompose accented characters
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritical marks
        .toLowerCase()
        .replace(/[^a-z0-9]/g, ''); // Remove all non-alphanumeric characters
};

// Maps normalized spreadsheet headers to database model fields
const normalizeDataKeys = (data) => {
    const keyMap = {
        'desarquivamentofisicodigital': 'tipoDesarquivamento',
        'status': 'status',
        'nomecompleto': 'nomeCompleto',
        'ndoniclaudoautoinformacaotecnica': 'numDocumento',
        'nprocesso': 'numProcesso',
        'tipodedocumento': 'tipoDocumento',
        'datadesolicitacao': 'dataSolicitacao',
        'datadodesarquivamentosag': 'dataDesarquivamento',
        'datadadevolucaopelosetor': 'dataDevolucao',
        'setordemandante': 'setorDemandante',
        'servidordoitepresponsavelmatricula': 'servidorResponsavel',
        'finalidadedodesarquivamento': 'finalidade',
        'solicitacaodeprorrogacaodeprazodedesarquivamento': 'prazoSolicitado'
    };
    const normalizedData = {};
    for (const key in data) {
        const normalizedKey = normalizeHeaderKey(key);
        if (keyMap[normalizedKey]) {
            normalizedData[keyMap[normalizedKey]] = data[key];
        }
    }
    // Garante que o numDocumento é uma string para evitar erros de tipo de dados
    if (normalizedData.numDocumento) {
        normalizedData.numDocumento = String(normalizedData.numDocumento);
    }
    return normalizedData;
};

exports.postImport = async (req, res) => {
  if (!req.file) {
    req.flash('error_msg', 'Nenhum arquivo enviado.');
    return res.redirect(`${REDIRECT_URL}/importar`);
  }

  try {
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    // Use raw: true to get numbers for dates, which our converter handles
    const jsonData = xlsx.utils.sheet_to_json(sheet, { raw: true });

    const data = jsonData.map(row => {
        const normalizedRow = normalizeDataKeys(row);
        // Garante que o numDocumento é sempre uma string
        if (normalizedRow.numDocumento) {
            normalizedRow.numDocumento = String(normalizedRow.numDocumento);
        }
        // Convert date fields
        normalizedRow.dataSolicitacao = convertToDate(normalizedRow.dataSolicitacao);
        normalizedRow.dataDesarquivamento = convertToDate(normalizedRow.dataDesarquivamento);
        normalizedRow.dataDevolucao = convertToDate(normalizedRow.dataDevolucao);
        return normalizedRow;
    });

    res.render(`${MODULE_PATH}/import-preview`, {
      title: 'Pré-visualização da Importação',
      dados: data,
      user: req.session.user,
      layout: 'layout'
    });
  } catch (error) {
    console.error('Erro ao processar a planilha:', error);
    req.flash('error_msg', 'Erro ao ler o arquivo. Verifique o formato.');
    res.redirect(`${REDIRECT_URL}/importar`);
  }
};

exports.postConfirmImport = async (req, res) => {
  try {
    const dados = JSON.parse(req.body.dadosImportacao);
    let criados = 0;
    let atualizados = 0;
    const processadosNoLote = new Set(); // Para evitar duplicidade no próprio lote
    const ignoradosDuplicadosNoLote = [];

    for (const item of dados) {
      if (!item.numDocumento) continue;
      const numDocStr = String(item.numDocumento);

      // Evita duplicidade dentro do próprio lote
      if (processadosNoLote.has(numDocStr)) {
        ignoradosDuplicadosNoLote.push(numDocStr);
        continue;
      }
      processadosNoLote.add(numDocStr);

      // Substitui verificação manual por upsert atômico
      try {
        const [record, created] = await Desarquivamento.upsert({
          ...item,
        }, {
          returning: true
        });

        if (created) {
          criados++;
        } else {
          atualizados++;
        }
      } catch (error) {
        console.error('Erro durante upsert:', error);
        throw error;
      }
    }

    let msg = `Importação concluída! ${criados} registros criados e ${atualizados} atualizados.`;
    if (ignoradosDuplicadosNoLote.length > 0) {
      msg += ` Os seguintes documentos foram ignorados por duplicidade no arquivo: ${ignoradosDuplicadosNoLote.join(', ')}.`;
    }
    req.flash('success_msg', msg);
    res.redirect(REDIRECT_URL);
  } catch (error) {
    console.error('Erro ao confirmar a importação:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      req.flash('error_msg', 'Já existe um registro com o mesmo número de documento. Nenhum dado foi duplicado.');
    } else {
      req.flash('error_msg', 'Ocorreu um erro ao salvar os dados importados.');
    }
    res.redirect(REDIRECT_URL);
  }
};

exports.exportXLSX = async (req, res) => {
    try {
        const registros = await Desarquivamento.findAll({ raw: true });

        if (!registros.length) {
            req.flash('error_msg', 'Não há dados para exportar.');
            return res.redirect('/nugecid/desarquivamento');
        }

        const workbook = new excel.Workbook();
        const worksheet = workbook.addWorksheet('Desarquivamentos');

        // Definir cabeçalhos personalizados, ordem e largura das colunas
        worksheet.columns = [
            { header: 'Nº', key: 'num', width: 5 },
            { header: 'DESARQUIVAMENTO FÍSICO/DIGITAL', key: 'tipoDesarquivamento', width: 25 },
            { header: 'STATUS', key: 'status', width: 15 },
            { header: 'NOME COMPLETO', key: 'nomeCompleto', width: 35 },
            { header: 'Nº DO NIC/LAUDO/AUTO/INFORMAÇÃO TÉCNICA', key: 'numDocumento', width: 40 },
            { header: 'Nº PROCESSO', key: 'numProcesso', width: 25 },
            { header: 'TIPO DE DOCUMENTO', key: 'tipoDocumento', width: 25 },
            { header: 'DATA DE SOLICITAÇÃO', key: 'dataSolicitacao', width: 20, style: { numFmt: 'dd/mm/yyyy' } },
            { header: 'DATA DO DESARQUIVAMENTO - NTO - SAB', key: 'dataDesarquivamento', width: 35, style: { numFmt: 'dd/mm/yyyy' } },
            { header: 'DATA DA DEVOLUÇÃO PELO SETOR', key: 'dataDevolucao', width: 30, style: { numFmt: 'dd/mm/yyyy' } },
            { header: 'SETOR DEMANDANTE', key: 'setorDemandante', width: 20 },
            { header: 'SERVIDOR DO ITEP RESPONSÁVEL (MATRÍCULA)', key: 'servidorResponsavel', width: 35 },
            { header: 'FINALIDADE DO DESARQUIVAMENTO', key: 'finalidade', width: 40 },
            { header: 'SOLICITAÇÃO DE PRORROGAÇÃO DE PRAZO DE DESARQUIVAMENTO', key: 'prazoSolicitado', width: 50 }
        ];

        // Mapear e adicionar dados, incluindo o número sequencial
        const data = registros.map((reg, index) => ({
            num: index + 1,
            ...reg
        }));
        worksheet.addRows(data);
        
        // Estilizar o cabeçalho para ficar igual ao modelo
        worksheet.getRow(1).eachCell((cell) => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF4472C4' } // Azul padrão do Excel
            };
            cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });

        // Ajustar altura da linha do cabeçalho para melhor visualização
        worksheet.getRow(1).height = 45;

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=Controle_de_Desarquivamento.xlsx');

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('Erro ao exportar para XLSX:', error);
        req.flash('error_msg', 'Ocorreu um erro ao exportar os dados para XLSX.');
        res.redirect('/nugecid/desarquivamento');
    }
};

exports.exportPDF = async (req, res) => {
    try {
        const registros = await Desarquivamento.findAll({ raw: true });

        if (!registros.length) {
            req.flash('error_msg', 'Não há dados para exportar.');
            return res.redirect('/nugecid/desarquivamento');
        }

        const doc = new PDFDocument({ layout: 'landscape', margin: 40 });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=relatorio_desarquivamentos.pdf');

        doc.pipe(res);

        // Cabeçalho do Documento
        doc.fontSize(16).text('Relatório de Desarquivamentos', { align: 'center' });
        doc.moveDown();

        // Cabeçalho da Tabela
        const tableTop = doc.y;
        const itemWidth = (doc.page.width - doc.page.margins.left - doc.page.margins.right) / 5;
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Nome Completo', doc.x, doc.y, { width: itemWidth, align: 'left' });
        doc.text('Nº Documento', doc.x + itemWidth, doc.y, { width: itemWidth, align: 'left' });
        doc.text('Setor Demandante', doc.x + itemWidth * 2, doc.y, { width: itemWidth, align: 'left' });
        doc.text('Data Solicitação', doc.x + itemWidth * 3, doc.y, { width: itemWidth, align: 'left' });
        doc.text('Status', doc.x + itemWidth * 4, doc.y, { width: itemWidth, align: 'left' });
        doc.moveDown();
        doc.font('Helvetica');

        // Linhas da Tabela
        registros.forEach(item => {
            const y = doc.y;
            doc.fontSize(9);
            doc.text(item.nomeCompleto || '', doc.page.margins.left, y, { width: itemWidth });
            doc.text(item.numDocumento || '', doc.page.margins.left + itemWidth, y, { width: itemWidth });
            doc.text(item.setorDemandante || '', doc.page.margins.left + itemWidth * 2, y, { width: itemWidth });
            doc.text(item.dataSolicitacao ? new Date(item.dataSolicitacao).toLocaleDateString('pt-BR') : '', doc.page.margins.left + itemWidth * 3, y, { width: itemWidth });
            doc.text(item.status || '', doc.page.margins.left + itemWidth * 4, y, { width: itemWidth });
            doc.moveDown();
            // Adiciona nova página se necessário
            if (doc.y > doc.page.height - doc.page.margins.bottom) {
                doc.addPage();
            }
        });

        doc.end();

    } catch (error) {
        console.error('Erro ao exportar para PDF:', error);
        req.flash('error_msg', 'Ocorreu um erro ao gerar o arquivo PDF.');
        res.redirect(REDIRECT_URL);
    }
};

/**
 * @desc Atualiza um campo específico de um registro (para edição inline)
 * @route PATCH /nugecid/desarquivamento/:id/atualizar-campo
 */
exports.patchUpdateField = async (req, res) => {
  try {
    const { id } = req.params;
    const { field, value } = req.body;

    // Validação básica
    const allowedFields = ['status']; // Por enquanto, só permite alterar o status
    if (!allowedFields.includes(field)) {
      return res.status(400).json({ success: false, message: 'Campo não permitido para edição.' });
    }

    const registro = await Desarquivamento.findByPk(id);
    if (!registro) {
      return res.status(404).json({ success: false, message: 'Registro não encontrado.' });
    }

    registro[field] = value;
    registro.updatedBy = req.session.user.id;
    await registro.save();

    res.json({ success: true, message: 'Status atualizado com sucesso.' });

  } catch (error) {
    console.error('Erro ao atualizar campo:', error);
    res.status(500).json({ success: false, message: 'Erro interno ao atualizar o registro.' });
  }
};

exports.deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    const desarquivamento = await Desarquivamento.findByPk(id);

    if (!desarquivamento) {
      req.flash('error_msg', 'Registro não encontrado.');
      return res.redirect(REDIRECT_URL);
    }

    await desarquivamento.destroy();
    req.flash('success_msg', 'Registro excluído com sucesso.');
    res.redirect(REDIRECT_URL);
  } catch (error) {
    console.error('Erro ao excluir desarquivamento:', error);
    req.flash('error_msg', 'Erro ao excluir o registro. Tente novamente.');
    res.redirect(REDIRECT_URL);
  }
};

// Exclui todos os registros (requer autenticação de admin)
exports.deleteAllRecords = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Verifica credenciais de administrador
    if (username !== process.env.ADMIN_USER || password !== process.env.ADMIN_PASS) {
      return res.status(401).send('Credenciais de administrador inválidas');
    }

    // Executa a exclusão em massa
    const deletedCount = await Desarquivamento.destroy({ where: {}, truncate: true });
    
    res.send(`Todos os ${deletedCount} registros foram excluídos com sucesso.`);
  } catch (error) {
    console.error('Erro ao excluir registros:', error);
    res.status(500).send('Erro interno do servidor');
  }
};
