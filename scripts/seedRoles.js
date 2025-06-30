// Script para popular a tabela roles e atualizar usuários existentes
process.env.DB_DIALECT = 'sqlite';
process.env.DB_STORAGE = './nugecid_itep.sqlite';
const { sequelize } = require('../config/database');
const Role = require('../models/Role');
const Usuario = require('../models/Usuario');

async function seedRolesAndUsers() {
  await sequelize.sync();
  // Cria roles se não existirem
  const roles = ['admin', 'tecnico', 'auditor'];
  for (const nome of roles) {
    await Role.findOrCreate({ where: { nome } });
  }
  // Pega o id do role tecnico
  const tecnicoRole = await Role.findOne({ where: { nome: 'tecnico' } });
  // Atualiza todos usuários sem roleId para tecnico
  await Usuario.update({ roleId: tecnicoRole.id }, { where: { roleId: null } });
  console.log('Roles populados e usuários atualizados.');
  process.exit(0);
}

seedRolesAndUsers();
