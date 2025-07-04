const Desarquivamento = require('../../../models/Desarquivamento');
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const excel = require('exceljs');
const xlsx = require('xlsx');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const { Sequelize } = require('sequelize');

const MODULE_PATH = 'nugecid/views/desarquivamento';
const REDIRECT_URL = '/nugecid/desarquivamento';

// Função para adicionar dias úteis a uma data
function addBusinessDays(startDate, days) {
  let currentDate = new Date(startDate);
  let addedDays = 0;
  while (addedDays < days) {
    currentDate.setDate(currentDate.getDate() + 1);
    const dayOfWeek = currentDate.getDay();
    // Ignora Sábado (6) e Domingo (0)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      addedDays++;
    }
  }
  return currentDate;
}

/**
 * @desc Exibe a lista de desarquivamentos com filtros
 * @route GET /nugecid/desarquivamento
 */
exports.getList = async (req, res) => {
  try {
    const { status, dataInicio, dataFim, pesquisa, setor, sort = 'DESC' } = req.query;
    const where = {};

    // Garante que o status seja sempre um array para a consulta e para a view
    const selectedStatus = status ? (Array.isArray(status) ? status : [status]) : [];

    if (selectedStatus.length > 0) {
      where.status = { [Op.in]: selectedStatus };
    }
    
    // Filtro por setor
    if (setor) {
      where.setorDemandante = setor;
    }

    // Filtro por data (corrigido para funcionar quando inicial = final)
    if (dataInicio && dataFim && dataInicio === dataFim) {
      // Busca registros exatamente naquele dia (independente de hora)
      where.dataSolicitacao = dataInicio;
    } else {
      if (dataInicio) {
        where.dataSolicitacao = where.dataSolicitacao || {};
        where.dataSolicitacao[Op.gte] = new Date(dataInicio);
      }
      if (dataFim) {
        where.dataSolicitacao = where.dataSolicitacao || {};
        const dataFinal = new Date(dataFim);
        dataFinal.setHours(23,59,59,999);
        where.dataSolicitacao[Op.lte] = dataFinal;
      }
    }

    // Filtro de pesquisa (nome ou documento)
    if (pesquisa && pesquisa.trim() !== '') {
      where[Op.or] = [
        { nomeCompleto: { [Op.like]: `%${pesquisa}%` } },
        { numDocumento: { [Op.like]: `%${pesquisa}%` } },
        { setorDemandante: { [Op.like]: `%${pesquisa}%` } }
      ];
    }

    const desarquivamentos = await Desarquivamento.findAll({
      where,
      order: [['dataSolicitacao', sort.toUpperCase() === 'ASC' ? 'ASC' : 'DESC']],
      include: ['criadoPor', 'atualizadoPor']
    });

    const allStatus = Desarquivamento.getAttributes().status.values;

    // Busca todos os setores distintos para popular o filtro
    const allSetores = await Desarquivamento.findAll({
      attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('setorDemandante')), 'setorDemandante']],
      order: [['setorDemandante', 'ASC']],
      raw: true,
    }).then(results => results.map(item => item.setorDemandante));

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    res.render(`${MODULE_PATH}/index`, {
      title: 'NUGECID – Desarquivamentos',
      desarquivamentos,
      allStatus,
      allSetores, // Passa todos os setores para o filtro
      selectedStatus, // Passa os status selecionados para marcar os checkboxes
      selectedSetor: setor || '', // Passa o setor selecionado
      sort, // Passa a ordenação atual
      dataInicio: req.query.dataInicio || '',
      dataFim: req.query.dataFim || '',
      pesquisa: req.query.pesquisa || '',
      queryParams: req.query, // Passa o objeto query para a view
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
    if (!value || typeof value === 'string' && value.trim().toLowerCase() === 'n/a') {
        return null;
    }
    if (value instanceof Date && !isNaN(value)) {
        return value;
    }

    // Tenta converter de DD/MM/YYYY para um formato que o JS entende
    if (typeof value === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
        const parts = value.split('/');
        const date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        if (!isNaN(date.getTime())) {
            return date;
        }
    }
    
    // Tenta converter de número (data serial do Excel)
    if (!isNaN(value)) {
        const num = Number(value);
        if (num > 1 && num < 100000) {
            const date = new Date((num - 25569) * 86400 * 1000);
            const userOffset = date.getTimezoneOffset() * 60000;
            const adjustedDate = new Date(date.getTime() + userOffset);
            if (!isNaN(adjustedDate.getTime())) {
                return adjustedDate;
            }
        }
    }
    
    // Última tentativa com o construtor Date
    const date = new Date(value);
    return !isNaN(date.getTime()) ? date : null;
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
    const resultados = {
      sucesso: [],
      falha: []
    };

    const processadosNoLote = new Set();

    for (const [index, item] of dados.entries()) {
      const linha = index + 2; // +2 para corresponder à linha da planilha (cabeçalho + 1-based index)
      const numDocStr = item.numDocumento ? String(item.numDocumento) : null;

      if (!numDocStr) {
        resultados.falha.push({ linha, item, motivo: 'Número de documento ausente.' });
        continue;
      }

      if (processadosNoLote.has(numDocStr)) {
        resultados.falha.push({ linha, item, motivo: 'Número de documento duplicado no arquivo.' });
        continue;
      }
      processadosNoLote.add(numDocStr);

      try {
        console.log(`[Importação] Processando linha ${linha}, Doc: ${numDocStr}`);
        
        // Lógica de restauração manual para soft-delete
        const existing = await Desarquivamento.findOne({ where: { numDocumento: numDocStr }, paranoid: false });

        if (existing) {
          // Se existe, mas está 'apagado', restaura primeiro
          if (existing.deletedAt) {
            await existing.restore();
            console.log(`[Importação] Linha ${linha} - Registro restaurado.`);
          }
          
          // Atualiza com os novos dados
          const dadosParaUpdate = { ...item, setorDemandante: item.setorDemandante || 'Não informado', updatedBy: req.session.user.id };
          await existing.update(dadosParaUpdate);
          console.log(`[Importação] Linha ${linha} - Status: ATUALIZADO`);
          resultados.sucesso.push({ linha, item, status: 'Atualizado' });

        } else {
          // Se não existe, cria um novo
          const dadosParaCreate = { ...item, setorDemandante: item.setorDemandante || 'Não informado', createdBy: req.session.user.id, updatedBy: req.session.user.id };
          await Desarquivamento.create(dadosParaCreate);
          console.log(`[Importação] Linha ${linha} - Status: CRIADO`);
          resultados.sucesso.push({ linha, item, status: 'Criado' });
        }

      } catch (error) {
        console.error(`[Importação] Erro na linha ${linha}:`, error);
        resultados.falha.push({ linha, item, motivo: `Erro no banco de dados: ${error.message}` });
      }
    }

    res.render(`${MODULE_PATH}/import-result`, {
      title: 'Resultado da Importação',
      resultados,
      user: req.session.user,
      layout: 'layout'
    });

  } catch (error) {
    console.error('Erro ao confirmar a importação:', error);
    req.flash('error_msg', 'Ocorreu um erro crítico durante a importação.');
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

    // Se o status for "Retirado pelo setor", calcula o prazo de devolução
    if (field === 'status' && value === 'Retirado pelo setor' && !registro.dataPrazoDevolucao) {
      registro.dataPrazoDevolucao = addBusinessDays(new Date(), 5);
    }

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

/**
 * @desc Apaga todos os registros de desarquivamento após autenticação de admin
 * @route POST /nugecid/desarquivamento/apagar-todos
 */
exports.apagarTodos = async (req, res) => {
  const { usuarioAdmin, senhaAdmin } = req.body;
  const db = require('../../../models');
  const Usuario = db.Usuario;
  const bcrypt = require('bcryptjs');

  try {
    console.log('[apagarTodos] usuarioAdmin recebido:', usuarioAdmin);
    // Busca usuário admin (apenas se email for 'admin')
    if (usuarioAdmin !== 'admin') {
      console.log('[apagarTodos] Usuário digitado não é "admin".');
      req.flash('error_msg', 'Usuário administrador não encontrado ou não é admin.');
      return res.redirect('/nugecid/desarquivamento');
    }
    const usuario = await Usuario.findOne({
      where: { email: 'admin' },
      include: [{ model: db.Role, as: 'role', where: { nome: 'admin' }, required: true }]
    });
    console.log('[apagarTodos] Resultado da busca pelo admin:', usuario ? usuario.toJSON() : usuario);
    if (!usuario) {
      console.log('[apagarTodos] Usuário admin não encontrado no banco ou não tem role admin.');
      req.flash('error_msg', 'Usuário administrador não encontrado ou não é admin.');
      return res.redirect('/nugecid/desarquivamento');
    }
    // Confere senha
    const senhaOk = await bcrypt.compare(senhaAdmin, usuario.senha);
    console.log('[apagarTodos] Resultado da comparação de senha:', senhaOk);
    if (!senhaOk) {
      console.log('[apagarTodos] Senha incorreta para admin.');
      req.flash('error_msg', 'Senha incorreta.');
      return res.redirect('/nugecid/desarquivamento');
    }
    // Apaga todos os registros
    await Desarquivamento.destroy({ where: {}, truncate: true });
    console.log('[apagarTodos] Todos os registros de desarquivamento foram apagados!');
    req.flash('success_msg', 'Todos os registros foram apagados com sucesso!');
    res.redirect('/nugecid/desarquivamento');
  } catch (err) {
    console.error('Erro ao apagar todos os registros:', err);
    req.flash('error_msg', 'Erro ao apagar registros.');
    res.redirect('/nugecid/desarquivamento');
  }
};

/**
 * @desc Prorroga o prazo de devolução de um desarquivamento
 * @route POST /nugecid/desarquivamento/:id/prorrogar-prazo
 */
exports.prorrogarPrazo = async (req, res) => {
  try {
    const { id } = req.params;
    const { novaDataPrazo } = req.body;
    const desarquivamento = await Desarquivamento.findByPk(id);

    if (!desarquivamento) {
      req.flash('error_msg', 'Registro não encontrado.');
      return res.redirect(REDIRECT_URL);
    }
    
    if (desarquivamento.status !== 'Retirado pelo setor') {
      req.flash('error_msg', 'Só é possível prorrogar o prazo de itens retirados pelo setor.');
      return res.redirect(REDIRECT_URL);
    }

    desarquivamento.dataPrazoDevolucao = new Date(novaDataPrazo);
    desarquivamento.updatedBy = req.session.user.id;
    await desarquivamento.save();

    req.flash('success_msg', 'Prazo de devolução prorrogado com sucesso!');
    res.redirect(REDIRECT_URL);
  } catch (error) {
    console.error('Erro ao prorrogar prazo:', error);
    req.flash('error_msg', 'Ocorreu um erro ao prorrogar o prazo.');
    res.redirect(REDIRECT_URL);
  }
};
