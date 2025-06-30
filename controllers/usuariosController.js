// Controlador de usuários e permissões
// TODO: Implementar funções de autenticação, cadastro e controle de acesso
const Usuario = require('../models/Usuario');
const bcrypt = require('bcryptjs');

// Listar usuários
exports.listarUsuarios = async (req, res) => {
  const usuarios = await Usuario.findAll({ order: [['createdAt', 'DESC']] });
  res.render('usuarios/lista', {
    title: res.__('Usuários'),
    usuarios,
    csrfToken: res.locals.csrfToken || (typeof req.csrfToken === 'function' ? req.csrfToken() : '')
  });
};

// Formulário de novo usuário
exports.formNovoUsuario = (req, res) => {
  res.render('usuarios/novo', {
    title: res.__('Novo Usuário'),
    csrfToken: res.locals.csrfToken || (typeof req.csrfToken === 'function' ? req.csrfToken() : '')
  });
};

// Exibir perfil do usuário autenticado
exports.perfilUsuario = async (req, res) => {
  if (!req.user) {
    req.flash('error_msg', res.__('Você precisa estar logado para acessar o perfil.'));
    return res.redirect('/login');
  }
  const usuario = await Usuario.findByPk(req.user.id);
  if (!usuario) {
    req.flash('error_msg', res.__('Usuário não encontrado.'));
    return res.redirect('/');
  }
  res.render('usuarios/perfil', {
    title: res.__('Meu Perfil'),
    usuario,
    csrfToken: res.locals.csrfToken || (typeof req.csrfToken === 'function' ? req.csrfToken() : '')
  });
};

// Cadastrar usuário
const { registrarAuditoria } = require('../middleware/auditoria');

exports.criarUsuario = async (req, res) => {
  try {
    const { nome, matricula, email, senha, perfil } = req.body;
    const hash = await bcrypt.hash(senha, 10);
    const usuario = await Usuario.create({ nome, matricula, email, senha: hash, perfil });
    await registrarAuditoria(req, 'Cadastro de Usuário', `Usuário: ${email}`);
    req.flash('success_msg', res.__('Usuário cadastrado com sucesso!'));
    res.redirect('/usuarios');
  } catch (e) {
    req.flash('error_msg', res.__('Erro ao cadastrar usuário.'));
    res.redirect('/usuarios/novo');
  }
};

// Detalhe do usuário
exports.detalheUsuario = async (req, res) => {
  const usuario = await Usuario.findByPk(req.params.id);
  if (!usuario) {
    req.flash('error_msg', res.__('Usuário não encontrado.'));
    return res.redirect('/usuarios');
  }
  res.render('usuarios/detalhe', { title: res.__('Detalhe do Usuário'), usuario });
};

// Excluir usuário
exports.excluirUsuario = async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.params.id);
    if (usuario) {
      // Proteção contra exclusão do usuário admin
      const usuarioId = req.params.id;
      const usuarioParaExcluir = await Usuario.findByPk(usuarioId);
      if (usuarioParaExcluir && (usuarioParaExcluir.id === 1 || usuarioParaExcluir.perfil === 'admin')) {
        req.flash('error_msg', 'Não é permitido excluir o usuário administrador principal!');
        return res.redirect('/usuarios');
      }
      // Prossegue com a exclusão normalmente
      await Usuario.destroy({ where: { id: usuarioId } });
      await registrarAuditoria(req, 'Exclusão de Usuário', `Usuário: ${usuario.email}`);
      req.flash('success_msg', res.__('Usuário excluído com sucesso!'));
      res.redirect('/usuarios');
    }
  } catch (e) {
    req.flash('error_msg', res.__('Erro ao excluir usuário.'));
    res.redirect('/usuarios');
  }
};

// ====== API RESTful JSON ======
const { validationResult } = require('express-validator');

exports.apiListarUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.findAll({ attributes: { exclude: ['senha'] }, order: [['createdAt', 'DESC']] });
    res.json(usuarios);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar usuários.' });
  }
};

exports.apiDetalheUsuario = async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.params.id, { attributes: { exclude: ['senha'] } });
    if (!usuario) return res.status(404).json({ error: 'Usuário não encontrado.' });
    res.json(usuario);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar usuário.' });
  }
};

exports.apiCriarUsuario = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const { nome, matricula, email, senha, role } = req.body;
    const hash = await bcrypt.hash(senha, 10);
    const usuario = await Usuario.create({ nome, matricula, email, senha: hash, perfil: role });
    res.status(201).json({ id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar usuário.' });
  }
};

exports.apiEditarUsuario = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const usuario = await Usuario.findByPk(req.params.id);
    if (!usuario) return res.status(404).json({ error: 'Usuário não encontrado.' });
    const updateData = { ...req.body };
    if (updateData.senha) {
      updateData.senha = await bcrypt.hash(updateData.senha, 10);
    }
    if (updateData.role) {
      updateData.perfil = updateData.role;
      delete updateData.role;
    }
    await usuario.update(updateData);
    res.json({ id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao editar usuário.' });
  }
};

exports.apiExcluirUsuario = async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.params.id);
    if (!usuario) return res.status(404).json({ error: 'Usuário não encontrado.' });
    await usuario.destroy();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao excluir usuário.' });
  }
};

module.exports = exports;
