// Força uso do banco SQLite correto
process.env.DB_DIALECT = 'sqlite';
process.env.DB_STORAGE = './nugecid_itep.sqlite';

const { sequelize } = require('../config/database');
const Usuario = require('../models/Usuario');
const Role = require('../models/Role');
const associations = require('../models/associations');

(async () => {
  try {
    await sequelize.sync();
    associations({ Usuario, Role });
    const usuarios = await Usuario.findAll({
      include: [{ model: Role, as: 'role' }],
      paranoid: false
    });
    console.log('Usuários encontrados:');
    usuarios.forEach(u => {
      const user = u.toJSON();
      console.log({
        id: user.id,
        nome: user.nome,
        email: user.email,
        roleId: user.roleId,
        role: user.role ? user.role.nome : null
      });
    });
    // Listar todas as roles
    const roles = await Role.findAll();
    console.log('Roles existentes:');
    roles.forEach(r => {
      const role = r.toJSON();
      console.log({ id: role.id, nome: role.nome });
    });
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
})(); 