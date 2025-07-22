const { Op } = require('sequelize');
const Desarquivamento = require('../models/Desarquivamento');
const Usuario = require('../models/Usuario'); // Importar o modelo Usuario
const bcrypt = require('bcryptjs'); // Importar bcrypt
const { body, validationResult } = require('express-validator');
const xlsx = require('xlsx');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');
const HTMLtoDOCX = require('html-to-docx');
const Auditoria = require('../models/Auditoria');

/**
 * @desc Exibe a lista de desarquivamentos com filtros
 * @route GET /desarquivamentos
 */
exports.getList = async (req, res) => {
  try {
    const { nome, numDocumento, numProcesso, tipoDocumento, status, dataInicio, dataFim } = req.query;
    const whereClause = {};

    if (nome) whereClause.nomeCompleto = { [Op.like]: `%${nome}%` };
    if (numDocumento) whereClause.numDocumento = { [Op.like]: `%${numDocumento}%` };
    if (numProcesso) whereClause.numProcesso = { [Op.like]: `%${numProcesso}%` };
    if (tipoDocumento) whereClause.tipoDocumento = { [Op.like]: `%${tipoDocumento}%` };
    if (status) whereClause.status = status;

    if (dataInicio && dataFim) {
      whereClause.dataSolicitacao = { [Op.between]: [new Date(dataInicio), new Date(dataFim)] };
    } else if (dataInicio) {
      whereClause.dataSolicitacao = { [Op.gte]: new Date(dataInicio) };
    } else if (dataFim) {
      whereClause.dataSolicitacao = { [Op.lte]: new Date(dataFim) };
    }

    const desarquivamentos = await Desarquivamento.findAll({
      where: whereClause,
      order: [['dataSolicitacao', 'DESC']],
      include: ['criadoPor', 'atualizadoPor']
    });

    res.render('nugecid/list', {
      title: 'NUGECID – Desarquivamentos',
      desarquivamentos,
      filtros: req.query,
      csrfToken: req.csrfToken(),
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
 * @route GET /desarquivamentos/novo
 */
exports.getForm = (req, res) => {
  res.render('nugecid/form', {
    title: 'Novo Desarquivamento',
    desarquivamento: {},
    csrfToken: req.csrfToken(),
    errors: [],
    user: req.session.user,
    layout: 'layout'
  });
};

/**
 * @desc Processa o POST do formulário de um NOVO desarquivamento
 * @route POST /desarquivamentos/novo
 */
// Middleware de validação reutilizável
const validateForm = [
  body('tipoDesarquivamento').optional().isIn(['Físico', 'Digital', 'Não Localizado']).withMessage('Tipo de desarquivamento inválido.'),
  body('status').isIn(['Finalizado', 'Desarquivado', 'Não coletado', 'Solicitado', 'Rearquivamento solicitado', 'Retirado pelo setor', 'Não localizado']).withMessage('Status inválido.'),
  body('nomeCompleto').notEmpty().trim().withMessage('Nome completo é obrigatório.'),
  body('numDocumento').notEmpty().trim().withMessage('Nº do Documento é obrigatório.'),
  body('numProcesso').optional({ checkFalsy: true }).trim(),
  body('tipoDocumento').optional({ checkFalsy: true }).trim(),
  body('dataSolicitacao').isISO8601().withMessage('Data de solicitação inválida.'),
  body('dataDesarquivamento').optional({ checkFalsy: true }).isISO8601(),
  body('dataDevolucao').optional({ checkFalsy: true }).isISO8601(),
  body('setorDemandante').optional({ checkFalsy: true }).trim(),
  body('servidorResponsavel').optional({ checkFalsy: true }).trim(),
  body('finalidade').optional({ checkFalsy: true }).trim(),
  body('prazoSolicitado').optional({ checkFalsy: true }).trim(),
];

exports.postNewForm = [
  ...validateForm,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render('nugecid/form', {
        title: 'Novo Desarquivamento',
        desarquivamento: req.body,
        errors: errors.array(),
        csrfToken: req.csrfToken(),
        user: req.session.user,
        layout: 'layout'
      });
    }

    try {
      // Regra de negócio para data de devolução ao criar
      if (req.body.status === 'Devolvido' && !req.body.dataDevolucao) {
        req.body.dataDevolucao = new Date();
      }

      const fixDate = (input) => {
        if (!input) return input;
        if (input instanceof Date) {
          const copy = new Date(input.getTime());
          copy.setHours(12, 0, 0, 0);
          return copy;
        }
        // Esperamos string YYYY-MM-DD
        const [y, m, d] = input.split('-').map(Number);
        return new Date(y, m - 1, d, 12, 0, 0);
      };

      const newDes = await Desarquivamento.create({
        ...req.body,
        solicitacao: req.body.tipoDesarquivamento, // Mapeia tipoDesarquivamento para solicitacao
        dataSolicitacao: fixDate(req.body.dataSolicitacao),
        dataDesarquivamento: fixDate(req.body.dataDesarquivamento),
        dataDevolucao: fixDate(req.body.dataDevolucao),
        dataPrazoDevolucao: fixDate(req.body.dataPrazoDevolucao),
        createdBy: req.session.user.id,
        updatedBy: req.session.user.id
      });

      await Auditoria.create({
        usuarioId: req.session.user.id,
        acao: 'create',
        entidade: 'Desarquivamento',
        entidadeId: newDes.id,
        detalhes: newDes.toJSON()
      });

      req.flash('success_msg', 'Registro de desarquivamento criado com sucesso!');
      res.redirect('/nugecid');
    } catch (error) {
      console.error('Erro ao criar desarquivamento:', error);
      req.flash('error_msg', 'Erro ao criar o registro. Tente novamente.');
      // Renderiza o formulário novamente em caso de erro no DB
      res.render('nugecid/form', {
        title: 'Novo Desarquivamento',
        desarquivamento: req.body, // Passa o corpo da requisição de volta
        csrfToken: req.csrfToken(),
        errors: [{ msg: 'Ocorreu um erro no servidor ao salvar o registro.' }],
        user: req.session.user,
        layout: 'layout'
      });
    }
  }
];


/**
 * @desc Exibe o formulário de EDIÇÃO de um desarquivamento
 * @route GET /desarquivamentos/:id/editar
 */
exports.postEditForm = [
  ...validateForm,
  async (req, res) => {
    const { id } = req.params;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.render('nugecid/form', {
        title: 'Editar Desarquivamento',
        desarquivamento: { id, ...req.body },
        errors: errors.array(),
        csrfToken: req.csrfToken(),
        user: req.session.user,
        layout: 'layout'
      });
    }

    try {
      const desarquivamento = await Desarquivamento.findByPk(id);
    if (!desarquivamento) {
      req.flash('error_msg', 'Registro não encontrado.');
      return res.redirect('/nugecid');
    }

      const fixDate = (input) => {
        if (!input) return input;
        if (input instanceof Date) {
          const copy = new Date(input.getTime());
          copy.setHours(12, 0, 0, 0);
          return copy;
        }
        // Esperamos string YYYY-MM-DD
        const [y, m, d] = input.split('-').map(Number);
        return new Date(y, m - 1, d, 12, 0, 0);
      };

      // Atualiza o registro
      Object.assign(desarquivamento, {
        ...req.body,
        solicitacao: req.body.tipoDesarquivamento, // Mapeia tipoDesarquivamento para solicitacao
        dataSolicitacao: fixDate(req.body.dataSolicitacao),
        dataDesarquivamento: fixDate(req.body.dataDesarquivamento),
        dataDevolucao: fixDate(req.body.dataDevolucao),
        dataPrazoDevolucao: fixDate(req.body.dataPrazoDevolucao)
      });
      desarquivamento.updatedBy = req.session.user.id;

      await desarquivamento.save();

      await Auditoria.create({
        usuarioId: req.session.user.id,
        acao: 'update',
        entidade: 'Desarquivamento',
        entidadeId: desarquivamento.id,
        detalhes: desarquivamento.toJSON()
      });

      req.flash('success_msg', 'Registro atualizado com sucesso!');
      res.redirect('/nugecid');
    } catch (error) {
      console.error('Erro ao atualizar desarquivamento:', error);
      req.flash('error_msg', 'Erro ao atualizar o registro. Tente novamente.');
      res.render('nugecid/form', {
        title: 'Editar Desarquivamento',
        desarquivamento: { id, ...req.body },
        errors: [{ msg: 'Ocorreu um erro no servidor.' }],
        csrfToken: req.csrfToken(),
        user: req.session.user,
        layout: 'layout'
      });
    }
  }
];

exports.getEditForm = async (req, res) => {
  try {
    const { id } = req.params;
    const desarquivamento = await Desarquivamento.findByPk(id);
    
    if (!desarquivamento) {
      req.flash('error_msg', 'Registro não encontrado.');
      return res.redirect('/nugecid');
    }

    res.render('nugecid/form', {
      title: 'Editar Desarquivamento',
      desarquivamento,
      csrfToken: req.csrfToken(),
      errors: [],
      user: req.session.user,
      layout: 'layout'
    });
  } catch (error) {
    console.error('Erro ao carregar o formulário de edição:', error);
    req.flash('error_msg', 'Não foi possível carregar o formulário de edição.');
    res.redirect('/nugecid');
  }
};

/**
 * @desc Processa o POST do formulário de EDIÇÃO
 * @route POST /desarquivamentos/:id/editar
 */

/**
 * @desc Exclui (soft-delete) um desarquivamento
 * @route POST /desarquivamentos/:id/excluir
 */
exports.deleteItem = async (req, res) => {
  const { id } = req.params;
  const { adminUser, adminPassword } = req.body;

  try {
    // 1. Verificar se o usuário e a senha foram fornecidos
    if (!adminUser || !adminPassword) {
      req.flash('error_msg', 'Usuário e senha do administrador são obrigatórios.');
      return res.redirect('/nugecid');
    }

    // 2. Encontrar o administrador pelo e-mail (usando o campo 'adminUser' que contém o e-mail 'admin')
    const admin = await Usuario.findOne({ where: { email: adminUser } });
    if (!admin) {
      req.flash('error_msg', 'Administrador não encontrado.');
      return res.redirect('/nugecid');
    }

    // 3. Verificar se o usuário tem a role de 'admin' (ajuste o nome da role se for diferente)
    // Esta verificação depende de como as roles estão implementadas.
    // Supondo que o modelo Usuario tenha uma associação 'role' com um campo 'nome'.
    // Se a role estiver direto no usuário, a verificação seria: if (adminUser.perfil !== 'admin')
    // Vou assumir a verificação mais simples por enquanto.
    // const userRole = await adminUser.getRole(); // Exemplo se houver associação
    // if (!userRole || userRole.nome !== 'admin') {
    //   req.flash('error_msg', 'O usuário fornecido não tem permissão de administrador.');
    //   return res.redirect('/nugecid/desarquivamento');
    // }


    // 4. Comparar a senha fornecida com a senha hash no banco de dados
    const isMatch = await bcrypt.compare(adminPassword, admin.senha);
    if (!isMatch) {
      await Auditoria.create({
        usuarioId: req.session.user.id,
        acao: 'delete_attempt_failed',
        entidade: 'Desarquivamento',
        entidadeId: id,
        detalhes: { erro: 'Senha incorreta' }
      });
      req.flash('error_msg', 'Senha do administrador incorreta.');
      return res.redirect('/nugecid');
    }

    // 5. Se tudo estiver correto, proceder com a exclusão
    const desarquivamento = await Desarquivamento.findByPk(id);
    if (!desarquivamento) {
      await Auditoria.create({
        usuarioId: req.session.user.id,
        acao: 'delete_attempt_failed',
        entidade: 'Desarquivamento',
        entidadeId: id,
        detalhes: { erro: 'Registro não encontrado' }
      });
      req.flash('error_msg', 'Registro não encontrado.');
      return res.redirect('/nugecid');
    }

    await desarquivamento.destroy({
      hooks: true,
      individualHooks: true,
      userId: req.session.user.id // Registra quem fez a ação original
    });

    await Auditoria.create({
      usuarioId: req.session.user.id,
      acao: 'delete_success',
      entidade: 'Desarquivamento',
      entidadeId: id,
      detalhes: desarquivamento.toJSON()
    });

    req.flash('success_msg', 'Registro enviado para a lixeira com sucesso.');
    res.redirect('/nugecid');

  } catch (error) {
    console.error('Erro no processo de exclusão:', error);
    req.flash('error_msg', 'Ocorreu um erro durante o processo de exclusão.');
    res.redirect('/nugecid');
  }
};

/**
 * @desc Exibe os detalhes de um desarquivamento específico
 * @route GET /nugecid/desarquivamento/:id
 */
exports.getDetalhes = async (req, res) => {
  try {
    const { id } = req.params;
    const desarquivamento = await Desarquivamento.findByPk(id, {
      include: ['criadoPor', 'atualizadoPor']
    });

    if (!desarquivamento) {
      req.flash('error_msg', 'Registro não encontrado.');
      return res.redirect('/nugecid/desarquivamento');
    }

    res.render('nugecid/detalhes', {
      title: 'Detalhes do Desarquivamento',
      desarquivamento,
      csrfToken: req.csrfToken(),
      user: req.session.user,
      layout: 'layout'
    });
  } catch (error) {
    console.error('Erro ao buscar detalhes do desarquivamento:', error);
    req.flash('error_msg', 'Não foi possível carregar os detalhes do registro.');
    res.redirect('/nugecid');
  }
};

/**
 * @desc Exibe o formulário para importar planilha
 * @route GET /desarquivamentos/importar
 */
exports.getImportForm = (req, res) => {
  res.render('nugecid/import', {
    title: 'Importar Planilha',
    csrfToken: req.csrfToken(),
    user: req.session.user,
    layout: 'layout'
  });
};

/**
 * @desc Processa o upload da planilha e exibe a pré-visualização
 * @route POST /desarquivamentos/importar
 */
// Função auxiliar para normalizar as chaves dos dados da planilha
const normalizeDataKeys = (data) => {
  const keyMap = {
    // Mapeamentos para os novos campos
    'tipodesarquivamento': 'tipoDesarquivamento',
    'tipo de desarquivamento': 'tipoDesarquivamento',
    'status': 'status',
    'nomecompleto': 'nomeCompleto',
    'nome completo': 'nomeCompleto',
    'numdocumento': 'numDocumento',
    'nº do documento': 'numDocumento',
    'nic/laudo/auto': 'numDocumento',
    'nic laudo auto': 'numDocumento',
    'numprocesso': 'numProcesso',
    'nº do processo': 'numProcesso',
    'tipodocumento': 'tipoDocumento',
    'tipo de documento': 'tipoDocumento',
    'datasolicitacao': 'dataSolicitacao',
    'data da solicitação': 'dataSolicitacao',
    'datadesarquivamento': 'dataDesarquivamento',
    'data de desarquivamento': 'dataDesarquivamento',
    'datadevolucao': 'dataDevolucao',
    'data da devolução': 'dataDevolucao',
    'setordemandante': 'setorDemandante',
    'setor demandante': 'setorDemandante',
    'servidorresponsavel': 'servidorResponsavel',
    'servidor responsável': 'servidorResponsavel',
    'matrícula': 'servidorResponsavel',
    'matricula': 'servidorResponsavel',
    'finalidade': 'finalidade',
    'prazosolicitado': 'prazoSolicitado',
    'prazo solicitado': 'prazoSolicitado',
  };

  return data.map(row => {
    const newRow = {};
    for (const key in row) {
      if (Object.prototype.hasOwnProperty.call(row, key)) {
        // Normaliza a chave: minúsculas, remove acentos, caracteres especiais e espaços extras
        const normalizedKey = key.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/gi, ' ').replace(/\s+/g, ' ').trim();
        if (keyMap[normalizedKey]) {
          newRow[keyMap[normalizedKey]] = row[key];
        } else {
           const modelFields = Object.values(keyMap);
           const directMatch = modelFields.find(field => field.toLowerCase() === normalizedKey.replace(/\s/g, ''));
           if(directMatch) {
             newRow[directMatch] = row[key];
           }
        }
      }
    }
    return newRow;
  });
};

exports.postImport = (req, res) => {
  if (!req.file) {
    req.flash('error_msg', 'Nenhum arquivo foi enviado.');
    return res.redirect('/nugecid/importar');
  }

  try {
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawData = xlsx.utils.sheet_to_json(worksheet);

    const dados = normalizeDataKeys(rawData);

    if (!dados || dados.length === 0) {
      req.flash('error_msg', 'A planilha está vazia ou não foi possível ler os dados.');
      return res.redirect('/nugecid/importar');
    }

    // Armazena os dados na sessão para a confirmação
    req.session.importData = dados;

    res.render('nugecid/import-preview', {
      title: 'Pré-visualização da Importação',
      dados,
      csrfToken: req.csrfToken(),
      user: req.session.user,
      layout: 'layout'
    });

  } catch (error) {
    console.error('Erro ao processar a planilha:', error);
    req.flash('error_msg', 'Ocorreu um erro ao ler o arquivo. Verifique o formato.');
    res.redirect('/nugecid/importar');
  }
};

/**
 * @desc Confirma e processa a importação dos dados da planilha
 * @route POST /desarquivamentos/importar/confirmar
 */
exports.postConfirmImport = async (req, res) => {
  try {
    const dados = req.session.importData;
    if (!dados) {
      req.flash('error_msg', 'Nenhum dado de importação encontrado na sessão.');
      return res.redirect('/desarquivamentos/importar');
    }

    // Limpa os dados da sessão após recuperá-los
    req.session.importData = null;

    const userId = req.session.user.id;
    let createdCount = 0;
    let updatedCount = 0;

    for (const item of dados) {
      if (!item.numDocumento) continue; // Pula registros sem o campo chave

      // Garante que campos de data vazios ou inválidos sejam nulos
      for (const dateField of ['dataSolicitacao', 'dataDesarquivamento', 'dataDevolucao']) {
        if (!item[dateField] || isNaN(new Date(item[dateField]))) {
          item[dateField] = null;
        } else {
          item[dateField] = new Date(item[dateField]);
        }
      }

      const [record, created] = await Desarquivamento.findOrCreate({
        where: { numDocumento: item.numDocumento },
        defaults: { ...item, createdBy: userId, updatedBy: userId }
      });

      if (created) {
        createdCount++;
      } else {
        const updateData = { ...item, updatedBy: userId };
        delete updateData.createdBy; // Não sobrescrever o criador original
        await record.update(updateData);
        updatedCount++;
      }
    }

    req.flash('success_msg', `${createdCount} registros criados e ${updatedCount} registros atualizados com sucesso.`);
    res.redirect('/desarquivamentos');

  } catch (error) {
    console.error('Erro ao confirmar a importação:', error);
    req.flash('error_msg', 'Ocorreu um erro ao salvar os dados importados.');
    res.redirect('/desarquivamentos/importar');
  }
};

/**
 * @desc Atualiza o status de um desarquivamento via AJAX
 * @route POST /desarquivamentos/status/:id
 */
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.session.user.id;

    const desarquivamento = await Desarquivamento.findByPk(id);

    if (!desarquivamento) {
      return res.status(404).json({ success: false, message: 'Registro não encontrado.' });
    }

    // Valida se o status recebido é um dos valores permitidos no ENUM
    const allowedStatus = ['Finalizado', 'Desarquivado', 'Não coletado', 'Solicitado', 'Rearquivamento solicitado', 'Retirado pelo setor', 'Não localizado'];
    if (!allowedStatus.includes(status)) {
      return res.status(400).json({ success: false, message: 'Status inválido fornecido.' });
    }

    desarquivamento.status = status;
    desarquivamento.updatedBy = userId;

    // Regra de negócio: se o status for 'Finalizado' ou 'Retirado pelo setor', e não houver data de devolução, preenche com a data atual.
    if ((status === 'Finalizado' || status === 'Retirado pelo setor') && !desarquivamento.dataDevolucao) {
      desarquivamento.dataDevolucao = new Date();
    }

    await desarquivamento.save();

    res.json({ success: true, message: 'Status atualizado com sucesso.' });

  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    res.status(500).json({ success: false, message: 'Erro interno ao atualizar o status.' });
  }
};

/**
 * @desc Exporta a lista de desarquivamentos para um arquivo XLSX
 * @route GET /desarquivamentos/exportar/xlsx
 */
exports.exportXLSX = async (req, res) => {
  try {
    const desarquivamentos = await Desarquivamento.findAll({ order: [['id', 'DESC']], raw: true });

    const formatDate = (date) => date ? new Date(date).toLocaleDateString('pt-BR') : '';

    const dataToExport = desarquivamentos.map(item => ({
      'Tipo': item.tipoDesarquivamento,
      'Status': item.status,
      'Nome Completo': item.nomeCompleto,
      'Nº do Documento': item.numDocumento,
      'Nº do Processo': item.numProcesso,
      'Tipo de Documento': item.tipoDocumento,
      'Data da Solicitação': formatDate(item.dataSolicitacao),
      'Data do Desarquivamento': formatDate(item.dataDesarquivamento),
      'Data da Devolução': formatDate(item.dataDevolucao),
      'Setor Demandante': item.setorDemandante,
      'Servidor Responsável (Matrícula)': item.servidorResponsavel,
      'Finalidade': item.finalidade,
      'Prazo Solicitado': item.prazoSolicitado,
    }));

    const worksheet = xlsx.utils.json_to_sheet(dataToExport);
    
    // Auto-ajuste da largura das colunas
    const colWidths = Object.keys(dataToExport[0] || {}).map(key => ({ wch: Math.max(key.length, ...dataToExport.map(row => (row[key] || '').toString().length)) + 2 }));
    worksheet['!cols'] = colWidths;

    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Desarquivamentos');

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="desarquivamentos.xlsx"');

    const buffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'buffer' });
    res.send(buffer);

  } catch (error) {
    console.error('Erro ao exportar para XLSX:', error);
    req.flash('error_msg', 'Falha ao exportar dados para XLSX.');
    res.redirect('/nugecid');
  }
};

/**
 * @desc Exporta a lista de desarquivamentos para um arquivo PDF com QR Codes
 * @route GET /desarquivamentos/exportar/pdf
 */
exports.exportPDF = async (req, res) => {
  try {
    const desarquivamentos = await Desarquivamento.findAll({ order: [['id', 'DESC']] });
    const doc = new PDFDocument({ margin: 30, layout: 'landscape', size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="desarquivamentos.pdf"');
    doc.pipe(res);

    // Constantes de layout
    const pageTop = doc.page.margins.top;
    const pageBottom = doc.page.height - doc.page.margins.bottom;
    const tableTop = pageTop + 40;
    const rowHeight = 45; 
    const qrSize = 40;

    // Definições das colunas (posição X e largura)
    const columns = [
      { x: 30, width: 35, key: 'tipoDesarquivamento', header: 'Tipo' },
      { x: 70, width: 50, key: 'status', header: 'Status' },
      { x: 125, width: 70, key: 'nomeCompleto', header: 'Nome Completo' },
      { x: 200, width: 65, key: 'numDocumento', header: 'Nº Doc.' },
      { x: 270, width: 65, key: 'numProcesso', header: 'Nº Proc.' },
      { x: 340, width: 55, key: 'tipoDocumento', header: 'Tipo Doc.' },
      { x: 400, width: 45, key: 'dataSolicitacao', header: 'Data Sol.' },
      { x: 450, width: 45, key: 'dataDesarquivamento', header: 'Data Desarq.' },
      { x: 500, width: 45, key: 'dataDevolucao', header: 'Data Dev.' },
      { x: 550, width: 55, key: 'setorDemandante', header: 'Setor' },
      { x: 610, width: 55, key: 'servidorResponsavel', header: 'Servidor' },
      { x: 670, width: 70, key: 'finalidade', header: 'Finalidade' },
      { x: 745, width: qrSize, key: 'qrCode', header: 'QR' },
    ];

    const drawHeader = () => {
      doc.fontSize(14).font('Helvetica-Bold').text('Relatório de Desarquivamento de Prontuários', { align: 'center' });
      doc.fontSize(8).font('Helvetica-Bold');
      columns.forEach(col => {
        doc.text(col.header, col.x, tableTop, { width: col.width, align: 'center' });
      });
      doc.moveTo(doc.page.margins.left, tableTop + 15).lineTo(doc.page.width - doc.page.margins.right, tableTop + 15).stroke();
      doc.y = tableTop + 20;
    };

    const formatDate = (date) => date ? new Date(date).toLocaleDateString('pt-BR') : '—';

    drawHeader();

    for (const item of desarquivamentos) {
      if (doc.y + rowHeight > pageBottom) {
        doc.addPage();
        drawHeader();
      }

      const y = doc.y;
      doc.fontSize(7).font('Helvetica');

      columns.forEach(async (col) => {
        if (col.key === 'qrCode') return;
        let cellData = item[col.key] || '—';
        if (col.key.startsWith('data')) {
          cellData = formatDate(item[col.key]);
        }
        doc.text(cellData, col.x, y, { width: col.width, align: 'center' });
      });

      // Gera e desenha o QR Code de forma síncrona para evitar problemas de posicionamento
      const qrData = JSON.stringify({ id: item.id, doc: item.numDocumento, nome: item.nomeCompleto });
      const qrCodeImage = await QRCode.toDataURL(qrData, { errorCorrectionLevel: 'M', width: qrSize, margin: 1 });
      doc.image(qrCodeImage, columns.find(c => c.key === 'qrCode').x, y, { fit: [qrSize, qrSize] });

      doc.y = y + rowHeight;
      doc.moveTo(doc.page.margins.left, doc.y - 5).lineTo(doc.page.width - doc.page.margins.right, doc.y - 5).strokeColor('#cccccc').stroke();
    }

    doc.end();

  } catch (error) {
    console.error('Erro ao exportar para PDF:', error);
    req.flash('error_msg', 'Falha ao exportar dados para PDF.');
    res.redirect('/nugecid');
  }
};

/**
 * @desc Exibe a lixeira com itens excluídos (soft-deleted)
 * @route GET /nugecid/lixeira
 */
exports.getLixeira = async (req, res) => {
  try {
    const desarquivamentosExcluidos = await Desarquivamento.findAll({
      where: {
        deletedAt: {
          [Op.ne]: null // Op é importado de sequelize
        }
      },
      paranoid: false, // Importante para buscar itens soft-deleted
      order: [['deletedAt', 'DESC']],
      include: ['criadoPor', 'atualizadoPor', 'deletadoPor']
    });

    res.render('nugecid/lixeira', {
      title: 'Lixeira de Desarquivamentos',
      desarquivamentos: desarquivamentosExcluidos,
      csrfToken: req.csrfToken()
    });
  } catch (error) {
    console.error('Erro ao buscar itens da lixeira:', error);
    req.flash('error_msg', 'Não foi possível carregar os itens da lixeira.');
    res.redirect('/nugecid/desarquivamento');
  }
};

/**
 * @desc Restaura um item da lixeira (soft-delete)
 * @route POST /nugecid/lixeira/:id/restaurar
 */
exports.restaurarItem = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await Desarquivamento.findOne({ where: { id }, paranoid: false });
    if (item) {
      await item.restore();
      req.flash('success_msg', 'Registro restaurado com sucesso!');
    } else {
      req.flash('error_msg', 'Registro não encontrado.');
    }
    res.redirect('/nugecid/lixeira');
  } catch (error) {
    console.error('Erro ao restaurar item:', error);
    req.flash('error_msg', 'Ocorreu um erro ao restaurar o registro.');
    res.redirect('/nugecid/lixeira');
  }
};

/**
 * @desc Exclui um item permanentemente do banco de dados
 * @route POST /nugecid/lixeira/:id/excluir-permanente
 */
exports.excluirPermanentemente = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await Desarquivamento.findOne({ where: { id }, paranoid: false });
    if (item) {
      await item.destroy({ force: true }); // force: true para exclusão permanente
      req.flash('success_msg', 'Registro excluído permanentemente.');
    } else {
      req.flash('error_msg', 'Registro não encontrado.');
    }
    res.redirect('/nugecid/lixeira');
  } catch (error) {
    console.error('Erro ao excluir permanentemente:', error);
    req.flash('error_msg', 'Ocorreu um erro ao excluir o registro permanentemente.');
    res.redirect('/nugecid/lixeira');
  }
};

/**
 * @desc Esvazia a lixeira, excluindo permanentemente todos os itens.
 * @route POST /nugecid/lixeira/excluir-todos
 */
exports.esvaziarLixeira = async (req, res) => {
  const { adminUser, adminPassword } = req.body;

  try {
    // 1. Autenticação do Administrador
    if (!adminUser || !adminPassword) {
      req.flash('error_msg', 'Usuário e senha do administrador são obrigatórios.');
      return res.redirect('/nugecid/lixeira');
    }
    const admin = await Usuario.findOne({ where: { email: adminUser } });
    if (!admin) {
      req.flash('error_msg', 'Administrador não encontrado.');
      return res.redirect('/nugecid/lixeira');
    }
    const isMatch = await bcrypt.compare(adminPassword, admin.senha);
    if (!isMatch) {
      req.flash('error_msg', 'Senha do administrador incorreta.');
      return res.redirect('/nugecid/lixeira');
    }

    // 2. Exclusão em massa
    const deletedCount = await Desarquivamento.destroy({
      where: {
        deletedAt: {
          [Op.ne]: null
        }
      },
      force: true // Exclusão permanente
    });

    req.flash('success_msg', `${deletedCount} registros foram excluídos permanentemente. A lixeira está vazia.`);
    res.redirect('/nugecid/lixeira');

  } catch (error) {
    console.error('Erro ao esvaziar a lixeira:', error);
    req.flash('error_msg', 'Ocorreu um erro ao esvaziar a lixeira.');
    res.redirect('/nugecid/lixeira');
  }
};

/**
 * @desc Move todos os registros ativos para a lixeira.
 * @route POST /nugecid/desarquivamento/mover-todos-para-lixeira
 */
exports.moverTodosParaLixeira = async (req, res) => {
  const { adminUser, adminPassword } = req.body;

  try {
    // 1. Autenticação do Administrador
    if (!adminUser || !adminPassword) {
      req.flash('error_msg', 'Usuário e senha do administrador são obrigatórios.');
      return res.redirect('/nugecid');
    }
    const admin = await Usuario.findOne({ where: { email: adminUser } });
    if (!admin) {
        req.flash('error_msg', 'Administrador não encontrado.');
        return res.redirect('/nugecid');
      }
    const isMatch = await bcrypt.compare(adminPassword, admin.senha);
    if (!isMatch) {
      req.flash('error_msg', 'Senha do administrador incorreta.');
      return res.redirect('/nugecid');
    }

    // 2. Exclusão em massa (soft-delete)
    const deletedCount = await Desarquivamento.destroy({
      where: {
        deletedAt: null // Apenas registros que não estão na lixeira
      },
      hooks: true,
      individualHooks: true,
      userId: req.session.user.id
    });

    req.flash('success_msg', `${deletedCount} registros foram movidos para a lixeira.`);
    res.redirect('/nugecid');

  } catch (error) {
    console.error('Erro ao mover todos os registros para a lixeira:', error);
    req.flash('error_msg', 'Ocorreu um erro ao limpar os registros.');
    res.redirect('/nugecid');
  }
};

/**
 * @desc Exibe a página para selecionar registros para o termo.
 * @route GET /nugecid/termo/selecionar
 */
exports.getSelecaoTermo = async (req, res) => {
  try {
    const desarquivamentos = await Desarquivamento.findAll({
      order: [['dataSolicitacao', 'DESC']]
    });
    res.render('nugecid/selecionar-termo', {
      title: 'Gerar Termo de Desarquivamento',
      desarquivamentos,
      csrfToken: req.csrfToken()
    });
  } catch (error) {
    console.error('Erro ao buscar registros para seleção de termo:', error);
    req.flash('error_msg', 'Não foi possível carregar os registros.');
    res.redirect('/nugecid');
  }
};

/**
 * @desc Gera o termo de desarquivamento com múltiplos registros.
 * @route POST /nugecid/termo/gerar
 */
exports.prepararTermo = async (req, res) => {
  try {
    const { registroIds, observacao, numero_do_processo, data_do_desarquivamento } = req.body;

    if (!registroIds || registroIds.length === 0) {
      req.flash('error_msg', 'Nenhum registro selecionado.');
      return res.redirect('/nugecid/termo/selecionar');
    }

    const ids = Array.isArray(registroIds) ? registroIds : [registroIds];
    const registros = await Desarquivamento.findAll({ where: { id: ids } });

    res.render('nugecid/preparar-termo', {
      title: 'Preparar e Editar Termo',
      registros,
      observacao: observacao || '',
      numero_do_processo: numero_do_processo || '',
      data_do_desarquivamento: data_do_desarquivamento || new Date().toISOString().split('T')[0],
      csrfToken: req.csrfToken()
    });

  } catch (error) {
    console.error('Erro ao preparar o termo:', error);
    req.flash('error_msg', 'Ocorreu um erro ao preparar o documento.');
    res.redirect('/nugecid/termo/selecionar');
  }
};

exports.gerarTermoEmMassa = async (req, res) => {
  try {
    const { registros, observacao, numero_do_processo, data_do_desarquivamento } = req.body;

        const templatePath = path.resolve(__dirname, '..', 'templates', '01- MODELO - TERMO DE DESARQUIVAMENTO.docx');
    const content = fs.readFileSync(templatePath);
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: { start: '{', end: '}' }
    });

    const dadosParaTemplate = {
      numero_do_processo: numero_do_processo || '',
      data_do_desarquivamento: data_do_desarquivamento ? new Date(data_do_desarquivamento + 'T12:00:00Z').toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '',
      registros: registros.map((r, index) => ({
        'Nº': index + 1,
        Tipo_de_documento: r.tipoDocumento || '',
        nome_completo: r.nomeCompleto || '',
        Numero_do_documeto: r.numDocumento || '',
        observacao: observacao || ''
      }))
    };

    // Log detalhado dos dados que serão enviados para o template
    console.log('=== DADOS PARA TEMPLATE ===');
    console.log('Número do processo:', dadosParaTemplate.numero_do_processo);
    console.log('Data do desarquivamento:', dadosParaTemplate.data_do_desarquivamento);
    console.log('Registros encontrados:', registros.length);
    console.log('Dados dos registros:');
    dadosParaTemplate.registros.forEach((reg, idx) => {
      console.log(`Registro ${idx + 1}:`, reg);
    });
    console.log('=== FIM DOS DADOS ===');

    doc.render(dadosParaTemplate);

    const buf = doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' });

    res.setHeader('Content-Disposition', `attachment; filename=Termo_Desarquivamento_Final.docx`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.send(buf);

  } catch (error) {
    console.error('Erro ao gerar o termo em massa:', error);
    req.flash('error_msg', 'Ocorreu um erro ao gerar o documento.');
    res.redirect('/nugecid/termo/selecionar');
  }
};

/**
 * @desc Visualiza o termo de desarquivamento - abre visualizador online.
 * @route POST /nugecid/termo/visualizar
 */
exports.visualizarTermo = async (req, res) => {
  try {
    const { registroIds, observacao, numero_do_processo, data_do_desarquivamento } = req.body;

    if (!registroIds || registroIds.length === 0) {
      req.flash('error_msg', 'Nenhum registro selecionado.');
      return res.redirect('/nugecid/desarquivamento');
    }

    const ids = Array.isArray(registroIds) ? registroIds : [registroIds];
    const registros = await Desarquivamento.findAll({ where: { id: ids } });

    if (registros.length === 0) {
      req.flash('error_msg', 'Registros não encontrados.');
      return res.redirect('/nugecid/desarquivamento');
    }

    // Preparar dados para o template
    const hoje = new Date();
    const dataFormatada = data_do_desarquivamento ? 
      new Date(data_do_desarquivamento + 'T12:00:00Z').toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 
      hoje.toLocaleDateString('pt-BR');

    // Gerar HTML do termo para visualização seguindo o template oficial
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.4; font-size: 12px;">
        <!-- Cabeçalho -->
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="margin: 0; font-size: 16px; font-weight: bold;">INSTITUTO TÉCNICO-CIENTÍFICO DE PERÍCIA</h1>
          <h2 style="margin: 5px 0; font-size: 14px; font-weight: bold;">DO RIO GRANDE DO NORTE</h2>
          <h3 style="margin: 10px 0; font-size: 14px; font-weight: bold; text-decoration: underline;">TERMO DE DESARQUIVAMENTO</h3>
        </div>
        
        <!-- Orientações -->
        <div style="margin-bottom: 20px; font-size: 11px; text-align: justify;">
          <p style="margin: 5px 0;">Ao servidor responsável pelo desarquivamento compete ter ciência que esta solicitação de desarquivamento de documento deve estar vinculada a uma demanda do Instituto Técnico-Científico de Perícia do Rio Grande do Norte, ou jurisdição de órgão público através de autoridade competente.</p>
          <p style="margin: 5px 0;">Estar ciente quanto as orientações e normativas descritas na portaria nº 188/2023-GDG/ITEP no DOE nº 15433 de 25/05/2023, que dispõe sobre o acesso e o fluxo de desarquivamento de documentos no âmbito do Setor de Arquivo Geral do Instituto Técnico-Científico do Rio Grande do Norte.</p>
        </div>
        
        <!-- Dados do Processo -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr>
            <td style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold; background-color: #f0f0f0; width: 50%;">Nº. DE PROCESSO ELETRÔNICO</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold; background-color: #f0f0f0; width: 50%;">DATA DO DESARQUIVAMENTO</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; text-align: center; height: 30px;">${numero_do_processo || ''}</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: center; height: 30px;">${dataFormatada}</td>
          </tr>
        </table>
        
        <!-- Tabela de Documentos -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr>
              <th style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold; background-color: #f0f0f0; width: 8%;">Nº</th>
              <th style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold; background-color: #f0f0f0; width: 25%;">TIPO DE DOCUMENTO<br><span style="font-size: 10px; font-weight: normal;">Ex. Prontuário, Laudo, Parecer, Relatório.</span></th>
              <th style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold; background-color: #f0f0f0; width: 35%;">NOME</th>
              <th style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold; background-color: #f0f0f0; width: 15%;">NÚMERO</th>
              <th style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold; background-color: #f0f0f0; width: 17%;">OBSERVAÇÃO</th>
            </tr>
          </thead>
          <tbody>
            ${registros.map((r, index) => `
              <tr>
                <td style="border: 1px solid #000; padding: 8px; text-align: center; height: 25px;">${index + 1}</td>
                <td style="border: 1px solid #000; padding: 8px; text-align: center; height: 25px;">${r.tipoDocumento || 'Prontuário'}</td>
                <td style="border: 1px solid #000; padding: 8px; text-align: center; height: 25px;">${r.nomeCompleto || ''}</td>
                <td style="border: 1px solid #000; padding: 8px; text-align: center; height: 25px;">${r.numDocumento || ''}</td>
                <td style="border: 1px solid #000; padding: 8px; text-align: center; height: 25px;">${observacao || ''}</td>
              </tr>
            `).join('')}
            <!-- Linhas vazias para preenchimento manual -->
            ${Array.from({length: Math.max(0, 5 - registros.length)}, (_, i) => `
              <tr>
                <td style="border: 1px solid #000; padding: 8px; text-align: center; height: 25px;"></td>
                <td style="border: 1px solid #000; padding: 8px; text-align: center; height: 25px;"></td>
                <td style="border: 1px solid #000; padding: 8px; text-align: center; height: 25px;"></td>
                <td style="border: 1px solid #000; padding: 8px; text-align: center; height: 25px;"></td>
                <td style="border: 1px solid #000; padding: 8px; text-align: center; height: 25px;"></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <!-- Seção de Assinaturas -->
        <table style="width: 100%; border-collapse: collapse; margin-top: 30px;">
          <tr>
            <td style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold; background-color: #f0f0f0; width: 50%;">SETOR DE ARQUIVO GERAL<br>Responsável pela ENTREGA</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold; background-color: #f0f0f0; width: 50%;">SETOR SOLICITANTE<br>Responsável pelo RECEBIMENTO</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 20px; height: 60px; vertical-align: bottom;">
              <div style="border-top: 1px solid #000; margin-top: 40px; padding-top: 5px; text-align: center;">
                <strong>Assinatura</strong><br>
                <span style="font-size: 10px;">Por extenso</span>
              </div>
            </td>
            <td style="border: 1px solid #000; padding: 20px; height: 60px; vertical-align: bottom;">
              <div style="border-top: 1px solid #000; margin-top: 40px; padding-top: 5px; text-align: center;">
                <strong>Assinatura</strong><br>
                <span style="font-size: 10px;">Por extenso</span>
              </div>
            </td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; text-align: center; height: 30px;">MATRÍCULA:</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: center; height: 30px;">MATRÍCULA:</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; text-align: center; height: 30px;">DATA DA RETIRADA</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: center; height: 30px;">SETOR: ITEP-IC-NPI-SPD</td>
          </tr>
        </table>
        
        <!-- Rodapé -->
        <div style="margin-top: 20px; font-size: 10px; text-align: center;">
          <p style="margin: 5px 0;">*Observar as orientações da portaria nº 188/2023-GDG/ITEP no DOE nº 15433 de 25/05/2023, que dispõe quanto aos prazos e instruções normativas.</p>
        </div>
      </div>
    `;

    // Salvar dados na sessão para uso posterior
    req.session.termoData = {
      registros,
      observacao: observacao || 'Desarquivamento solicitado conforme necessidade do setor.',
      numero_do_processo: numero_do_processo || 'A ser preenchido',
      data_do_desarquivamento: dataFormatada,
      htmlContent
    };

    // Renderizar página de visualização
    res.render('nugecid/visualizar-termo', {
      title: 'Visualizar Termo de Desarquivamento',
      htmlContent,
      csrfToken: req.csrfToken(),
      user: req.session.user,
      layout: 'layout'
    });

  } catch (error) {
    console.error('Erro ao visualizar o termo:', error);
    req.flash('error_msg', 'Ocorreu um erro ao visualizar o documento.');
    res.redirect('/nugecid/desarquivamento');
  }
};

/**
 * @desc Gera o conteúdo HTML do termo para o editor colaborativo.
 * @route GET /nugecid/termo/conteudo-html
 */
exports.obterConteudoTermoHTML = async (req, res) => {
  try {
    const termoData = req.session.termoData;
    
    if (!termoData) {
      return res.status(400).json({ success: false, message: 'Dados do termo não encontrados na sessão.' });
    }

    const { registros, observacao, numero_do_processo, data_do_desarquivamento } = termoData;
    
    // Usar dados padrão quando não fornecidos
    const hoje = new Date();
    const dataFormatada = data_do_desarquivamento ? 
      new Date(data_do_desarquivamento + 'T12:00:00Z').toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 
      hoje.toLocaleDateString('pt-BR');
    
    // Gerar HTML do termo seguindo o template oficial
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.4; font-size: 12px;">
        <!-- Cabeçalho -->
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="margin: 0; font-size: 16px; font-weight: bold;">INSTITUTO TÉCNICO-CIENTÍFICO DE PERÍCIA</h1>
          <h2 style="margin: 5px 0; font-size: 14px; font-weight: bold;">DO RIO GRANDE DO NORTE</h2>
          <h3 style="margin: 10px 0; font-size: 14px; font-weight: bold; text-decoration: underline;">TERMO DE DESARQUIVAMENTO</h3>
        </div>
        
        <!-- Orientações -->
        <div style="margin-bottom: 20px; font-size: 11px; text-align: justify;">
          <p style="margin: 5px 0;">Ao servidor responsável pelo desarquivamento compete ter ciência que esta solicitação de desarquivamento de documento deve estar vinculada a uma demanda do Instituto Técnico-Científico de Perícia do Rio Grande do Norte, ou jurisdição de órgão público através de autoridade competente.</p>
          <p style="margin: 5px 0;">Estar ciente quanto as orientações e normativas descritas na portaria nº 188/2023-GDG/ITEP no DOE nº 15433 de 25/05/2023, que dispõe sobre o acesso e o fluxo de desarquivamento de documentos no âmbito do Setor de Arquivo Geral do Instituto Técnico-Científico do Rio Grande do Norte.</p>
        </div>
        
        <!-- Dados do Processo -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr>
            <td style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold; background-color: #f0f0f0; width: 50%;">Nº. DE PROCESSO ELETRÔNICO</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold; background-color: #f0f0f0; width: 50%;">DATA DO DESARQUIVAMENTO</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; text-align: center; height: 30px;">${numero_do_processo || ''}</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: center; height: 30px;">${dataFormatada}</td>
          </tr>
        </table>
        
        <!-- Tabela de Documentos -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr>
              <th style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold; background-color: #f0f0f0; width: 8%;">Nº</th>
              <th style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold; background-color: #f0f0f0; width: 25%;">TIPO DE DOCUMENTO<br><span style="font-size: 10px; font-weight: normal;">Ex. Prontuário, Laudo, Parecer, Relatório.</span></th>
              <th style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold; background-color: #f0f0f0; width: 35%;">NOME</th>
              <th style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold; background-color: #f0f0f0; width: 15%;">NÚMERO</th>
              <th style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold; background-color: #f0f0f0; width: 17%;">OBSERVAÇÃO</th>
            </tr>
          </thead>
          <tbody>
            ${registros.map((r, index) => `
              <tr>
                <td style="border: 1px solid #000; padding: 8px; text-align: center; height: 25px;">${index + 1}</td>
                <td style="border: 1px solid #000; padding: 8px; text-align: center; height: 25px;">${r.tipoDocumento || 'Prontuário'}</td>
                <td style="border: 1px solid #000; padding: 8px; text-align: center; height: 25px;">${r.nomeCompleto || ''}</td>
                <td style="border: 1px solid #000; padding: 8px; text-align: center; height: 25px;">${r.numDocumento || ''}</td>
                <td style="border: 1px solid #000; padding: 8px; text-align: center; height: 25px;">${observacao || ''}</td>
              </tr>
            `).join('')}
            <!-- Linhas vazias para preenchimento manual -->
            ${Array.from({length: Math.max(0, 5 - registros.length)}, (_, i) => `
              <tr>
                <td style="border: 1px solid #000; padding: 8px; text-align: center; height: 25px;"></td>
                <td style="border: 1px solid #000; padding: 8px; text-align: center; height: 25px;"></td>
                <td style="border: 1px solid #000; padding: 8px; text-align: center; height: 25px;"></td>
                <td style="border: 1px solid #000; padding: 8px; text-align: center; height: 25px;"></td>
                <td style="border: 1px solid #000; padding: 8px; text-align: center; height: 25px;"></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <!-- Seção de Assinaturas -->
        <table style="width: 100%; border-collapse: collapse; margin-top: 30px;">
          <tr>
            <td style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold; background-color: #f0f0f0; width: 50%;">SETOR DE ARQUIVO GERAL<br>Responsável pela ENTREGA</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold; background-color: #f0f0f0; width: 50%;">SETOR SOLICITANTE<br>Responsável pelo RECEBIMENTO</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 20px; height: 60px; vertical-align: bottom;">
              <div style="border-top: 1px solid #000; margin-top: 40px; padding-top: 5px; text-align: center;">
                <strong>Assinatura</strong><br>
                <span style="font-size: 10px;">Por extenso</span>
              </div>
            </td>
            <td style="border: 1px solid #000; padding: 20px; height: 60px; vertical-align: bottom;">
              <div style="border-top: 1px solid #000; margin-top: 40px; padding-top: 5px; text-align: center;">
                <strong>Assinatura</strong><br>
                <span style="font-size: 10px;">Por extenso</span>
              </div>
            </td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; text-align: center; height: 30px;">MATRÍCULA:</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: center; height: 30px;">MATRÍCULA:</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; text-align: center; height: 30px;">DATA DA RETIRADA</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: center; height: 30px;">SETOR: ITEP-IC-NPI-SPD</td>
          </tr>
        </table>
        
        <!-- Rodapé -->
        <div style="margin-top: 20px; font-size: 10px; text-align: center;">
          <p style="margin: 5px 0;">*Observar as orientações da portaria nº 188/2023-GDG/ITEP no DOE nº 15433 de 25/05/2023, que dispõe quanto aos prazos e instruções normativas.</p>
        </div>
      </div>
    `;

    res.json({ success: true, content: htmlContent });

  } catch (error) {
    console.error('Erro ao gerar conteúdo HTML do termo:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
  }
};

/**
 * @desc Gera e baixa o DOCX do termo usando o template original.
 * @route POST /nugecid/termo/baixar-docx
 */
exports.baixarTermoDOCX = async (req, res) => {
  try {
    const termoData = req.session.termoData;
    
    if (!termoData) {
      req.flash('error_msg', 'Dados do termo não encontrados na sessão.');
      return res.redirect('/nugecid/desarquivamento');
    }

    const { registros, observacao, numero_do_processo, data_do_desarquivamento } = termoData;

    // Carregar o template DOCX
    const templatePath = path.join(__dirname, '..', 'templates', '01- MODELO - TERMO DE DESARQUIVAMENTO.docx');
    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    const dadosTemplate = {
      numero_do_processo: numero_do_processo,
      data_do_desarquivamento: data_do_desarquivamento,
      observacao: observacao,
      registros: registros.map((r, index) => ({
        numero: index + 1,
        tipo_documento: r.tipoDocumento || 'Prontuário de Identificação Civil',
        nome_completo: r.nomeCompleto || '',
        numero_documento: r.numDocumento || ''
      }))
    };

    // Renderizar o template
    doc.render(dadosTemplate);
    const buf = doc.getZip().generate({ type: 'nodebuffer' });

    // Configurar headers para download
    const nomeArquivo = `Termo_Desarquivamento_${Date.now()}.docx`;
    res.setHeader('Content-Disposition', `attachment; filename="${nomeArquivo}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.send(buf);

  } catch (error) {
    console.error('Erro ao gerar DOCX:', error);
    req.flash('error_msg', 'Ocorreu um erro ao gerar o documento.');
    res.redirect('/nugecid/desarquivamento');
  }
};

exports.gerarTermoEditado = async (req, res) => {
  try {
    const { editedContent } = req.body;
    if (!editedContent) {
      req.flash('error_msg', 'Conteúdo editado não fornecido.');
      return res.redirect('/nugecid/termo/selecionar');
    }

    const buffer = await HTMLtoDOCX(editedContent, null, {
      table: { row: { cantSplit: true } },
      footer: true,
      pageNumber: true,
    });

    res.setHeader('Content-Disposition', `attachment; filename=Termo_Desarquivamento_Editado.docx`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.send(buffer);
  } catch (error) {
    console.error('Erro ao gerar DOCX editado:', error);
    req.flash('error_msg', 'Ocorreu um erro ao gerar o documento editado.');
    res.redirect('/nugecid/termo/selecionar');
  }
};

/**
 * @desc Exporta o termo editado como PDF.
 * @route POST /nugecid/termo/exportar-pdf
 */
exports.exportarTermoPDF = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ success: false, message: 'Conteúdo não fornecido.' });
    }

    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 50 });
    
    // Configurar headers para download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=Termo_Desarquivamento.pdf');
    
    // Pipe do documento para a resposta
    doc.pipe(res);
    
    // Adicionar conteúdo ao PDF (versão simplificada)
    // Remover tags HTML básicas para texto simples
    const textContent = content
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    doc.fontSize(12)
       .text(textContent, {
         align: 'justify',
         lineGap: 5
       });
    
    doc.end();

  } catch (error) {
    console.error('Erro ao exportar PDF:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
  }
};

/**
 * @desc Exporta o termo editado como DOCX.
 * @route POST /nugecid/termo/exportar-docx
 */
exports.exportarTermoDOCX = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ success: false, message: 'Conteúdo não fornecido.' });
    }

    const HTMLtoDOCX = require('html-to-docx');
    const buffer = await HTMLtoDOCX(content, null, {
      table: { row: { cantSplit: true } },
      footer: true,
      pageNumber: true,
    });

    res.setHeader('Content-Disposition', 'attachment; filename=Termo_Desarquivamento_Editado.docx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.send(buffer);

  } catch (error) {
    console.error('Erro ao exportar DOCX:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
  }
};
