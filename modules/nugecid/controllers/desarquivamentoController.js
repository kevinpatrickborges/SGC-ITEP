const Desarquivamento = require('../../../models/Desarquivamento');
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const { Sequelize } = require('sequelize');
const { lerXLSX, escreverXLSX } = require('../../../services/planilhaService');

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
    // Move the check for numDocumento to before the main validation
    const { numDocumento } = req.body;

    try {
      if (numDocumento) {
        const normalizedDoc = numDocumento.trim();
        // Verifica inclusive registros soft-deletados
        const existingDoc = await Desarquivamento.findOne({
          where: { numDocumento: { [Op.eq]: normalizedDoc } },
          paranoid: false
        });
        if (existingDoc) {
          if (existingDoc.deletedAt === null) {
            const customError = {
              type: 'field',
              value: numDocumento,
              msg: `O número de documento '${numDocumento}' já está em uso.`,
              path: 'numDocumento',
              location: 'body'
            };
            // Manually add the error to the validation result
            errors.errors.push(customError);
          } else {
            // Existe registro com mesmo numDocumento, porém soft-deletado.
            // Apaga permanentemente esse registro para permitir criação de um novo.
            await existingDoc.destroy({ force: true });
            // Prossegue para criação de um NOVO registro logo abaixo.
          }
        }
      }

      if (!errors.isEmpty()) {
        return res.status(400).render(`${MODULE_PATH}/form`, {
          title: 'Novo Desarquivamento',
          desarquivamento: req.body,
          errors: errors.array(),
          user: req.session.user,
          layout: 'layout'
        });
      }

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
       // This catch block will now handle unexpected errors, 
       // as the validation handles the unique constraint.
      if (error.name === 'SequelizeUniqueConstraintError') {
        const field = error.errors[0].path;
        const value = error.errors[0].value;
        req.flash('error_msg', `O valor '${value}' para o campo ${field} já existe. Por favor, verifique os dados.`);
      } else {
        req.flash('error_msg', 'Ocorreu um erro inesperado ao criar o registro. Tente novamente.');
      }
      console.error('Erro detalhado ao criar desarquivamento:', error);
      
      res.status(500).render(`${MODULE_PATH}/form`, {
        title: 'Novo Desarquivamento',
        desarquivamento: req.body,
        errors: [{ msg: 'Erro interno do servidor. Contacte o administrador.' }],
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

// Função utilitária para sanitizar valores vindos do Excel (evita objetos/arrays)
const sanitizeValue = (val) => {
  if (val === null || val === undefined) return null;
  if (Array.isArray(val)) return val.map(v => sanitizeValue(v)).join(', ');
  if (typeof val === 'object') {
    // ExcelJS pode entregar objetos com propriedades w (formatted), v (raw), text, result, richText
    if (val.text) return String(val.text);
    if (val.w) return String(val.w);
    if (val.v !== undefined) return String(val.v);
    if (val.result) return String(val.result);
    if (val.richText) return val.richText.map(rt => rt.text).join('');
    try { return JSON.stringify(val); } catch { return String(val); }
  }
  return String(val);
};

const sanitizeRow = (row) => {
  const obj = {};
  for (const key in row) {
    obj[key] = sanitizeValue(row[key]);
  }
  return obj;
};

exports.postImport = async (req, res) => {
  if (!req.file) {
    req.flash('error_msg', 'Nenhum arquivo enviado.');
    return res.redirect(`${REDIRECT_URL}/importar`);
  }

  try {
    const jsonData = await lerXLSX(req.file.buffer);

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
    const dadosSanitizados = dados.map(sanitizeRow);
    const resultados = {
      sucesso: [],
      falha: []
    };

    const processadosNoLote = new Set();

    for (const [index, itemOriginal] of dadosSanitizados.entries()) {
      const item = itemOriginal;
      const linha = index + 2;
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

        const columns = [
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

        const data = registros.map((reg, index) => ({
            num: index + 1,
            ...reg,
            dataSolicitacao: reg.dataSolicitacao ? new Date(reg.dataSolicitacao) : null,
            dataDesarquivamento: reg.dataDesarquivamento ? new Date(reg.dataDesarquivamento) : null,
            dataDevolucao: reg.dataDevolucao ? new Date(reg.dataDevolucao) : null,
        }));

        const buffer = await escreverXLSX(data, columns);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=Controle_de_Desarquivamento.xlsx');
        res.send(buffer);

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

        const doc = new PDFDocument({ margin: 40 });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=relatorio_desarquivamentos.pdf');

        doc.pipe(res);

        // Cabeçalho do Documento
        doc.fontSize(16).text('Relatório de Desarquivamentos', { align: 'center' });
        doc.moveDown();

        // Linhas dos Registros
        registros.forEach(item => {
            doc.fontSize(10).font('Helvetica-Bold').text(`Nº Documento:`, { continued: true });
            doc.font('Helvetica').text(` ${item.numDocumento || 'N/A'}`);

            doc.fontSize(10).font('Helvetica-Bold').text(`Nome Completo:`, { continued: true });
            doc.font('Helvetica').text(` ${item.nomeCompleto || 'N/A'}`);

            doc.fontSize(10).font('Helvetica-Bold').text(`Status:`, { continued: true });
            doc.font('Helvetica').text(` ${item.status || 'N/A'}`);

            doc.fontSize(10).font('Helvetica-Bold').text(`Setor Demandante:`, { continued: true });
            doc.font('Helvetica').text(` ${item.setorDemandante || 'N/A'}`);

            doc.fontSize(10).font('Helvetica-Bold').text(`Data Solicitação:`, { continued: true });
            doc.font('Helvetica').text(` ${item.dataSolicitacao ? new Date(item.dataSolicitacao).toLocaleDateString('pt-BR') : 'N/A'}`);

            doc.moveDown(); // Espaço entre os registros

            // Adiciona nova página se necessário
            if (doc.y > doc.page.height - doc.page.margins.bottom - 50) { // -50 para margem de segurança
                doc.addPage();
                doc.fontSize(16).text('Relatório de Desarquivamentos (continuação)', { align: 'center' });
                doc.moveDown();
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

/**
 * @desc Gera um recibo em PDF para um desarquivamento
 * @route GET /nugecid/desarquivamento/:id/recibo
 */
exports.gerarRecibo = async (req, res) => {
  try {
    const { id } = req.params;
    const desarquivamento = await Desarquivamento.findByPk(id);

    if (!desarquivamento) {
      req.flash('error_msg', 'Registro não encontrado.');
      return res.redirect(REDIRECT_URL);
    }

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=recibo_${desarquivamento.numDocumento}.pdf`);

    doc.pipe(res);

    // Cabeçalho
    doc.fontSize(18).text('Recibo de Retirada de Documento', { align: 'center' });
    doc.moveDown(2);

    // Corpo do Recibo
    doc.fontSize(12);
    doc.text(`Pelo presente, declaramos que o documento abaixo especificado foi retirado do arquivo em ${new Date(desarquivamento.dataDesarquivamento).toLocaleDateString('pt-BR')}.`);
    doc.moveDown();

    // Detalhes do Documento
    doc.font('Helvetica-Bold').text('Nome do Documento:', { continued: true });
    doc.font('Helvetica').text(` ${desarquivamento.nomeCompleto}`);
    doc.font('Helvetica-Bold').text('Número do Documento:', { continued: true });
    doc.font('Helvetica').text(` ${desarquivamento.numDocumento}`);
    doc.font('Helvetica-Bold').text('Setor Demandante:', { continued: true });
    doc.font('Helvetica').text(` ${desarquivamento.setorDemandante}`);
    doc.font('Helvetica-Bold').text('Servidor Responsável:', { continued: true });
    doc.font('Helvetica').text(` ${desarquivamento.servidorResponsavel}`);
    doc.moveDown(3);

    // Assinaturas
    doc.text('________________________________________');
    doc.text(`${desarquivamento.servidorResponsavel}`);
    doc.text('(Assinatura do Servidor Responsável)');
    doc.moveDown(2);

    doc.text('________________________________________');
    doc.text('Responsável pelo Arquivo');

    doc.end();

  } catch (error) {
    console.error('Erro ao gerar recibo:', error);
    req.flash('error_msg', 'Ocorreu um erro ao gerar o recibo.');
    res.redirect(REDIRECT_URL);
  }
};

/**
 * @desc Exibe a lista de desarquivamentos na lixeira (soft-deletados)
 * @route GET /nugecid/desarquivamento/lixeira
 */
exports.getTrashList = async (req, res) => {
  try {
    const lixeira = await Desarquivamento.findAll({
      where: { deletedAt: { [Op.ne]: null } },
      paranoid: false, // Inclui registros soft-deletados
      order: [['deletedAt', 'DESC']]
    });

    res.render(`${MODULE_PATH}/lixeira`, {
      title: 'Lixeira de Desarquivamentos',
      lixeira,
      user: req.session.user,
      layout: 'layout'
    });
  } catch (error) {
    console.error('Erro ao buscar itens da lixeira:', error);
    req.flash('error_msg', 'Não foi possível carregar a lixeira.');
    res.redirect(REDIRECT_URL);
  }
};

/**
 * @desc Exclui permanentemente um desarquivamento da lixeira
 * @route POST /nugecid/desarquivamento/:id/excluir-permanente
 */
exports.deletePermanent = async (req, res) => {
  const { id } = req.params;
  const { usuarioAdmin, senhaAdmin } = req.body;
  const db = require('../../../models');
  const Usuario = db.Usuario;
  const bcrypt = require('bcryptjs');

  try {
    // Autenticação do administrador
    const usuario = await Usuario.findOne({
      where: { email: 'admin' }, // Assume que o admin tem email 'admin'
      include: [{ model: db.Role, as: 'role', where: { nome: 'admin' }, required: true }]
    });

    if (!usuario) {
      req.flash('error_msg', 'Usuário administrador não encontrado ou não tem role admin.');
      return res.redirect(`${REDIRECT_URL}/lixeira`);
    }

    const senhaOk = await bcrypt.compare(senhaAdmin, usuario.senha);
    if (!senhaOk) {
      req.flash('error_msg', 'Senha incorreta.');
      return res.redirect(`${REDIRECT_URL}/lixeira`);
    }

    const desarquivamento = await Desarquivamento.findByPk(id, { paranoid: false }); // Busca mesmo se soft-deletado

    if (!desarquivamento) {
      req.flash('error_msg', 'Registro não encontrado na lixeira.');
      return res.redirect(`${REDIRECT_URL}/lixeira`);
    }

    await desarquivamento.destroy({ force: true }); // Exclusão permanente
    req.flash('success_msg', 'Registro excluído permanentemente com sucesso!');
    res.redirect(`${REDIRECT_URL}/lixeira`);
  } catch (error) {
    console.error('Erro ao excluir permanentemente o registro:', error);
    req.flash('error_msg', 'Erro ao excluir permanentemente o registro. Tente novamente.');
    res.redirect(`${REDIRECT_URL}/lixeira`);
  }
};

/**
 * @desc Esvazia a lixeira (exclui permanentemente todos os registros soft-deletados)
 * @route POST /nugecid/desarquivamento/esvaziar-lixeira
 */
exports.emptyTrash = async (req, res) => {
  const { usuarioAdmin, senhaAdmin } = req.body;
  const db = require('../../../models');
  const Usuario = db.Usuario;
  const bcrypt = require('bcryptjs');

  try {
    // Autenticação do administrador
    const usuario = await Usuario.findOne({
      where: { email: 'admin' },
      include: [{ model: db.Role, as: 'role', where: { nome: 'admin' }, required: true }]
    });

    if (!usuario) {
      req.flash('error_msg', 'Usuário administrador não encontrado ou não tem role admin.');
      return res.redirect(`${REDIRECT_URL}/lixeira`);
    }

    const senhaOk = await bcrypt.compare(senhaAdmin, usuario.senha);
    if (!senhaOk) {
      req.flash('error_msg', 'Senha incorreta.');
      return res.redirect(`${REDIRECT_URL}/lixeira`);
    }

    // Exclui permanentemente todos os registros soft-deletados
    await Desarquivamento.destroy({ where: { deletedAt: { [Op.ne]: null } }, force: true });
    req.flash('success_msg', 'Lixeira esvaziada com sucesso!');
    res.redirect(`${REDIRECT_URL}/lixeira`);
  } catch (err) {
    console.error('Erro ao esvaziar a lixeira:', err);
    req.flash('error_msg', 'Erro ao esvaziar a lixeira.');
    res.redirect(`${REDIRECT_URL}/lixeira`);
  }
};

/**
 * @desc Restaura um item da lixeira
 * @route POST /nugecid/desarquivamento/:id/restaurar
 */
exports.restoreItem = async (req, res) => {
  try {
    const { id } = req.params;
    const desarquivamento = await Desarquivamento.findByPk(id, { paranoid: false }); // Busca mesmo se soft-deletado

    if (!desarquivamento) {
      req.flash('error_msg', 'Registro não encontrado na lixeira.');
      return res.redirect(`${REDIRECT_URL}/lixeira`);
    }

    await desarquivamento.restore(); // Restaura o registro
    req.flash('success_msg', 'Registro restaurado com sucesso!');
    res.redirect(`${REDIRECT_URL}/lixeira`);
  } catch (error) {
    console.error('Erro ao restaurar o registro:', error);
    req.flash('error_msg', 'Erro ao restaurar o registro. Tente novamente.');
    res.redirect(`${REDIRECT_URL}/lixeira`);
  }
};
