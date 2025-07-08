const Localizacao = require('../models/Localizacao');
const { body, validationResult } = require('express-validator');

// Middleware de validação para novas localizações
exports.validateNewLocalizacao = [
  body('tipo', 'O tipo é obrigatório').trim().notEmpty().escape(),
  body('sala', 'A sala é obrigatória').trim().notEmpty().escape(),
  body('armario', 'O armário é obrigatório').trim().notEmpty().escape(),
  body('prateleira', 'A prateleira é obrigatória').trim().notEmpty().escape(),
  body('caixa', 'A caixa é obrigatória').trim().notEmpty().escape()
];

// Middleware de validação para edição de localizações
exports.validateUpdateLocalizacao = [
  body('tipo', 'O tipo é obrigatório').optional().trim().notEmpty().escape(),
  body('sala', 'A sala é obrigatória').optional().trim().notEmpty().escape(),
  body('armario', 'O armário é obrigatório').optional().trim().notEmpty().escape(),
  body('prateleira', 'A prateleira é obrigatória').optional().trim().notEmpty().escape(),
  body('caixa', 'A caixa é obrigatória').optional().trim().notEmpty().escape()
];

// Listar localizações
exports.listarLocalizacoes = async (req, res) => {
  const locais = await Localizacao.findAll({ order: [['createdAt', 'DESC']] });
  res.render('localizacoes/lista', {
    title: res.__('Localizacoes'),
    locais,
    csrfToken: res.locals.csrfToken || (typeof req.csrfToken === 'function' ? req.csrfToken() : '')
  });
};

// Formulário de nova localização
exports.formNovaLocalizacao = (req, res) => {
  res.render('localizacoes/novo', {
    title: res.__('Nova Localização'),
    csrfToken: res.locals.csrfToken || (typeof req.csrfToken === 'function' ? req.csrfToken() : '')
  });
};

// Criar localização
exports.criarLocalizacao = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('localizacoes/novo', {
      title: res.__('Nova Localização'),
      error_msg: errors.array().map(e => e.msg).join(', '),
      formData: req.body,
      csrfToken: res.locals.csrfToken || (typeof req.csrfToken === 'function' ? req.csrfToken() : '')
    });
  }

  try {
    await Localizacao.create(req.body);
    req.flash('success_msg', res.__('Localização cadastrada com sucesso!'));
    res.redirect('/localizacoes');
  } catch (e) {
    req.flash('error_msg', res.__('Erro ao cadastrar localização.'));
    res.redirect('/localizacoes/novo');
  }
};

// Detalhe da localização
exports.detalheLocalizacao = async (req, res) => {
  const local = await Localizacao.findByPk(req.params.id);
  if (!local) {
    req.flash('error_msg', res.__('Localização não encontrada.'));
    return res.redirect('/localizacoes');
  }
  res.render('localizacoes/detalhe', { title: res.__('Detalhe da Localização'), local });
};

// Deletar localização
exports.deletarLocalizacao = async (req, res) => {
  try {
    const local = await Localizacao.findByPk(req.params.id);
    if (!local) {
      req.flash('error_msg', res.__('Localização não encontrada.'));
      return res.redirect('/localizacoes');
    }
    await local.destroy();
    req.flash('success_msg', res.__('Localização excluída com sucesso!'));
    res.redirect('/localizacoes');
  } catch (e) {
    req.flash('error_msg', res.__('Erro ao excluir localização.'));
    res.redirect('/localizacoes');
  }
};

// Formulário de edição de localização
exports.getEditForm = async (req, res) => {
  try {
    const local = await Localizacao.findByPk(req.params.id);
    if (!local) {
      req.flash('error_msg', res.__('Localização não encontrada.'));
      return res.redirect('/localizacoes');
    }
    res.render('localizacoes/editar', {
      title: res.__('Editar Localização'),
      local,
      csrfToken: res.locals.csrfToken || (typeof req.csrfToken === 'function' ? req.csrfToken() : '')
    });
  } catch (e) {
    req.flash('error_msg', res.__('Erro ao carregar formulário de edição.'));
    res.redirect('/localizacoes');
  }
};

// Processar edição de localização
exports.postEditLocalizacao = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const local = await Localizacao.findByPk(req.params.id);
    return res.render('localizacoes/editar', {
      title: res.__('Editar Localização'),
      local,
      error_msg: errors.array().map(e => e.msg).join(', '),
      formData: req.body,
      csrfToken: res.locals.csrfToken || (typeof req.csrfToken === 'function' ? req.csrfToken() : '')
    });
  }

  try {
    const local = await Localizacao.findByPk(req.params.id);
    if (!local) {
      req.flash('error_msg', res.__('Localização não encontrada.'));
      return res.redirect('/localizacoes');
    }

    await local.update(req.body);
    req.flash('success_msg', res.__('Localização atualizada com sucesso!'));
    res.redirect('/localizacoes');
  } catch (e) {
    req.flash('error_msg', res.__('Erro ao atualizar localização.'));
    res.redirect(`/localizacoes/${req.params.id}/editar`);
  }
};

// Visualização 3D da localização
exports.view3D = async (req, res) => {
  const local = await Localizacao.findByPk(req.params.id);
  if (!local) {
    req.flash('error_msg', res.__('Localização não encontrada.'));
    return res.redirect('/localizacoes');
  }
  
  // Gerar código 3D baseado nas informações da localização
  const codigo_prefix = local.codigo || 'ARM';
  const codigo_3d = `${codigo_prefix}_L2C3`; // Exemplo de nicho

  res.render('localizacoes/view3d', { 
    title: res.__('Visualização 3D'), 
    loc: { 
      codigo_prefix, 
      codigo_3d 
    } 
  });
};
