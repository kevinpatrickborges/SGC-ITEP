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

(async () => {
  try {
    await sequelize.sync();
    
    // Verifica se já existe um admin
    const adminExistente = await Usuario.findOne({
      where: { email: 'admin@itep.local' }
    });

    if (adminExistente) {
      console.log('Usuário admin já existe. Para redefinir a senha, use o script de reset de senha.');
      process.exit(0);
    }

    // Gera senha aleatória forte
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
    let senha = '';
    for (let i = 0; i < 12; i++) {
      senha += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }

    // Valida a senha gerada
    validarSenha(senha);

    const senhaCriptografada = await bcrypt.hash(senha, 12); // Aumentado para 12 rounds

    const [user, created] = await Usuario.findOrCreate({
      where: { email: 'admin@itep.local' },
      defaults: {
        nome: 'Administrador',
        email: 'admin@itep.local',
        senha: senhaCriptografada,
        perfil: 'admin'
      }
    });

    if (created) {
      console.log('=== USUÁRIO ADMIN CRIADO COM SUCESSO ===');
      console.log('Email: admin@itep.local');
      console.log('Senha:', senha);
      console.log('IMPORTANTE: Guarde esta senha em um local seguro!');
      console.log('=======================================');
    } else {
      console.log('Usuário admin já existe.');
    }
  } catch (error) {
    console.error('Erro ao criar usuário admin:', error.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
})();
