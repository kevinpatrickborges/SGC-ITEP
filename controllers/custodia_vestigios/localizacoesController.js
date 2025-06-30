const Localizacao = require('../../models/Localizacao');

// Listar localizações
exports.listarLocalizacoes = async (req, res) => {
  const locais = await Localizacao.findAll({ order: [['createdAt', 'DESC']] });
  res.render('custodia_vestigios/localizacoes/lista', {
    title: res.__('Localizacoes'),
    locais,
    csrfToken: res.locals.csrfToken || (typeof req.csrfToken === 'function' ? req.csrfToken() : '')
  });
};

// Formulário de nova localização
exports.formNovaLocalizacao = (req, res) => {
  res.render('custodia_vestigios/localizacoes/novo', {
    title: res.__('Nova Localização'),
    csrfToken: res.locals.csrfToken || (typeof req.csrfToken === 'function' ? req.csrfToken() : '')
  });
};

// Criar localização
exports.criarLocalizacao = async (req, res) => {
  try {
    await Localizacao.create(req.body);
    req.flash('success_msg', res.__('Localização cadastrada com sucesso!'));
    res.redirect('/custodia-vestigios/localizacoes');
  } catch (e) {
    req.flash('error_msg', res.__('Erro ao cadastrar localização.'));
    res.redirect('/custodia-vestigios/localizacoes/novo');
  }
};

// Detalhe da localização
exports.detalheLocalizacao = async (req, res) => {
  const local = await Localizacao.findByPk(req.params.id);
  if (!local) {
    req.flash('error_msg', res.__('Localização não encontrada.'));
    return res.redirect('/custodia-vestigios/localizacoes');
  }
  res.render('custodia_vestigios/localizacoes/detalhe', { title: res.__('Detalhe da Localização'), local });
};

// Deletar localização
exports.deletarLocalizacao = async (req, res) => {
  try {
    const local = await Localizacao.findByPk(req.params.id);
    if (!local) {
      req.flash('error_msg', res.__('Localização não encontrada.'));
      return res.redirect('/custodia-vestigios/localizacoes');
    }
    await local.destroy();
    req.flash('success_msg', res.__('Localização excluída com sucesso!'));
    res.redirect('/custodia-vestigios/localizacoes');
  } catch (e) {
    req.flash('error_msg', res.__('Erro ao excluir localização.'));
    res.redirect('/custodia-vestigios/localizacoes');
  }
};

// Visualização 3D da localização
exports.view3D = async (req, res) => {
  const local = await Localizacao.findByPk(req.params.id);
  if (!local) {
    req.flash('error_msg', res.__('Localização não encontrada.'));
    return res.redirect('/custodia-vestigios/localizacoes');
  }
  
  const codigo_prefix = local.codigo || 'ARM';
  const codigo_3d = `${codigo_prefix}_L2C3`; // Exemplo

  res.render('custodia_vestigios/localizacoes/view3d', { 
    title: res.__('Visualização 3D'), 
    loc: { 
      codigo_prefix, 
      codigo_3d 
    } 
  });
};

// API
exports.apiListarLocalizacoes = async (req, res) => {
  try {
    const locais = await Localizacao.findAll();
    res.json(locais);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar localizações.' });
  }
};

exports.apiDetalheLocalizacao = async (req, res) => {
  try {
    const local = await Localizacao.findByPk(req.params.id);
    if (!local) return res.status(404).json({ error: 'Localização não encontrada.' });
    res.json(local);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar localização.' });
  }
};
