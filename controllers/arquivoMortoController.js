'use strict';

const { Vestigio, Usuario, Localizacao, Movimentacao } = require('../models/associations');
const { Op } = require('sequelize');

const getModelFromString = (modelName) => {
  const models = { Vestigio, Usuario, Localizacao, Movimentacao };
  const model = models[modelName];
  if (!model) throw new Error('Modelo inválido.');
  return model;
};

// Lista todos os itens arquivados, separados por abas
const listarArquivados = async (req, res) => {
  try {
    const options = { where: { deletedAt: { [Op.ne]: null } }, paranoid: false };

    const [vestigios, usuarios, localizacoes, movimentacoes] = await Promise.all([
      Vestigio.findAll(options),
      Usuario.findAll(options),
      Localizacao.findAll(options),
      Movimentacao.findAll(options)
    ]);

    res.render('arquivoMorto/lista', {
      title: 'Itens Arquivados',
      layout: 'layout',
      vestigios,
      usuarios,
      localizacoes,
      movimentacoes
    });
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Erro ao buscar itens arquivados.');
    res.redirect('/dashboard');
  }
};

// Restaura um item que foi soft-deleted
const restaurar = async (req, res) => {
  const { model, id } = req.params;
  try {
    const Model = getModelFromString(model);
    await Model.restore({ where: { id } });
    req.flash('success_msg', `${model} restaurado com sucesso.`);
  } catch (error) {
    console.error(error);
    req.flash('error_msg', `Erro ao restaurar o item: ${error.message}`);
  } finally {
    res.redirect('/arquivo-morto');
  }
};

// Deleta permanentemente um item do banco de dados
const deletarPermanentemente = async (req, res) => {
  const { model, id } = req.params;
  try {
    const Model = getModelFromString(model);
    await Model.destroy({ where: { id }, force: true }); // force: true para deleção permanente
    req.flash('success_msg', `${model} excluído permanentemente.`);
  } catch (error) {
    console.error(error);
    req.flash('error_msg', `Erro ao excluir o item: ${error.message}`);
  } finally {
    res.redirect('/arquivo-morto');
  }
};

module.exports = {
  listarArquivados,
  restaurar,
  deletarPermanentemente
};
