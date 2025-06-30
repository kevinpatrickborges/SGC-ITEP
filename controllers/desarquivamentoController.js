const Desarquivamento = require('../models/Desarquivamento');
const { body, validationResult } = require('express-validator');
const xlsx = require('xlsx');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

/**
 * @desc Exibe a lista de desarquivamentos com filtros
 * @route GET /desarquivamentos
 */
exports.getList = async (req, res) => {
  try {
    const desarquivamentos = await Desarquivamento.findAll({
      order: [['dataSolicitacao', 'DESC']],
      include: ['criadoPor', 'atualizadoPor']
    });

    res.render('desarquivamentos/list', {
      title: 'NUGECID – Desarquivamentos',
      desarquivamentos,
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
  res.render('desarquivamentos/form', {
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
  body('tipoDesarquivamento').isIn(['Físico', 'Digital']).withMessage('Tipo de desarquivamento inválido.'),
  body('status').isIn(['Solicitado', 'Em posse', 'Devolvido', 'Extraviado']).withMessage('Status inválido.'),
  body('nomeCompleto').notEmpty().trim().withMessage('Nome completo é obrigatório.'),
  body('numDocumento').notEmpty().trim().withMessage('Nº do Documento é obrigatório.'),
  body('numProcesso').optional({ checkFalsy: true }).trim(),
  body('tipoDocumento').optional({ checkFalsy: true }).trim(),
  body('dataSolicitacao').isISO8601().toDate().withMessage('Data de solicitação inválida.'),
  body('dataDesarquivamento').optional({ checkFalsy: true }).isISO8601().toDate(),
  body('dataDevolucao').optional({ checkFalsy: true }).isISO8601().toDate(),
  body('setorDemandante').notEmpty().trim().withMessage('Setor demandante é obrigatório.'),
  body('servidorResponsavel').optional({ checkFalsy: true }).trim(),
  body('finalidade').notEmpty().trim().withMessage('Finalidade é obrigatória.'),
  body('prazoSolicitado').optional({ checkFalsy: true }).trim(),
];

exports.postNewForm = [
  ...validateForm,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render('desarquivamentos/form', {
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

      await Desarquivamento.create({
        ...req.body,
        createdBy: req.session.user.id,
        updatedBy: req.session.user.id
      });

      req.flash('success_msg', 'Registro de desarquivamento criado com sucesso!');
      res.redirect('/desarquivamentos');
    } catch (error) {
      console.error('Erro ao criar desarquivamento:', error);
      req.flash('error_msg', 'Erro ao criar o registro. Tente novamente.');
      // Renderiza o formulário novamente em caso de erro no DB
      res.render('desarquivamentos/form', {
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
      return res.render('desarquivamentos/form', {
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
        return res.redirect('/desarquivamentos');
      }

      // Atualiza o registro
      Object.assign(desarquivamento, req.body);
      desarquivamento.updatedBy = req.session.user.id;

      // Regra de negócio para data de devolução
      if (req.body.status === 'Devolvido' && !desarquivamento.dataDevolucao) {
        desarquivamento.dataDevolucao = new Date();
      }

      await desarquivamento.save();

      req.flash('success_msg', 'Registro atualizado com sucesso!');
      res.redirect('/desarquivamentos');
    } catch (error) {
      console.error('Erro ao atualizar desarquivamento:', error);
      req.flash('error_msg', 'Erro ao atualizar o registro. Tente novamente.');
      res.render('desarquivamentos/form', {
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
            return res.redirect('/desarquivamentos');
        }

        res.render('desarquivamentos/form', {
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
        res.redirect('/desarquivamentos');
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
  try {
    const { id } = req.params;
    const desarquivamento = await Desarquivamento.findByPk(id);

    if (!desarquivamento) {
      req.flash('error_msg', 'Registro não encontrado.');
      return res.redirect('/desarquivamentos');
    }

    await desarquivamento.destroy(); // Soft-delete

    req.flash('success_msg', 'Registro excluído com sucesso.');
    res.redirect('/desarquivamentos');
  } catch (error) {
    console.error('Erro ao excluir registro:', error);
    req.flash('error_msg', 'Ocorreu um erro ao excluir o registro.');
    res.redirect('/desarquivamentos');
  }
};

/**
 * @desc Exibe o formulário para importar planilha
 * @route GET /desarquivamentos/importar
 */
exports.getImportForm = (req, res) => {
  res.render('desarquivamentos/import', {
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
    return res.redirect('/desarquivamentos/importar');
  }

  try {
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawData = xlsx.utils.sheet_to_json(worksheet);

    const dados = normalizeDataKeys(rawData);

    if (!dados || dados.length === 0) {
      req.flash('error_msg', 'A planilha está vazia ou não foi possível ler os dados.');
      return res.redirect('/desarquivamentos/importar');
    }

    // Armazena os dados na sessão para a confirmação
    req.session.importData = dados;

    res.render('desarquivamentos/import-preview', {
      title: 'Pré-visualização da Importação',
      dados,
      csrfToken: req.csrfToken(),
      user: req.session.user,
      layout: 'layout'
    });

  } catch (error) {
    console.error('Erro ao processar a planilha:', error);
    req.flash('error_msg', 'Ocorreu um erro ao ler o arquivo. Verifique o formato.');
    res.redirect('/desarquivamentos/importar');
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

    desarquivamento.status = status;
    desarquivamento.updatedBy = userId;

    if (status === 'Devolvido' && !desarquivamento.dataDevolucao) {
      desarquivamento.dataDevolucao = new Date();
    }

    await desarquivamento.save();

    res.json({ success: true, message: 'Status atualizado com sucesso.' });

  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    res.status(500).json({ success: false, message: 'Erro ao atualizar o status.' });
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
    res.redirect('/desarquivamentos');
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
    res.redirect('/desarquivamentos');
  }
};

exports.postConfirmImport = async (req, res) => {
  try {
    const dadosImportacao = JSON.parse(req.body.dadosImportacao);
    if (!dadosImportacao || dadosImportacao.length === 0) {
      req.flash('error_msg', 'Não há dados para importar.');
      return res.redirect('/desarquivamentos');
    }

    let criados = 0;
    let atualizados = 0;
    const userId = req.session.user.id;

    for (const item of dadosImportacao) {
      // Pula linhas que não tenham um número de prontuário, que é a nossa chave de identificação
      if (!item.numProntuario) continue;

      const [registro, foiCriado] = await Desarquivamento.findOrCreate({
        where: { numProntuario: item.numProntuario },
        defaults: {
          nome: item.nome,
          motivo: item.motivo,
          solicitante: item.solicitante,
          dataSolicitacao: item.dataSolicitacao,
          dataDevolucao: item.dataDevolucao,
          status: item.status || 'Solicitado',
          createdBy: userId,
          updatedBy: userId,
        }
      });

      if (foiCriado) {
        criados++;
      } else {
        // Se não foi criado, significa que foi encontrado. Então, atualizamos os campos.
        // Apenas atualiza campos que foram fornecidos na planilha.
        registro.nome = item.nome || registro.nome;
        registro.motivo = item.motivo || registro.motivo;
        registro.solicitante = item.solicitante || registro.solicitante;
        registro.dataSolicitacao = item.dataSolicitacao || registro.dataSolicitacao;
        registro.dataDevolucao = item.dataDevolucao !== undefined ? item.dataDevolucao : registro.dataDevolucao;
        registro.status = item.status || registro.status;
        registro.updatedBy = userId;
        
        await registro.save();
        atualizados++;
      }
    }

    req.flash('success_msg', `Importação concluída! ${criados} registros criados e ${atualizados} atualizados.`);
    res.redirect('/desarquivamentos');

  } catch (error) {
    console.error('Erro ao confirmar a importação:', error);
    req.flash('error_msg', 'Ocorreu um erro ao salvar os dados importados.');
    res.redirect('/desarquivamentos');
  }
};

exports.deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    const desarquivamento = await Desarquivamento.findByPk(id);

    if (!desarquivamento) {
      req.flash('error_msg', 'Registro não encontrado.');
      return res.redirect('/desarquivamentos');
    }

    // O método destroy() fará o soft-delete por causa da opção paranoid: true no modelo
    await desarquivamento.destroy();
    req.flash('success_msg', 'Registro excluído com sucesso.');
    res.redirect('/desarquivamentos');
  } catch (error) {
    console.error('Erro ao excluir desarquivamento:', error);
    req.flash('error_msg', 'Erro ao excluir o registro. Tente novamente.');
    res.redirect('/desarquivamentos');
  }
};

exports.postEditForm = [
  // Validações são as mesmas da criação
  body('nome', 'O nome do prontuário é obrigatório.').trim().notEmpty(),
  body('numProntuario', 'O número do prontuário é obrigatório.').trim().notEmpty(),
  body('solicitante', 'O nome do solicitante é obrigatório.').trim().notEmpty(),
  body('motivo', 'O motivo é obrigatório.').trim().notEmpty(),
  body('dataSolicitacao', 'A data da solicitação é inválida.').isISO8601().toDate(),
  body('status', 'Status inválido.').isIn(['Solicitado', 'Em posse', 'Devolvido', 'Extraviado']),

  async (req, res) => {
    const { id } = req.params;
    const errors = validationResult(req);
    const { nome, numProntuario, motivo, solicitante, status, dataSolicitacao, dataDevolucao } = req.body;

    if (!errors.isEmpty()) {
      // Se houver erros, renderiza o formulário novamente com os dados e erros
      req.body.id = id; // Garante que o ID seja passado para a action do form
      return res.render('desarquivamentos/form', {
        title: 'Editar Desarquivamento',
        desarquivamento: req.body,
        csrfToken: req.csrfToken(),
        errors: errors.array(),
        user: req.session.user,
        layout: 'layout'
      });
    }

    try {
      const desarquivamento = await Desarquivamento.findByPk(id);
      if (!desarquivamento) {
        req.flash('error_msg', 'Registro não encontrado.');
        return res.redirect('/desarquivamentos');
      }

      // Atualiza os campos
      desarquivamento.nome = nome;
      desarquivamento.numProntuario = numProntuario;
      desarquivamento.motivo = motivo;
      desarquivamento.solicitante = solicitante;
      desarquivamento.status = status;
      desarquivamento.dataSolicitacao = dataSolicitacao;
      desarquivamento.dataDevolucao = status === 'Devolvido' ? new Date() : null;
      desarquivamento.updatedBy = req.session.user.id;

      await desarquivamento.save();

      req.flash('success_msg', 'Registro atualizado com sucesso!');
      res.redirect('/desarquivamentos');
    } catch (error) {
      console.error('Erro ao atualizar desarquivamento:', error);
      req.flash('error_msg', 'Erro ao atualizar o registro. Tente novamente.');
      res.redirect(`/desarquivamentos/${id}/editar`);
    }
  }
];
