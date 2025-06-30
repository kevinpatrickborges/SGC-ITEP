const Usuario = require('../models/Usuario');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

// Armazenamento simples de refresh tokens (memória)
const refreshTokens = new Set();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refreshsecret';
const JWT_EXPIRES_IN = '1h';
const JWT_REFRESH_EXPIRES_IN = '7d';

/** Exibe tela de login */
exports.getLogin = async (req, res) => {
  // Cria admin padrão se não existir nenhum usuário
  const Usuario = require('../models/Usuario');
  const bcrypt = require('bcryptjs');
  const count = await Usuario.count();
  if (count === 0) {
    const hash = await bcrypt.hash('admin', 10);
    await Usuario.create({ nome: 'Administrador', matricula: 'admin', email: 'admin@localhost', senha: hash, perfil: 'admin' });
  }
  res.render('auth/login', {
    title: res.__('Login'),
    locale: req.getLocale(),
    layout: 'login_layout'
  });
};

/** Exibe tela de cadastro */
exports.getRegister = (req, res) => {
  res.render('auth/register', {
    title: 'Cadastro de Usuário'
  });
};

/** Processa cadastro de usuário */
exports.postRegister = async (req, res) => {
  // DEBUG: Log do token CSRF, cookies e sessão no POST de registro
  console.log('POST /auth/register - Body:', req.body);
  console.log('POST /auth/register - Cookies:', req.headers.cookie);
  console.log('POST /auth/register - Sessão:', req.session);
  // O token enviado pelo form estará em req.body._csrf
  console.log('POST /auth/register - CSRF recebido:', req.body._csrf);

  const Usuario = require('../models/Usuario');
  const bcrypt = require('bcryptjs');
  const { nome, email, senha, perfil } = req.body;
  if (!nome || !email || !senha) {
    return res.render('auth/register', { error_msg: 'Preencha todos os campos.' });
  }
  if (senha.length < 4) {
    return res.render('auth/register', { error_msg: 'A senha deve ter pelo menos 4 caracteres.' });
  }
  const exists = await Usuario.findOne({ where: { email } });
  if (exists) {
    return res.render('auth/register', { error_msg: 'E-mail já cadastrado.' });
  }
  const hash = await bcrypt.hash(senha, 10);
  await Usuario.create({ nome, email, senha: hash, perfil });
  res.render('auth/register', { success_msg: 'Usuário criado com sucesso!' });
};

/** Processa login */
exports.postLogin = async (req, res) => {
  const Usuario = require('../models/Usuario');
  const bcrypt = require('bcryptjs');
  const { matricula, senha } = req.body;
  let user = null;

  if (typeof matricula === 'string' && matricula.trim() !== '') {
    user = await Usuario.findOne({ where: { matricula: matricula.trim() } });
    if (!user) {
      user = await Usuario.findOne({ where: { email: matricula.trim() } });
    }
  }

  // DEBUG LOGS
  console.log('Tentativa de login:', matricula, senha);
  console.log('Usuário encontrado:', user);

  if (!user || !user.senha) {
    return res.render('auth/login', { error_msg: 'Usuário não encontrado.', layout: 'login_layout' });
  }

  const senhaCorreta = await bcrypt.compare(senha || '', user.senha);
  console.log('Senha correta?', senhaCorreta);

  if (!senhaCorreta) {
    return res.render('auth/login', { error_msg: 'Senha incorreta.', layout: 'login_layout' });
  }

  req.session.user = {
    id: user.id,
    nome: user.nome,
    perfil: user.perfil,
    roleId: user.roleId || null,
    role: user.perfil // Garante compatibilidade total com o middleware
  };
  req.session.ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || null;
  req.session.lastPing = Date.now();

  // Gerar token JWT para sessão
  const payload = { id: user.id, nome: user.nome, perfil: user.perfil };
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  console.log('Token JWT gerado:', accessToken);
  req.session.token = accessToken;
  
  // Gerar script para armazenar token no localStorage
  const tokenScript = `
    <script>
      localStorage.setItem('token', '${accessToken}');
      window.location.href = '/dashboard';
    </script>
  `;
  
  // Renderiza o script para armazenar o token
  res.send(tokenScript);
};


/** Logout */
exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/auth/login');
  });
};

/**
 * API RESTful: Login (JWT)
 * POST /api/v1/auth/login
 * Body: { email, senha }
 * Response: { accessToken, refreshToken }
 */
exports.apiLogin = async (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
  }
  const user = await Usuario.findOne({ where: { email } });
  if (!user || !user.senha) {
    return res.status(401).json({ error: 'Usuário não encontrado.' });
  }
  const senhaCorreta = await bcrypt.compare(senha, user.senha);
  if (!senhaCorreta) {
    return res.status(401).json({ error: 'Senha incorreta.' });
  }
  const payload = { id: user.id, nome: user.nome, perfil: user.perfil };
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });
  refreshTokens.add(refreshToken);
  res.json({ accessToken, refreshToken, perfil: user.perfil, nome: user.nome });
};

/**
 * API RESTful: Refresh Token
 * POST /api/v1/auth/refresh
 * Body: { refreshToken }
 * Response: { accessToken }
 */
exports.apiRefreshToken = (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken || !refreshTokens.has(refreshToken)) {
    return res.status(401).json({ error: 'Refresh token inválido.' });
  }
  try {
    const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    const newAccessToken = jwt.sign({ id: payload.id, nome: payload.nome, perfil: payload.perfil }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    res.json({ accessToken: newAccessToken });
  } catch (err) {
    return res.status(401).json({ error: 'Refresh token expirado ou inválido.' });
  }
};

/**
 * API RESTful: Logout
 * POST /api/v1/auth/logout
 * Body: { refreshToken }
 */
exports.apiLogout = (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) refreshTokens.delete(refreshToken);
  res.json({ success: true });
};
