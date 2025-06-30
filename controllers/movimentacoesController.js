// Controlador de movimentações de vestígios
// TODO: Implementar funções de registro e histórico
const Movimentacao = require('../models/Movimentacao');
const Vestigio = require('../models/Vestigio');
const { Op } = require('sequelize');
const path = require('path');

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
