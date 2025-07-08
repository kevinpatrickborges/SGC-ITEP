// Controlador de movimentações de vestígios
// TODO: Implementar funções de registro e histórico
const Movimentacao = require('../models/Movimentacao');
const Vestigio = require('../models/Vestigio');
const { Op } = require('sequelize');
const path = require('path');
const { body, validationResult } = require('express-validator');

// Middleware de validação para novas movimentações
exports.validateNewMovimentacao = [
  body('tipoMovimentacao', 'O tipo de movimentação é obrigatório').isIn(['entrada', 'saida_temporaria', 'saida_definitiva']).escape(),
  body('agenteNome', 'O nome do agente é obrigatório').trim().notEmpty().escape(),
  body('agenteMatricula', 'A matrícula do agente é obrigatória').trim().notEmpty().escape(),
  body('destino', 'O destino é obrigatório para saídas').optional().trim().escape(),
  body('justificativa', 'A justificativa é obrigatória').trim().notEmpty().escape()
];

// Middleware de validação para edição de movimentações
exports.validateUpdateMovimentacao = [
  body('tipoMovimentacao', 'O tipo de movimentação é obrigatório').optional().isIn(['entrada', 'saida_temporaria', 'saida_definitiva']).escape(),
  body('agenteNome', 'O nome do agente é obrigatório').optional().trim().notEmpty().escape(),
  body('agenteMatricula', 'A matrícula do agente é obrigatória').optional().trim().notEmpty().escape(),
  body('destino', 'O destino é obrigatório para saídas').optional().trim().escape(),
  body('justificativa', 'A justificativa é obrigatória').optional().trim().notEmpty().escape()
];

// Listar movimentações de um vestígio
exports.listarMovimentacoesVestigio = async (req, res) => {
  const vestigioId = req.params.vestigioId;
  const vestigio = await Vestigio.findByPk(vestigioId);
  if (!vestigio) {
    req.flash('error_msg', res.__('Vestígio não encontrado.'));
    return res.redirect('/vestigios');
  }
  const movimentacoes = await Movimentacao.findAll({ where: { vestigioId }, order: [['data', 'DESC']] });
  res.render('movimentacoes/lista', { title: res.__('Movimentações'), vestigio, movimentacoes });
};

// Formulário de nova movimentação
exports.formNovaMovimentacao = async (req, res) => {
  const vestigio = await Vestigio.findByPk(req.params.vestigioId);
  if (!vestigio) {
    req.flash('error_msg', res.__('Vestígio não encontrado.'));
    return res.redirect('/vestigios');
  }
  res.render('movimentacoes/nova', { title: res.__('Nova Movimentação'), vestigio });
};

// Registrar movimentação
const { registrarAuditoria } = require('../middleware/auditoria');

exports.criarMovimentacao = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const vestigio = await Vestigio.findByPk(req.params.vestigioId);
    return res.render('movimentacoes/nova', {
      title: res.__('Nova Movimentação'),
      vestigio,
      error_msg: errors.array().map(e => e.msg).join(', '),
      formData: req.body
    });
  }

  try {
    const vestigioId = req.params.vestigioId;
    const anexo = req.file ? path.basename(req.file.path) : null;
    const { tipoMovimentacao, agenteNome, agenteMatricula, destino, justificativa, assinatura } = req.body;
    const mov = await Movimentacao.create({
      vestigioId, tipoMovimentacao, agenteNome, agenteMatricula, destino, justificativa, anexo, assinatura
    });
    await registrarAuditoria(req, 'Registro de Movimentação', `Vestígio: ${vestigioId}, Tipo: ${tipoMovimentacao}`);
    req.flash('success_msg', res.__('Movimentação registrada com sucesso!'));
    res.redirect(`/movimentacoes/vestigio/${vestigioId}`);
  } catch (e) {
    req.flash('error_msg', res.__('Erro ao registrar movimentação.'));
    res.redirect('back');
  }
};

// Formulário de edição de movimentação
exports.formEditarMovimentacao = async (req, res) => {
  const movimentacao = await Movimentacao.findByPk(req.params.id);
  if (!movimentacao) {
    req.flash('error_msg', res.__('Movimentação não encontrada.'));
    return res.redirect('/movimentacoes');
  }
  const vestigio = await Vestigio.findByPk(movimentacao.vestigioId);
  res.render('movimentacoes/editar', {
    title: res.__('Editar Movimentação'),
    movimentacao,
    vestigio,
    csrfToken: res.locals.csrfToken || (typeof req.csrfToken === 'function' ? req.csrfToken() : '')
  });
};

// Processar edição de movimentação
exports.editarMovimentacao = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const movimentacao = await Movimentacao.findByPk(req.params.id);
    const vestigio = await Vestigio.findByPk(movimentacao.vestigioId);
    return res.render('movimentacoes/editar', {
      title: res.__('Editar Movimentação'),
      movimentacao,
      vestigio,
      error_msg: errors.array().map(e => e.msg).join(', '),
      formData: req.body
    });
  }

  try {
    const movimentacao = await Movimentacao.findByPk(req.params.id);
    if (!movimentacao) {
      req.flash('error_msg', res.__('Movimentação não encontrada.'));
      return res.redirect('/movimentacoes');
    }

    const anexo = req.file ? path.basename(req.file.path) : movimentacao.anexo; // Mantém o anexo existente se nenhum novo for enviado
    await movimentacao.update({ ...req.body, anexo });
    await registrarAuditoria(req, 'Edição de Movimentação', `Movimentação: ${movimentacao.id}, Tipo: ${movimentacao.tipoMovimentacao}`);
    req.flash('success_msg', res.__('Movimentação atualizada com sucesso!'));
    res.redirect(`/movimentacoes/vestigio/${movimentacao.vestigioId}`);
  } catch (e) {
    req.flash('error_msg', res.__('Erro ao atualizar movimentação.'));
    res.redirect('back');
  }
};
