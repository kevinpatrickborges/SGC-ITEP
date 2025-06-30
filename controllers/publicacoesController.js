'use strict';

const { Publicacao, File } = require('../models/associations');
const fakeCodeGenerator = require('../utils/fakeCodeGenerator');

// Lista todas as publicações
exports.listar = async (req, res) => {
  try {
    const publicacoes = await Publicacao.findAll({ 
      include: ['author', 'file'],
      order: [['createdAt', 'DESC']]
    });
    res.render('publicacoes/lista', { 
      publicacoes, 
      title: 'Publicações',
      layout: 'layout'
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao buscar publicações.');
  }
};

// Exibe o formulário de criação/edição
exports.mostrarFormulario = async (req, res) => {
  let publicacao = {};
  if (req.params.id) {
    publicacao = await Publicacao.findByPk(req.params.id);
    if (!publicacao) {
      req.flash('error_msg', 'Publicação não encontrada.');
      return res.redirect('/publicacoes');
    }
  }
  res.render('publicacoes/form', {
    title: req.params.id ? 'Editar Publicação' : 'Nova Publicação',
    publicacao,
    action: req.params.id ? `/publicacoes/editar/${req.params.id}` : '/publicacoes/novo',
    layout: 'layout'
  });
};

// Cria ou atualiza uma publicação
exports.salvar = async (req, res) => {
  const { id } = req.params;
  const { titulo, tipo, autores, resumo, status, fileId, gerar_doi, gerar_isbn } = req.body;

  try {
    const dados = {
      titulo, tipo, autores, resumo, status, fileId,
      authorId: req.user.id
    };

    // Gera DOI/ISBN falsos se solicitado
    if (gerar_doi === 'on') {
      dados.doi = fakeCodeGenerator.generateDOI();
    }
    if (gerar_isbn === 'on' && tipo === 'Livro') {
      dados.isbn = fakeCodeGenerator.generateISBN();
    }

    if (id) { // Atualização
      await Publicacao.update(dados, { where: { id } });
      req.flash('success_msg', 'Publicação atualizada com sucesso!');
    } else { // Criação
      await Publicacao.create(dados);
      req.flash('success_msg', 'Publicação criada com sucesso!');
    }
    res.redirect('/publicacoes');
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Erro ao salvar a publicação.');
    res.redirect(id ? `/publicacoes/editar/${id}` : '/publicacoes/novo');
  }
};

// Deleta uma publicação
exports.deletar = async (req, res) => {
  try {
    await Publicacao.destroy({ where: { id: req.params.id } });
    req.flash('success_msg', 'Publicação arquivada com sucesso.');
    res.redirect('/publicacoes');
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Erro ao arquivar a publicação.');
    res.redirect('/publicacoes');
  }
};
