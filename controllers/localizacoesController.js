const Localizacao = require('../models/Localizacao');

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
