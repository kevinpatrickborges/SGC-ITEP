const { Projeto, Usuario, MembroProjeto, Quadro, Lista, Tarefa } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

class ProjetosController {
  // Listar todos os projetos do usuário
  async index(req, res) {
    try {
      const userId = req.session.user.id;
      const isAdmin = req.session.user.role === 'admin';
      
      let whereClause = {};
      
      // Se não for admin, mostrar apenas projetos onde é membro
      if (!isAdmin) {
        const memberships = await MembroProjeto.findAll({
          where: { usuarioId: userId },
          attributes: ['projetoId']
        });
        
        const projectIds = memberships.map(m => m.projetoId);
        whereClause.id = { [Op.in]: projectIds };
      }
      
      const projetos = await Projeto.findAll({
        where: whereClause,
        include: [
          {
            model: Usuario,
            as: 'criador',
            attributes: ['id', 'nome', 'email'],
            required: false
          },
          {
            model: Usuario,
            as: 'responsavelProjeto',
            attributes: ['id', 'nome', 'email'],
            required: false
          },
          {
            model: MembroProjeto,
            as: 'membros',
            required: false,
            include: [{
              model: Usuario,
              as: 'usuario',
              attributes: ['id', 'nome', 'email']
            }]
          }
        ],
        order: [['createdAt', 'DESC']]
      });
      
      res.render('projetos/index', {
        title: 'Gestão de Projetos',
        projetos,
        user: req.session.user
      });
    } catch (error) {
      console.error('Erro ao listar projetos:', error);
      res.status(500).render('error', {
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error : {}
      });
    }
  }
  
  // Exibir formulário de criação
  async create(req, res) {
    try {
      const usuarios = await Usuario.findAll({
        attributes: ['id', 'nome', 'email'],
        order: [['nome', 'ASC']]
      });
      
      res.render('projetos/create', {
        title: 'Novo Projeto',
        usuarios,
        user: req.session.user
      });
    } catch (error) {
      console.error('Erro ao carregar formulário:', error);
      res.status(500).render('error', {
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error : {}
      });
    }
  }
  
  // Criar novo projeto
  async store(req, res) {
    const transaction = await sequelize.transaction();
    
    try {
      const {
        nome,
        descricao,
        cor,
        status,
        dataInicio,
        dataFim,
        prioridade,
        responsavel,
        membros
      } = req.body;
      
      // Criar o projeto
      const projeto = await Projeto.create({
        nome,
        descricao,
        cor: cor || '#007bff',
        status: status || 'planejamento',
        dataInicio: dataInicio || null,
        dataFim: dataFim || null,
        prioridade: prioridade || 'media',
        progresso: 0,
        criadoPor: req.session.user.id,
        responsavel: responsavel || req.session.user.id
      }, { transaction });
      
      // Adicionar criador como admin do projeto
      await MembroProjeto.create({
        projetoId: projeto.id,
        usuarioId: req.session.user.id,
        papel: 'admin',
        statusConvite: 'aceito',
        dataAceite: new Date()
      }, { transaction });
      
      // Adicionar responsável se diferente do criador
      if (responsavel && responsavel != req.session.user.id) {
        await MembroProjeto.create({
          projetoId: projeto.id,
          usuarioId: responsavel,
          papel: 'gerente',
          statusConvite: 'aceito',
          dataAceite: new Date(),
          convidadoPor: req.session.user.id
        }, { transaction });
      }
      
      // Adicionar outros membros
      if (membros && Array.isArray(membros)) {
        for (const membroId of membros) {
          if (membroId != req.session.user.id && membroId != responsavel) {
            await MembroProjeto.create({
              projetoId: projeto.id,
              usuarioId: membroId,
              papel: 'membro',
              statusConvite: 'aceito',
              dataAceite: new Date(),
              convidadoPor: req.session.user.id
            }, { transaction });
          }
        }
      }
      
      // Criar quadro padrão Kanban
      const quadroKanban = await Quadro.create({
        nome: 'Quadro Principal',
        descricao: 'Quadro Kanban principal do projeto',
        cor: '#28a745',
        ordem: 1,
        projetoId: projeto.id,
        tipo: 'kanban',
        criadoPor: req.session.user.id
      }, { transaction });
      
      // Criar listas padrão
      const listas = [
        { nome: 'A Fazer', tipo: 'todo', cor: '#6c757d', ordem: 1 },
        { nome: 'Em Andamento', tipo: 'doing', cor: '#ffc107', ordem: 2 },
        { nome: 'Concluído', tipo: 'done', cor: '#28a745', ordem: 3 }
      ];
      
      for (const lista of listas) {
        await Lista.create({
          ...lista,
          quadroId: quadroKanban.id,
          criadoPor: req.session.user.id
        }, { transaction });
      }
      
      await transaction.commit();
      
      req.flash('success', 'Projeto criado com sucesso!');
      res.redirect('/projetos');
    } catch (error) {
      await transaction.rollback();
      console.error('Erro ao criar projeto:', error);
      req.flash('error', 'Erro ao criar projeto. Tente novamente.');
      res.redirect('/projetos/create');
    }
  }
  
  // Exibir projeto específico
  async show(req, res) {
    try {
      const { id } = req.params;
      const userId = req.session.user.id;
      const isAdmin = req.session.user.role === 'admin';
      
      // Verificar se o usuário tem acesso ao projeto
      let whereClause = { id };
      
      if (!isAdmin) {
        const membership = await MembroProjeto.findOne({
          where: { projetoId: id, usuarioId: userId }
        });
        
        if (!membership) {
          req.flash('error', 'Acesso negado a este projeto.');
          return res.redirect('/projetos');
        }
      }
      
      const projeto = await Projeto.findOne({
        where: whereClause,
        include: [
          {
            model: Usuario,
            as: 'criador',
            attributes: ['id', 'nome', 'email']
          },
          {            model: Usuario,            as: 'responsavelProjeto',            attributes: ['id', 'nome', 'email']          },
          {
            model: MembroProjeto,
            as: 'membros',
            required: false,
            include: [{
              model: Usuario,
              as: 'usuario',
              attributes: ['id', 'nome', 'email']
            }]
          },
          {
            model: Quadro,
            as: 'quadros',
            required: false,
            include: [{
              model: Lista,
              as: 'listas',
              required: false,
              include: [{
                model: Tarefa,
                as: 'tarefas',
                required: false,
                include: [{
                  model: Usuario,
                  as: 'responsavelTarefa',
                  attributes: ['id', 'nome', 'email']
                }]
              }]
            }]
          }
        ]
      });
      
      if (!projeto) {
        req.flash('error', 'Projeto não encontrado.');
        return res.redirect('/projetos');
      }
      
      res.render('projetos/show', {
        title: `Projeto: ${projeto.nome}`,
        projeto,
        user: req.session.user
      });
    } catch (error) {
      console.error('Erro ao exibir projeto:', error);
      res.status(500).render('error', {
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error : {}
      });
    }
  }
  
  // Exibir formulário de edição
  async edit(req, res) {
    try {
      const { id } = req.params;
      const userId = req.session.user.id;
      const isAdmin = req.session.user.role === 'admin';
      
      // Verificar permissões
      if (!isAdmin) {
        const membership = await MembroProjeto.findOne({
          where: {
            projetoId: id,
            usuarioId: userId,
            papel: { [Op.in]: ['admin', 'gerente'] }
          }
        });
        
        if (!membership) {
          req.flash('error', 'Você não tem permissão para editar este projeto.');
          return res.redirect(`/projetos/${id}`);
        }
      }
      
      const projeto = await Projeto.findOne({
        where: { id },
        include: [{
          model: MembroProjeto,
          as: 'membros',
          required: false,
          include: [{
            model: Usuario,
            as: 'usuario',
            attributes: ['id', 'nome', 'email']
          }]
        }]
      });
      
      if (!projeto) {
        req.flash('error', 'Projeto não encontrado.');
        return res.redirect('/projetos');
      }
      
      const usuarios = await Usuario.findAll({
        attributes: ['id', 'nome', 'email'],
        order: [['nome', 'ASC']]
      });
      
      // Extrair membros do projeto
      const membros = projeto.membros || [];
      
      // Calcular usuários disponíveis (que não são membros)
      const membrosIds = membros.map(m => m.usuarioId);
      const usuariosDisponiveis = usuarios.filter(u => !membrosIds.includes(u.id));
      
      res.render('projetos/edit', {
        title: `Editar Projeto: ${projeto.nome}`,
        projeto,
        usuarios,
        membros,
        usuariosDisponiveis,
        user: req.session.user
      });
    } catch (error) {
      console.error('Erro ao carregar formulário de edição:', error);
      res.status(500).render('error', {
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error : {}
      });
    }
  }
  
  // Atualizar projeto
  async update(req, res) {
    console.log('🔧 UPDATE METHOD CALLED:', {
      method: req.method,
      originalMethod: req.body._method,
      url: req.originalUrl,
      params: req.params,
      userId: req.session?.user?.id
    });
    
    try {
      const { id } = req.params;
      const userId = req.session.user.id;
      const isAdmin = req.session.user.role === 'admin';
      
      // Verificar permissões
      if (!isAdmin) {
        const membership = await MembroProjeto.findOne({
          where: {
            projetoId: id,
            usuarioId: userId,
            papel: { [Op.in]: ['admin', 'gerente'] }
          }
        });
        
        if (!membership) {
          req.flash('error', 'Você não tem permissão para editar este projeto.');
          return res.redirect(`/projetos/${id}`);
        }
      }
      
      const {
        nome,
        descricao,
        cor,
        status,
        dataInicio,
        dataFim,
        prioridade,
        responsavel,
        progresso,
        novosMembros
      } = req.body;
      
      // Usar transação para garantir consistência
      await sequelize.transaction(async (transaction) => {
        // Atualizar dados do projeto
        await Projeto.update({
          nome,
          descricao,
          cor,
          status,
          dataInicio: dataInicio || null,
          dataFim: dataFim || null,
          prioridade,
          responsavel,
          progresso: progresso || 0
        }, {
          where: { id },
          transaction
        });
        
        // Adicionar novos membros se foram selecionados
        if (novosMembros && Array.isArray(novosMembros) && novosMembros.length > 0) {
          const membrosParaAdicionar = novosMembros.map(usuarioId => ({
            projetoId: id,
            usuarioId: parseInt(usuarioId),
            papel: 'membro',
            convidadoPor: userId,
            dataConvite: new Date(),
            dataAceite: new Date(),
            statusConvite: 'aceito'
          }));
          
          await MembroProjeto.bulkCreate(membrosParaAdicionar, {
            transaction,
            ignoreDuplicates: true // Evita erro se o usuário já for membro
          });
        }
      });
      
      req.flash('success', 'Projeto atualizado com sucesso!');
      res.redirect(`/projetos/${id}`);
    } catch (error) {
      console.error('Erro ao atualizar projeto:', error);
      req.flash('error', 'Erro ao atualizar projeto. Tente novamente.');
      res.redirect(`/projetos/${req.params.id}/edit`);
    }
  }
  
  // Excluir projeto (soft delete)
  async destroy(req, res) {
    try {
      const { id } = req.params;
      const userId = req.session.user.id;
      const isAdmin = req.session.user.role === 'admin';
      
      // Verificar permissões
      if (!isAdmin) {
        const membership = await MembroProjeto.findOne({
          where: {
            projetoId: id,
            usuarioId: userId,
            papel: 'admin'
          }
        });
        
        if (!membership) {
          req.flash('error', 'Você não tem permissão para excluir este projeto.');
          return res.redirect(`/projetos/${id}`);
        }
      }
      
      await Projeto.update(
        { ativo: false },
        { where: { id } }
      );
      
      req.flash('success', 'Projeto excluído com sucesso!');
      res.redirect('/projetos');
    } catch (error) {
      console.error('Erro ao excluir projeto:', error);
      req.flash('error', 'Erro ao excluir projeto. Tente novamente.');
      res.redirect(`/projetos/${req.params.id}`);
    }
  }

  // Remover membro do projeto
  async removeMembro(req, res) {
    try {
      const { id, membroId } = req.params;
      const userId = req.session.user.id;
      const isAdmin = req.session.user.role === 'admin';
      
      // Verificar se o projeto existe
      const projeto = await Projeto.findByPk(id);
      if (!projeto) {
        req.flash('error', 'Projeto não encontrado.');
        return res.redirect('/projetos');
      }
      
      // Verificar permissões - apenas admin do sistema ou criador do projeto podem remover membros
      if (!isAdmin && projeto.criadoPor !== userId) {
        req.flash('error', 'Você não tem permissão para remover membros deste projeto.');
        return res.redirect(`/projetos/${id}`);
      }
      
      // Verificar se o membro existe
      const membro = await MembroProjeto.findOne({
        where: { id: membroId, projetoId: id },
        include: [{
          model: Usuario,
          as: 'usuario',
          attributes: ['id', 'nome']
        }]
      });
      
      if (!membro) {
        req.flash('error', 'Membro não encontrado.');
        return res.redirect(`/projetos/${id}/edit`);
      }
      
      // Não permitir remover o criador do projeto
      if (membro.usuarioId === projeto.criadoPor) {
        req.flash('error', 'Não é possível remover o criador do projeto.');
        return res.redirect(`/projetos/${id}/edit`);
      }
      
      // Remover o membro
      await membro.destroy();
      
      req.flash('success', `${membro.usuario.nome} foi removido do projeto com sucesso!`);
      res.redirect(`/projetos/${id}/edit`);
    } catch (error) {
      console.error('Erro ao remover membro:', error);
      req.flash('error', 'Erro ao remover membro. Tente novamente.');
      res.redirect(`/projetos/${req.params.id}/edit`);
    }
  }
}

module.exports = new ProjetosController();