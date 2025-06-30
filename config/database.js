const { Sequelize } = require('sequelize');

let sequelize;
if ((process.env.DB_DIALECT || '').toLowerCase() === 'sqlite') {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: process.env.DB_STORAGE || './nugecid_itep.sqlite',
    logging: false
  });
} else {
  const dialect = process.env.DB_DIALECT || 'mysql';
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      dialect,
      logging: false
    }
  );
}

module.exports = { sequelize };
