// Força uso do banco SQLite correto
process.env.DB_DIALECT = 'sqlite';
process.env.DB_STORAGE = './nugecid_itep.sqlite';

const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');
const Usuario = require('../models/Usuario');
const Role = require('../models/Role');
const associations = require('../models/associations');
associations({ Usuario, Role });

(async () => {
  try {
    await sequelize.sync();
    // Remove admins antigos
    await Usuario.destroy({ where: { email: ['admin@localhost', 'admin@itep.local', 'admin@itep', 'admin@admin'] }, force: true });
    // Busca ou cria a role admin
    const [adminRole] = await Role.findOrCreate({ where: { nome: 'admin' } });
    // Cria ou atualiza o admin correto
    let usuario = await Usuario.findOne({ where: { email: 'admin' } });
    const senhaCriptografada = await bcrypt.hash('admin', 10);
    if (usuario) {
      usuario.senha = senhaCriptografada;
      usuario.roleId = adminRole.id;
      usuario.nome = 'Administrador';
      await usuario.save();
      console.log('Usuário admin atualizado com sucesso!');
    } else {
      usuario = await Usuario.create({
        nome: 'Administrador',
        email: 'admin',
        senha: senhaCriptografada,
        roleId: adminRole.id
      });
      console.log('Usuário admin criado com sucesso!');
    }
    console.log('Email: admin');
    console.log('Senha: admin');
    console.log('Role: admin');
  } catch (error) {
    console.error('Erro ao corrigir usuário admin:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
})(); 