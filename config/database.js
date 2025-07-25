const { Sequelize } = require('sequelize');
const path = require('path');

let sequelize;
if ((process.env.DB_DIALECT || '').toLowerCase() === 'sqlite') {
  const dbPath = path.resolve(__dirname, '../nugecid_itep.sqlite');
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: {
      // Otimizações para SQLite
      options: {
        encrypt: false,
        enableArithAbort: false
      }
    },
    define: {
      timestamps: true,
      underscored: false,
      freezeTableName: true
    }
  });
} else {
  const dialect = process.env.DB_DIALECT || 'postgres';
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      dialect,
      logging: false,
      pool: {
        max: 20,
        min: 5,
        acquire: 60000,
        idle: 10000
      },
      dialectOptions: {
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci',
        ssl: process.env.DB_SSL === 'true' ? {
          require: true,
          rejectUnauthorized: false
        } : false,
        connectTimeout: 60000,
        acquireTimeout: 60000,
        timeout: 60000,
        socketPath: process.env.DB_SOCKET_PATH || undefined
      },
      define: {
        timestamps: true,
        underscored: false,
        freezeTableName: true
      },
      retry: {
        match: [
          /ETIMEDOUT/,
          /EHOSTUNREACH/,
          /ECONNRESET/,
          /ECONNREFUSED/,
          /ETIMEDOUT/,
          /ESOCKETTIMEDOUT/,
          /EHOSTUNREACH/,
          /EPIPE/,
          /EAI_AGAIN/,
          /SequelizeConnectionError/,
          /SequelizeConnectionRefusedError/,
          /SequelizeHostNotFoundError/,
          /SequelizeHostNotReachableError/,
          /SequelizeInvalidConnectionError/,
          /SequelizeConnectionTimedOutError/
        ],
        max: 3
      }
    }
  );
}

module.exports = { sequelize };
