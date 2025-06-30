'use strict';

const { Desarquivamento } = require('../../models'); // Ajuste o caminho se o loader do sequelize for central

// Lista todos os registros
exports.listar = async (req, res) => {
  try {
    const desarquivamentos = await Desarquivamento.findAll({ order: [['data_solicitacao', 'DESC']] });
    res.render('nugecid/lista', { 
      desarquivamentos, 
      title: 'NUGECID - Desarquivamentos',
      layout: 'layout' // Garante que o layout principal seja usado
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao buscar registros.');
  }
};

// Mostra o formulário para um novo registro
exports.mostrarFormularioNovo = (req, res) => {
  res.render('nugecid/form', { 
    title: 'Novo Desarquivamento',
    desarquivamento: {}, // Objeto vazio para o formulário
    action: '/nugecid/novo',
    layout: 'layout'
  });
};

// Cria um novo registro
exports.criar = async (req, res) => {
  try {
    await Desarquivamento.create(req.body);
    req.flash('success_msg', 'Solicitação de desarquivamento criada com sucesso!');
    res.redirect('/nugecid');
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Erro ao criar a solicitação.');
    res.redirect('/nugecid/novo');
  }
};

// Mostra o formulário para editar um registro
exports.mostrarFormularioEditar = async (req, res) => {
  try {
    const desarquivamento = await Desarquivamento.findByPk(req.params.id);
    if (!desarquivamento) {
      req.flash('error_msg', 'Registro não encontrado.');
      return res.redirect('/nugecid');
    }
    res.render('nugecid/form', {
      title: 'Editar Desarquivamento',
      desarquivamento,
      action: `/nugecid/editar/${req.params.id}`,
      layout: 'layout'
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao buscar o registro.');
  }
};

// Atualiza um registro
exports.editar = async (req, res) => {
  try {
    const { id } = req.params;
    await Desarquivamento.update(req.body, { where: { id } });
    req.flash('success_msg', 'Solicitação atualizada com sucesso!');
    res.redirect('/nugecid');
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Erro ao atualizar a solicitação.');
    res.redirect(`/nugecid/editar/${req.params.id}`);
  }
};

// Deleta um registro (soft delete)
exports.deletar = async (req, res) => {
  try {
    await Desarquivamento.destroy({ where: { id: req.params.id } });
    req.flash('success_msg', 'Solicitação cancelada com sucesso.');
    res.redirect('/nugecid');
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Erro ao cancelar a solicitação.');
    res.redirect('/nugecid');
  }
};
