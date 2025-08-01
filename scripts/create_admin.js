require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');
const Usuario = require('../models/Usuario');
require('../models/associations');

// Função para validar senha forte
function validarSenha(senha) {
  const minLength = 8;
  const temMaiuscula = /[A-Z]/.test(senha);
  const temMinuscula = /[a-z]/.test(senha);
  const temNumero = /[0-9]/.test(senha);
  const temEspecial = /[!@#$%^&*(),.?":{}|<>]/.test(senha);

  if (senha.length < minLength) {
    throw new Error('A senha deve ter pelo menos 8 caracteres');
  }
  if (!temMaiuscula || !temMinuscula) {
    throw new Error('A senha deve conter letras maiúsculas e minúsculas');
  }
  if (!temNumero) {
    throw new Error('A senha deve conter números');
  }
  if (!temEspecial) {
    throw new Error('A senha deve conter caracteres especiais');
  }
}

process.env.DB_DIALECT = 'sqlite';
process.env.DB_STORAGE = './nugecid_itep.sqlite';

(async () => {
  try {
    await sequelize.sync();
    
    // Busca ou cria a role admin
    const [adminRole] = await require('../models/Role').findOrCreate({ where: { nome: 'admin' } });

    // Busca usuário admin pelo email 'admin'
    let usuario = await Usuario.findOne({ where: { email: 'admin' } });
    const senhaCriptografada = await bcrypt.hash('admin', 10);

    if (usuario) {
      // Atualiza senha e roleId se já existir
      usuario.senha = senhaCriptografada;
      usuario.roleId = adminRole.id;
      usuario.nome = 'Administrador';
      await usuario.save();
      console.log('Usuário admin atualizado com sucesso!');
    } else {
      // Cria novo usuário admin
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
    console.error('Erro ao criar/atualizar usuário admin:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
})();
