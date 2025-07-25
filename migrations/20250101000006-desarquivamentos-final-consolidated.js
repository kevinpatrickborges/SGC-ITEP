'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Esta migração consolida todas as alterações da tabela Desarquivamentos
    // Substitui as migrações incrementais por uma estrutura final otimizada
    
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Verificar se a tabela já existe
      const tableExists = await queryInterface.sequelize.query(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='Desarquivamentos';",
        { transaction }
      );
      
      if (tableExists[0].length > 0) {
        console.log('Tabela Desarquivamentos já existe. Pulando criação.');
        await transaction.commit();
        return;
      }
      
      // Criar tabela com estrutura final consolidada
      await queryInterface.createTable('Desarquivamentos', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
          allowNull: false
        },
        status: {
          type: Sequelize.ENUM(
            'Finalizado',
            'Desarquivado', 
            'Não coletado',
            'Solicitado',
            'Rearquivamento solicitado',
            'Retirado pelo setor',
            'Não localizado'
          ),
          defaultValue: 'Solicitado',
          allowNull: true
        },
        nomeCompleto: {
          type: Sequelize.STRING,
          allowNull: false,
          comment: 'Nome completo do solicitante'
        },
        numDocumento: {
          type: Sequelize.STRING,
          allowNull: false,
          comment: 'Número do documento/prontuário'
          // Removido unique constraint conforme migração 20250704130000
        },
        numProcesso: {
          type: Sequelize.STRING,
          allowNull: true,
          comment: 'Número do processo relacionado'
        },
        tipoDocumento: {
          type: Sequelize.STRING,
          allowNull: true,
          comment: 'Tipo do documento (Laudo, Prontuário, etc.)'
        },
        dataSolicitacao: {
          type: Sequelize.DATE,
          allowNull: false,
          comment: 'Data da solicitação de desarquivamento'
        },
        dataDesarquivamento: {
          type: Sequelize.DATE,
          allowNull: true,
          comment: 'Data efetiva do desarquivamento'
        },
        dataDevolucao: {
          type: Sequelize.DATE,
          allowNull: true,
          comment: 'Data de devolução do documento'
        },
        dataPrazoDevolucao: {
          type: Sequelize.DATE,
          allowNull: true,
          comment: 'Data limite para devolução'
        },
        setorDemandante: {
          type: Sequelize.STRING,
          allowNull: true, // Conforme migração 20250717102500
          comment: 'Setor que solicitou o desarquivamento'
        },
        servidorResponsavel: {
          type: Sequelize.STRING,
          allowNull: true,
          comment: 'Servidor responsável pelo desarquivamento'
        },
        finalidade: {
          type: Sequelize.TEXT,
          allowNull: true, // Conforme migração 20250630144752
          comment: 'Finalidade do desarquivamento'
        },
        solicitacao: {
          type: Sequelize.TEXT,
          allowNull: true,
          comment: 'Detalhes da solicitação'
        },
        numNic: {
          type: Sequelize.STRING,
          allowNull: true,
          comment: 'Número NIC relacionado'
        },
        solicitacaoProrrogacao: {
          type: Sequelize.TEXT,
          allowNull: true,
          comment: 'Solicitação de prorrogação'
        },
        createdBy: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'Usuarios',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
          comment: 'Usuário que criou o registro'
        },
        updatedBy: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'Usuarios',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
          comment: 'Usuário que atualizou o registro'
        },
        deletedBy: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'Usuarios',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
          comment: 'Usuário que deletou o registro'
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false
        },
        deletedAt: {
          type: Sequelize.DATE,
          allowNull: true,
          comment: 'Data de exclusão lógica (paranoid)'
        }
      }, {
        transaction,
        comment: 'Tabela consolidada para controle de desarquivamentos - NUGECID'
      });
      
      // Criar índices para otimização de consultas
      await queryInterface.addIndex('Desarquivamentos', ['status'], {
        name: 'idx_desarquivamentos_status',
        transaction
      });
      
      await queryInterface.addIndex('Desarquivamentos', ['dataSolicitacao'], {
        name: 'idx_desarquivamentos_data_solicitacao',
        transaction
      });
      
      await queryInterface.addIndex('Desarquivamentos', ['numDocumento'], {
        name: 'idx_desarquivamentos_num_documento',
        transaction
      });
      
      await queryInterface.addIndex('Desarquivamentos', ['setorDemandante'], {
        name: 'idx_desarquivamentos_setor_demandante',
        transaction
      });
      
      await queryInterface.addIndex('Desarquivamentos', ['createdBy'], {
        name: 'idx_desarquivamentos_created_by',
        transaction
      });
      
      await queryInterface.addIndex('Desarquivamentos', ['deletedAt'], {
        name: 'idx_desarquivamentos_deleted_at',
        transaction
      });
      
      await transaction.commit();
      console.log('Tabela Desarquivamentos criada com estrutura consolidada.');
      
    } catch (error) {
      await transaction.rollback();
      console.error('Erro na migração consolidada:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.dropTable('Desarquivamentos', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};