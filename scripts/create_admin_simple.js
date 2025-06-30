const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');
const Usuario = require('../models/Usuario');

(async () => {
  await sequelize.sync();
  const senhaCriptografada = await bcrypt.hash('admin', 10);
  const [user, created] = await Usuario.findOrCreate({
    where: { email: 'admin' },
    defaults: {
      nome: 'Administrador',
      email: 'admin',
      senha: senhaCriptografada,
      perfil: 'admin'
    }
  });
  if (created) {
    console.log('Usuário admin criado com sucesso!');
  } else {
    console.log('Usuário admin já existe.');
  }
  process.exit();
})();
