const { Tarefa, Lista, Projeto, Usuario, ComentarioTarefa, MembroProjeto, RegistroTempo } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

class TarefasController {
  // Listar tarefas (API para Kanban)
  async index(req, res) {
    try {
      const { projetoId, listaId, status } = req.query;
      const userId = req.session.user.id;
      const isAdmin = req.session.user.role === 'admin';
      
      let whereClause = { ativo: true };
      
      if (projetoId) {
        // Verificar acesso ao projeto
        if (!isAdmin) {
          const membership = await MembroProjeto.findOne({
            where: { projetoId, usuarioId: userId, ativo: true }
          });
          
          if (!membership) {
            return res.status(403).json({ error: 'Acesso negado ao projeto' });
          }
        }
        
        whereClause.projetoId = projetoId;
      }
      
      if (listaId) whereClause.listaId = listaId;
      if (status) whereClause.status = status;
      
      const tarefas = await Tarefa.findAll({
        where: whereClause,
        include: [
          {
            model: Usuario,
            as: 'criador',
            attributes: ['id', 'nome', 'email']
          },
          {
            model: Usuario,
            as: 'responsavelTarefa',
            attributes: ['id', 'nome', 'email']
          },
          {
            model: Lista,
            as: 'lista',
            attributes: ['id', 'nome', 'cor']
          },
          {
            model: Projeto,
            as: 'projeto',
            attributes: ['id', 'nome', 'cor']
          }
        ],
        order: [['ordem', 'ASC'], ['createdAt', 'DESC']]
      });
      
      res.json(tarefas);
    } catch (error) {
      console.error('Erro ao listar tarefas:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
  
  // Criar nova tarefa
  async store(req, res) {
    try {
      const {
        titulo,
        descricao,
        listaId,
        projetoId,
        responsavel,
        prioridade,
        dataVencimento,
        estimativaHoras,
        etiquetas,
        cor
      } = req.body;
      
      const userId = req.session.user.id;
      const isAdmin = req.session.user.role === 'admin';
      
      // Verificar acesso ao projeto
      if (!isAdmin) {
        const membership = await MembroProjeto.findOne({
          where: { projetoId, usuarioId: userId, ativo: true }
        });
        
        if (!membership) {
          return res.status(403).json({ error: 'Acesso negado ao projeto' });
        }
      }
      
      // Obter próxima ordem na lista
      const ultimaTarefa = await Tarefa.findOne({
        where: { listaId, ativo: true },
        order: [['ordem', 'DESC']]
      });
      
      const proximaOrdem = ultimaTarefa ? ultimaTarefa.ordem + 1 : 1;
      
      const tarefa = await Tarefa.create({
        titulo,
        descricao,
        listaId,
        projetoId,
        responsavel,
        prioridade: prioridade || 'media',
        dataVencimento: dataVencimento || null,
        estimativaHoras: estimativaHoras || null,
        etiquetas: etiquetas || [],
        cor,
        ordem: proximaOrdem,
        criadoPor: userId
      });
      
      // Buscar tarefa criada com relacionamentos
      const tarefaCriada = await Tarefa.findByPk(tarefa.id, {
        include: [
          {
            model: Usuario,
            as: 'criador',
            attributes: ['id', 'nome', 'email']
          },
          {
            model: Usuario,
            as: 'responsavelTarefa',
            attributes: ['id', 'nome', 'email']
          },
          {
            model: Lista,
            as: 'lista',
            attributes: ['id', 'nome', 'cor']
          },
          {
            model: Projeto,
            as: 'projeto',
            attributes: ['id', 'nome', 'cor']
          }
        ]
      });
      
      res.status(201).json(tarefaCriada);
    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
      res.status(500).json({ error: 'Erro ao criar tarefa' });
    }
  }
  
  // Exibir tarefa específica
  async show(req, res) {
    try {
      const { id } = req.params;
      const userId = req.session.user.id;
      const isAdmin = req.session.user.role === 'admin';
      
      const tarefa = await Tarefa.findOne({
        where: { id, ativo: true },
        include: [
          {
            model: Usuario,
            as: 'criador',
            attributes: ['id', 'nome', 'email']
          },
          {
            model: Usuario,
            as: 'responsavelTarefa',
            attributes: ['id', 'nome', 'email']
          },
          {
            model: Lista,
            as: 'lista',
            attributes: ['id', 'nome', 'cor']
          },
          {
            model: Projeto,
            as: 'projeto',
            attributes: ['id', 'nome', 'cor']
          },
          {
            model: ComentarioTarefa,
            as: 'comentarios',
            where: { ativo: true },
            required: false,
            include: [{
              model: Usuario,
              as: 'autor',
              attributes: ['id', 'nome', 'email']
            }],
            order: [['createdAt', 'ASC']]
          },
          {
            model: RegistroTempo,
            as: 'registrosTempo',
            where: { ativo: true },
            required: false,
            include: [{
              model: Usuario,
              as: 'usuario',
              attributes: ['id', 'nome', 'email']
            }]
          }
        ]
      });
      
      if (!tarefa) {
        return res.status(404).json({ error: 'Tarefa não encontrada' });
      }
      
      // Verificar acesso ao projeto
      if (!isAdmin) {
        const membership = await MembroProjeto.findOne({
          where: {
            projetoId: tarefa.projetoId,
            usuarioId: userId,
            ativo: true
          }
        });
        
        if (!membership) {
          return res.status(403).json({ error: 'Acesso negado' });
        }
      }
      
      res.json(tarefa);
    } catch (error) {
      console.error('Erro ao exibir tarefa:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
  
  // Atualizar tarefa
  async update(req, res) {
    try {
      const { id } = req.params;
      const userId = req.session.user.id;
      const isAdmin = req.session.user.role === 'admin';
      
      const tarefa = await Tarefa.findOne({
        where: { id, ativo: true }
      });
      
      if (!tarefa) {
        return res.status(404).json({ error: 'Tarefa não encontrada' });
      }
      
      // Verificar acesso ao projeto
      if (!isAdmin) {
        const membership = await MembroProjeto.findOne({
          where: {
            projetoId: tarefa.projetoId,
            usuarioId: userId,
            ativo: true
          }
        });
        
        if (!membership) {
          return res.status(403).json({ error: 'Acesso negado' });
        }
      }
      
      const {
        titulo,
        descricao,
        status,
        prioridade,
        responsavel,
        dataVencimento,
        estimativaHoras,
        progresso,
        etiquetas,
        cor,
        checklist
      } = req.body;
      
      // Se status mudou para concluída, definir data de conclusão
      let dataConclusao = tarefa.dataConclusao;
      if (status === 'concluida' && tarefa.status !== 'concluida') {
        dataConclusao = new Date();
      } else if (status !== 'concluida') {
        dataConclusao = null;
      }
      
      await tarefa.update({
        titulo,
        descricao,
        status,
        prioridade,
        responsavel,
        dataVencimento: dataVencimento || null,
        estimativaHoras: estimativaHoras || null,
        progresso: progresso || 0,
        etiquetas: etiquetas || [],
        cor,
        checklist: checklist || [],
        dataConclusao
      });
      
      // Buscar tarefa atualizada com relacionamentos
      const tarefaAtualizada = await Tarefa.findByPk(id, {
        include: [
          {
            model: Usuario,
            as: 'criador',
            attributes: ['id', 'nome', 'email']
          },
          {
            model: Usuario,
            as: 'responsavelTarefa',
            attributes: ['id', 'nome', 'email']
          },
          {
            model: Lista,
            as: 'lista',
            attributes: ['id', 'nome', 'cor']
          },
          {
            model: Projeto,
            as: 'projeto',
            attributes: ['id', 'nome', 'cor']
          }
        ]
      });
      
      res.json(tarefaAtualizada);
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
      res.status(500).json({ error: 'Erro ao atualizar tarefa' });
    }
  }
  
  // Mover tarefa entre listas
  async move(req, res) {
    const transaction = await sequelize.transaction();
    
    try {
      const { id } = req.params;
      const { listaId, ordem } = req.body;
      const userId = req.session.user.id;
      const isAdmin = req.session.user.role === 'admin';
      
      const tarefa = await Tarefa.findOne({
        where: { id, ativo: true }
      });
      
      if (!tarefa) {
        await transaction.rollback();
        return res.status(404).json({ error: 'Tarefa não encontrada' });
      }
      
      // Verificar acesso ao projeto
      if (!isAdmin) {
        const membership = await MembroProjeto.findOne({
          where: {
            projetoId: tarefa.projetoId,
            usuarioId: userId,
            ativo: true
          }
        });
        
        if (!membership) {
          await transaction.rollback();
          return res.status(403).json({ error: 'Acesso negado' });
        }
      }
      
      const listaOriginal = tarefa.listaId;
      
      // Se mudou de lista, reorganizar ordens
      if (listaOriginal !== listaId) {
        // Reorganizar lista original
        await Tarefa.update(
          {
            ordem: sequelize.literal('ordem - 1')
          },
          {
            where: {
              listaId: listaOriginal,
              ordem: { [Op.gt]: tarefa.ordem },
              ativo: true
            },
            transaction
          }
        );
        
        // Reorganizar lista destino
        await Tarefa.update(
          {
            ordem: sequelize.literal('ordem + 1')
          },
          {
            where: {
              listaId,
              ordem: { [Op.gte]: ordem },
              ativo: true
            },
            transaction
          }
        );
      } else {
        // Mesma lista, apenas reorganizar
        if (ordem > tarefa.ordem) {
          await Tarefa.update(
            {
              ordem: sequelize.literal('ordem - 1')
            },
            {
              where: {
                listaId,
                ordem: {
                  [Op.gt]: tarefa.ordem,
                  [Op.lte]: ordem
                },
                ativo: true
              },
              transaction
            }
          );
        } else if (ordem < tarefa.ordem) {
          await Tarefa.update(
            {
              ordem: sequelize.literal('ordem + 1')
            },
            {
              where: {
                listaId,
                ordem: {
                  [Op.gte]: ordem,
                  [Op.lt]: tarefa.ordem
                },
                ativo: true
              },
              transaction
            }
          );
        }
      }
      
      // Atualizar tarefa
      await tarefa.update({
        listaId,
        ordem
      }, { transaction });
      
      await transaction.commit();
      
      // Buscar tarefa atualizada
      const tarefaAtualizada = await Tarefa.findByPk(id, {
        include: [
          {
            model: Usuario,
            as: 'criador',
            attributes: ['id', 'nome', 'email']
          },
          {
            model: Usuario,
            as: 'responsavelTarefa',
            attributes: ['id', 'nome', 'email']
          },
          {
            model: Lista,
            as: 'lista',
            attributes: ['id', 'nome', 'cor']
          },
          {
            model: Projeto,
            as: 'projeto',
            attributes: ['id', 'nome', 'cor']
          }
        ]
      });
      
      res.json(tarefaAtualizada);
    } catch (error) {
      await transaction.rollback();
      console.error('Erro ao mover tarefa:', error);
      res.status(500).json({ error: 'Erro ao mover tarefa' });
    }
  }
  
  // Excluir tarefa (soft delete)
  async destroy(req, res) {
    try {
      const { id } = req.params;
      const userId = req.session.user.id;
      const isAdmin = req.session.user.role === 'admin';
      
      const tarefa = await Tarefa.findOne({
        where: { id, ativo: true }
      });
      
      if (!tarefa) {
        return res.status(404).json({ error: 'Tarefa não encontrada' });
      }
      
      // Verificar permissões
      if (!isAdmin && tarefa.criadoPor !== userId) {
        const membership = await MembroProjeto.findOne({
          where: {
            projetoId: tarefa.projetoId,
            usuarioId: userId,
            papel: { [Op.in]: ['admin', 'gerente'] },
            ativo: true
          }
        });
        
        if (!membership) {
          return res.status(403).json({ error: 'Acesso negado' });
        }
      }
      
      await tarefa.update({ ativo: false });
      
      res.json({ message: 'Tarefa excluída com sucesso' });
    } catch (error) {
      console.error('Erro ao excluir tarefa:', error);
      res.status(500).json({ error: 'Erro ao excluir tarefa' });
    }
  }
}

module.exports = new TarefasController();