const indexName = 'Desarquivamentos_numDocumento_unique';

module.exports = {
  async up (queryInterface, Sequelize) {
    // Remove unique index/constraint on numDocumento
    try {
      await queryInterface.removeIndex('Desarquivamentos', ['numDocumento']);
    } catch (err) {
      // Fallback: try removeConstraint (for Postgres etc.)
      try {
        await queryInterface.removeConstraint('Desarquivamentos', indexName);
      } catch (e) {
        // Index might not exist; ignore
      }
    }
  },

  async down (queryInterface, Sequelize) {
    // Recreate unique index on numDocumento
    await queryInterface.addIndex('Desarquivamentos', ['numDocumento'], {
      name: indexName,
      unique: true
    });
  }
}; 