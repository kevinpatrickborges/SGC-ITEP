'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // The recommended workaround for SQLite limitations with foreign keys and altering columns.
      await queryInterface.sequelize.query('PRAGMA foreign_keys=off;', { transaction });

      await queryInterface.renameTable('Desarquivamentos', 'Desarquivamentos_backup', { transaction });

      await queryInterface.createTable('Desarquivamentos', {
        id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
        tipoDesarquivamento: { type: Sequelize.ENUM('Físico', 'Digital', 'Não Localizado'), allowNull: false },
        status: { type: Sequelize.ENUM('Finalizado', 'Desarquivado', 'Não coletado', 'Solicitado', 'Rearquivamento solicitado', 'Retirado pelo setor', 'Não localizado'), defaultValue: 'Solicitado' },
        nomeCompleto: { type: Sequelize.STRING, allowNull: false },
        numDocumento: { type: Sequelize.STRING, allowNull: false, unique: true },
        numProcesso: { type: Sequelize.STRING, allowNull: true },
        tipoDocumento: { type: Sequelize.STRING, allowNull: true },
        dataSolicitacao: { type: Sequelize.DATE, allowNull: false },
        dataDesarquivamento: { type: Sequelize.DATE, allowNull: true },
        dataDevolucao: { type: Sequelize.DATE, allowNull: true },
        setorDemandante: { type: Sequelize.STRING, allowNull: false },
        servidorResponsavel: { type: Sequelize.STRING, allowNull: true },
        finalidade: { type: Sequelize.TEXT, allowNull: true }, 
        prazoSolicitado: { type: Sequelize.STRING, allowNull: true },
        createdBy: { type: Sequelize.INTEGER, references: { model: 'Usuarios', key: 'id' } },
        updatedBy: { type: Sequelize.INTEGER, references: { model: 'Usuarios', key: 'id' } },
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false },
        deletedAt: { type: Sequelize.DATE, allowNull: true }
      }, { transaction });

      const columns = 'id, tipoDesarquivamento, status, nomeCompleto, numDocumento, numProcesso, tipoDocumento, dataSolicitacao, dataDesarquivamento, dataDevolucao, setorDemandante, servidorResponsavel, finalidade, prazoSolicitado, createdBy, updatedBy, createdAt, updatedAt, deletedAt';
      await queryInterface.sequelize.query(
        `INSERT INTO Desarquivamentos (${columns}) SELECT ${columns} FROM Desarquivamentos_backup;`,
        { transaction }
      );

      await queryInterface.dropTable('Desarquivamentos_backup', { transaction });

      await queryInterface.sequelize.query('PRAGMA foreign_keys=on;', { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error('Migration failed:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query('PRAGMA foreign_keys=off;', { transaction });

      await queryInterface.sequelize.query(
        "UPDATE Desarquivamentos SET finalidade = 'N/A' WHERE finalidade IS NULL;",
        { transaction }
      );

      await queryInterface.renameTable('Desarquivamentos', 'Desarquivamentos_backup_down', { transaction });

      await queryInterface.createTable('Desarquivamentos', {
        id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
        tipoDesarquivamento: { type: Sequelize.ENUM('Físico', 'Digital', 'Não Localizado'), allowNull: false },
        status: { type: Sequelize.ENUM('Finalizado', 'Desarquivado', 'Não coletado', 'Solicitado', 'Rearquivamento solicitado', 'Retirado pelo setor', 'Não localizado'), defaultValue: 'Solicitado' },
        nomeCompleto: { type: Sequelize.STRING, allowNull: false },
        numDocumento: { type: Sequelize.STRING, allowNull: false, unique: true },
        numProcesso: { type: Sequelize.STRING, allowNull: true },
        tipoDocumento: { type: Sequelize.STRING, allowNull: true },
        dataSolicitacao: { type: Sequelize.DATE, allowNull: false },
        dataDesarquivamento: { type: Sequelize.DATE, allowNull: true },
        dataDevolucao: { type: Sequelize.DATE, allowNull: true },
        setorDemandante: { type: Sequelize.STRING, allowNull: false },
        servidorResponsavel: { type: Sequelize.STRING, allowNull: true },
        finalidade: { type: Sequelize.TEXT, allowNull: false }, 
        prazoSolicitado: { type: Sequelize.STRING, allowNull: true },
        createdBy: { type: Sequelize.INTEGER, references: { model: 'Usuarios', key: 'id' } },
        updatedBy: { type: Sequelize.INTEGER, references: { model: 'Usuarios', key: 'id' } },
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false },
        deletedAt: { type: Sequelize.DATE, allowNull: true }
      }, { transaction });

      const columns = 'id, tipoDesarquivamento, status, nomeCompleto, numDocumento, numProcesso, tipoDocumento, dataSolicitacao, dataDesarquivamento, dataDevolucao, setorDemandante, servidorResponsavel, finalidade, prazoSolicitado, createdBy, updatedBy, createdAt, updatedAt, deletedAt';
      await queryInterface.sequelize.query(
        `INSERT INTO Desarquivamentos (${columns}) SELECT ${columns} FROM Desarquivamentos_backup_down;`,
        { transaction }
      );

      await queryInterface.dropTable('Desarquivamentos_backup_down', { transaction });
      await queryInterface.sequelize.query('PRAGMA foreign_keys=on;', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error('Reverting migration failed:', error);
      throw error;
    }
  }
};
