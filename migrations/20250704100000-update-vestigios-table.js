'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Devido a limitações do SQLite, a melhor abordagem é recriar a tabela.
    
    // 1. Criar a nova tabela com a estrutura correta
    await queryInterface.createTable('vestigios_new', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      codigo: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, allowNull: false, unique: true },
      tipo: { type: Sequelize.STRING, allowNull: false },
      numeroLaudo: { type: Sequelize.STRING, allowNull: false },
      numeroProcesso: { type: Sequelize.STRING, allowNull: true },
      descricao: { type: Sequelize.TEXT, allowNull: false },
      origem: { type: Sequelize.STRING, allowNull: false },
      dataEntrada: { type: Sequelize.DATE, allowNull: false },
      responsavelNome: { type: Sequelize.STRING, allowNull: false },
      responsavelMatricula: { type: Sequelize.STRING, allowNull: false },
      status: { type: Sequelize.ENUM('em_custodia','em_analise','transferido','arquivado','destruido'), defaultValue: 'em_custodia' },
      catalogacao: { type: Sequelize.STRING, allowNull: true },
      arquivoNome: { type: Sequelize.STRING, allowNull: true },
      arquivoMime: { type: Sequelize.STRING, allowNull: true },
      arquivoDados: { type: Sequelize.BLOB('long'), allowNull: true },
      anexos: { type: Sequelize.JSON, allowNull: true },
      codigoNicho: { type: Sequelize.STRING, allowNull: true },
      localizacaoId: {
        type: Sequelize.INTEGER,
        references: { model: 'localizacoes', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE },
      deletedAt: { type: Sequelize.DATE }
    });

    // 2. Copiar dados da tabela antiga para a nova
    await queryInterface.sequelize.query(`
      INSERT INTO vestigios_new (id, tipo, descricao, origem, dataEntrada, responsavelNome, localizacaoId, createdAt, updatedAt, deletedAt, codigo, numeroLaudo)
      SELECT id, tipo, descricao, origem, data_entrada, responsavel, localizacaoId, createdAt, updatedAt, deletedAt,
      (SELECT substr(hex(randomblob(4)), 1, 8) || '-' || substr(hex(randomblob(2)), 1, 4) || '-4' || substr(hex(randomblob(2)), 2, 3) || '-' || substr('89ab', 1 + (abs(random()) % 4), 1) || substr(hex(randomblob(2)), 2, 3) || '-' || substr(hex(randomblob(6)), 1, 12)),
      'N/A'
      FROM vestigios;
    `);
    
    // 3. Deletar a tabela antiga
    await queryInterface.dropTable('vestigios');

    // 4. Renomear a nova tabela
    await queryInterface.renameTable('vestigios_new', 'vestigios');
  },

  down: async (queryInterface, Sequelize) => {
    // Para reverter, precisaríamos fazer o processo inverso,
    // mas isso pode levar à perda de dados das novas colunas.
    // O mais seguro é simplesmente dropar a tabela e recriar com a estrutura antiga.
    await queryInterface.dropTable('vestigios');
    await queryInterface.createTable('vestigios', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        tipo: { type: Sequelize.STRING(100), allowNull: false },
        descricao: { type: Sequelize.TEXT, allowNull: true },
        origem: { type: Sequelize.STRING(100), allowNull: false },
        data_entrada: { type: Sequelize.DATE, allowNull: true },
        responsavel: { type: Sequelize.STRING(100), allowNull: true },
        localizacaoId: {
          type: Sequelize.INTEGER,
          references: { model: 'localizacoes', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        createdAt: { allowNull: false, type: Sequelize.DATE },
        updatedAt: { allowNull: false, type: Sequelize.DATE },
        deletedAt: { type: Sequelize.DATE }
      });
  }
}; 