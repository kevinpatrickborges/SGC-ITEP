const Vestigio = require('../../models/Vestigio');
const Localizacao = require('../../models/Localizacao');
const { Op } = require('sequelize');
const path = require('path');
const { validationResult } = require('express-validator');

// Listar vestígios (com busca rápida)
exports.listarVestigios = async (req, res) => {
  try {
    const busca = req.query.busca || '';
    let where = {};
    if (busca) {
      where = {
        [Op.or]: [
          { codigo: { [Op.like]: `%${busca}%` } },
          { numeroLaudo: { [Op.like]: `%${busca}%` } },
          { numeroProcesso: { [Op.like]: `%${busca}%` } },
          { descricao: { [Op.like]: `%${busca}%` } }
        ]
      };
    }
    
    const vestigios = await Vestigio.findAll({ 
      where, 
      order: [['createdAt', 'DESC']],
      attributes: {
        exclude: ['localizacaoId']
      }
    });
    
    res.render('custodia_vestigios/vestigios/lista', { title: res.__('Vestigios'), vestigios, busca });
  } catch (error) {
    console.error('Erro ao listar vestígios:', error);
    req.flash('error_msg', 'Ocorreu um erro ao listar os vestígios.');
    res.redirect('/');
  }
};

// Formulário de novo vestígio
exports.formNovoVestigio = async (req, res) => {
  const locais = await Localizacao.findAll();
  res.render('custodia_vestigios/vestigios/novo', {
    title: res.__('Cadastro de Vestígio'),
    locais,
    csrfToken: res.locals.csrfToken || (typeof req.csrfToken === 'function' ? req.csrfToken() : '')
  });
};

const { registrarAuditoria } = require('../../middleware/auditoria');
const logAuditoria = require('../../utils/logAuditoria');
const { gerarCatalogacao } = require('../../utils/catalogacaoVestigio');

exports.criarVestigio = async (req, res) => {
  try {
    let anexos = [];
    if (req.files && req.files.length > 0) {
      anexos = req.files.map(f => f.filename || f.originalname);
    }
    const {
      tipo, numeroLaudo, numeroProcesso, descricao, origem, dataEntrada,
      responsavelNome, responsavelMatricula, localizacaoId, codigoNicho
    } = req.body;
    const catalogacao = gerarCatalogacao(tipo);
    const vestigio = await Vestigio.create({
      tipo, numeroLaudo, numeroProcesso, descricao, origem,
      dataEntrada, responsavelNome, responsavelMatricula,
      catalogacao, anexos, codigoNicho
    });
    if (localizacaoId) {
      await vestigio.setLocalizacao(localizacaoId);
    }
    await logAuditoria(req.user?.id, 'create', 'Vestigio', vestigio.id, vestigio.toJSON());
    req.flash('success_msg', res.__('Vestígio Adicionado'));
    return res.redirect('/custodia-vestigios/vestigios');
  } catch (e) {
    req.flash('error_msg', res.__('Erro ao cadastrar vestígio.'));
    res.redirect('/custodia-vestigios/vestigios/novo');
  }
};

exports.view3d = async (req, res) => {
  const vestigio = await Vestigio.findByPk(req.params.id, { include: [{ model: Localizacao, as: 'localizacao' }] });
  if (!vestigio) {
    req.flash('error_msg', 'Vestígio não encontrado.');
    return res.redirect('/custodia-vestigios/vestigios');
  }
  let codigo_prefix = 'ARM';
  if (vestigio.localizacao && vestigio.localizacao.codigo) {
    codigo_prefix = vestigio.localizacao.codigo;
  }
  const codigo_3d = vestigio.codigoNicho || '';
  res.render('custodia_vestigios/localizacoes/view3d', {
    title: 'Visualização 3D do Vestígio',
    loc: {
      codigo_prefix,
      codigo_3d
    }
  });
};

exports.deletarVestigio = async (req, res) => {
  try {
    const vestigio = await Vestigio.findByPk(req.params.id);
    if (!vestigio) {
      req.flash('error_msg', res.__('Vestígio não encontrado.'));
      return res.redirect('/custodia-vestigios/vestigios');
    }
    await vestigio.destroy();
    req.flash('success_msg', res.__('Vestígio excluído com sucesso!'));
    res.redirect('/custodia-vestigios/vestigios');
  } catch (e) {
    req.flash('error_msg', res.__('Erro ao excluir vestígio.'));
    res.redirect('/custodia-vestigios/vestigios');
  }
};

exports.detalheVestigio = async (req, res) => {
  try {
    const vestigio = await Vestigio.findByPk(req.params.id, {
      include: [{ model: Localizacao, as: 'localizacao' }]
    });
    if (!vestigio) {
      req.flash('error_msg', res.__('Vestígio não encontrado.'));
      return res.redirect('/custodia-vestigios/vestigios');
    }
    res.render('custodia_vestigios/vestigios/detalhe', { title: res.__('Detalhe do Vestígio'), vestigio, csrfToken: res.locals.csrfToken });
  } catch (error) {
    console.error(error);
    req.flash('error_msg', res.__('Erro ao buscar detalhes do vestígio.'));
    res.redirect('/custodia-vestigios/vestigios');
  }
};

exports.formAlterarStatus = async (req, res) => {
  const vestigio = await Vestigio.findByPk(req.params.id);
  if (!vestigio) {
    req.flash('error_msg', res.__('Vestígio não encontrado.'));
    return res.redirect('/custodia-vestigios/vestigios');
  }
  res.render('custodia_vestigios/vestigios/alterarStatus', { title: 'Alterar Status', vestigio, csrfToken: res.locals.csrfToken });
};

exports.alterarStatus = async (req, res) => {
  const { id } = req.params;
  const { novoStatus, usuario, senha } = req.body;
  const Usuario = require('../../models/Usuario');
  const bcrypt = require('bcryptjs');
  try {
    const user = await Usuario.findOne({ where: { matricula: usuario } });
    if (!user) {
      req.flash('error_msg', res.__('Usuário não encontrado.'));
      return res.redirect(`/custodia-vestigios/vestigios/${id}`);
    }
    const senhaOk = await bcrypt.compare(senha, user.senha);
    if (!senhaOk) {
      req.flash('error_msg', res.__('Senha inválida.'));
      return res.redirect(`/custodia-vestigios/vestigios/${id}`);
    }
    const vestigio = await Vestigio.findByPk(id);
    if (!vestigio) {
      req.flash('error_msg', res.__('Vestígio não encontrado.'));
      return res.redirect('/custodia-vestigios/vestigios');
    }
    if (!['Descarte','Transporte','em_custodia'].includes(novoStatus)) {
      req.flash('error_msg', res.__('Status inválido.'));
      return res.redirect(`/custodia-vestigios/vestigios/${id}`);
    }
    await vestigio.update({ status: novoStatus });
    await logAuditoria(user.id, 'update_status', 'Vestigio', vestigio.id, { status: novoStatus });
    req.flash('success_msg', res.__('Status alterado com sucesso!'));
    res.redirect(`/custodia-vestigios/vestigios/${id}`);
  } catch (err) {
    req.flash('error_msg', res.__('Erro ao alterar status.'));
    res.redirect(`/custodia-vestigios/vestigios/${id}`);
  }
};

// API
exports.apiListarVestigios = async (req, res) => {
  try {
    const vestigios = await Vestigio.findAll();
    res.json(vestigios);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar vestígios.' });
  }
};

exports.apiDetalheVestigio = async (req, res) => {
  try {
    const vestigio = await Vestigio.findByPk(req.params.id);
    if (!vestigio) return res.status(404).json({ error: 'Vestígio não encontrado.' });
    res.json(vestigio);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar vestígio.' });
  }
};

exports.apiCriarVestigio = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const novo = await Vestigio.create(req.body);
    await logAuditoria(req.user?.id, 'create', 'Vestigio', novo.id, novo.toJSON());
    res.status(201).json(novo);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar vestígio.' });
  }
};

exports.apiEditarVestigio = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const vestigio = await Vestigio.findByPk(req.params.id);
    if (!vestigio) return res.status(404).json({ error: 'Vestígio não encontrado.' });
    await vestigio.update(req.body);
    await logAuditoria(req.user?.id, 'update', 'Vestigio', vestigio.id, req.body);
    res.json(vestigio);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao editar vestígio.' });
  }
};

exports.apiExcluirVestigio = async (req, res) => {
  try {
    const vestigio = await Vestigio.findByPk(req.params.id);
    if (!vestigio) return res.status(404).json({ error: 'Vestígio não encontrado.' });
    await logAuditoria(req.user?.id, 'delete', 'Vestigio', vestigio.id, vestigio.toJSON());
    await vestigio.destroy();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao excluir vestígio.' });
  }
};
