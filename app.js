require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');

const path = require('path');
const i18n = require('i18n');
const expressLayouts = require('express-ejs-layouts');
const methodOverride = require('method-override');
const { sequelize } = require('./config/database');
const cleanupJob = require('./jobs/cleanup');
const startCleanupTrashJob = require('./jobs/cleanupTrash');
const { ensureAuthenticated } = require('./middlewares/auth');

const app = express();

// --- CONFIGURAÇÃO DO APP (MIDDLEWARES, VIEWS, ETC.) ---
require('./config/i18n')(app);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(methodOverride('_method'));

// 1. Cookie Parser - DEVE VIR ANTES da session.

app.use(cookieParser(process.env.COOKIE_SECRET || 'seu-segredo-super-secreto-para-cookies'));

// 2. Session - Usa os cookies, então vem depois do cookieParser.
app.use(session({
  secret: process.env.SESSION_SECRET || 'itep2025',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 15 * 60 * 1000 } // 15 minutos
}));

// 3. CSRF - Proteção com a nova biblioteca csrf-sync.
const { csrfProtection, addCsrfTokenToLocals, invalidCsrfTokenError } = require('./middleware/csrf');

// 4. Flash Messages - Depende da session.
app.use(flash());

app.use(expressLayouts);

// Middleware para disponibilizar variáveis globais para as views
app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.user = req.session.user;
  next();
});

// Adiciona o token CSRF a todas as respostas para que esteja disponível nas views.
app.use(addCsrfTokenToLocals);
app.set('layout', 'layout');
app.set('view engine', 'ejs');
app.set('views', [
  path.join(__dirname, 'views'),
  path.join(__dirname, 'modules/nugecid/views')
]);

// --- FUNÇÃO DE STARTUP ASYNC ---
async function startServer() {
  try {
    console.log('Authenticating with the database...');
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');

    console.log('Loading models and associations...');
    // O arquivo ./models/index.js agora carrega os modelos e também aplica todas as associações.
    const db = require('./models');

    console.log('Synchronizing database...');
    await sequelize.sync({ force: false });
    console.log('Database synchronized successfully.');

    // --- MIDDLEWARES GLOBAIS (após config inicial) ---
    app.use((req, res, next) => {
      res.locals.success_msg = req.flash('success_msg');
      res.locals.error_msg = req.flash('error_msg');
      res.locals.currentUser = req.session.user;
      res.locals.__ = res.__;
      next();
    });

    // --- ROTAS (carregadas após o DB estar pronto) ---
    console.log('Loading routes...');
    app.use('/', require('./routes/index'));
    app.use('/auth', require('./routes/auth'));
    app.use('/usuarios', require('./routes/usuarios'));
    app.use('/movimentacoes', require('./routes/movimentacoes'));
    app.use('/custodia-vestigios', require('./routes/custodia_vestigios'));
    app.use('/dashboard', require('./routes/dashboard'));
    app.use('/importacao', require('./routes/importacao'));
    app.use('/relatorios', require('./routes/relatorios'));
    app.use('/publicacoes', require('./routes/publicacoes.routes.js'));

    // Rotas de importação (sem CSRF global, pois é tratado na própria rota)
    app.use('/nugecid/desarquivamento/importar', require('./modules/nugecid/routes/desarquivamento.import.routes'));

    // Aplica a proteção CSRF a todas as rotas que vêm a seguir.
    // Rotas que não devem ser protegidas (ex: APIs sem estado) devem ser declaradas ANTES desta linha.
    app.use(csrfProtection);

    // Rotas do Módulo NUGECID (agora consolidadas)
    app.use('/nugecid', require('./routes/nugecid.routes.js'));
    app.use('/api/export', require('./routes/api/export'));
    app.use('/api/v1/auth', require('./routes/api/auth'));
    app.use('/api/v1/custodia-vestigios', require('./routes/custodia_vestigios/api'));
    app.use('/api/v1/movimentacoes', require('./routes/movimentacoes'));
    app.use('/api/v1/usuarios', require('./routes/usuarios'));
    app.use('/api/v1/importacao', require('./routes/importacao'));
    app.use('/api/v1/relatorios', require('./routes/relatorios'));
    app.use('/api/v1/dashboard', require('./routes/dashboard'));
    console.log('Routes loaded successfully.');

    // Rotas da API
    const vestigiosApiRoutes = require('./routes/api/vestigios');
    const dashboardApiRoutes = require('./routes/api/dashboard');
    const authApiRoutes = require('./routes/api/auth');
    const exportApiRoutes = require('./routes/api/export');
    const notificationsApiRoutes = require('./routes/api/notifications');
    const pythonServicesApiRoutes = require('./routes/api/python_services');

    // API Endpoints
    app.use('/api/vestigios', ensureAuthenticated, vestigiosApiRoutes);
    app.use('/api/dashboard', ensureAuthenticated, dashboardApiRoutes);
    app.use('/api/auth', authApiRoutes);
    app.use('/api/export', ensureAuthenticated, exportApiRoutes);
    app.use('/api/notifications', notificationsApiRoutes);
    app.use('/api/python', ensureAuthenticated, pythonServicesApiRoutes);

    // --- HANDLER 404 ---
    app.use((req, res) => {
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'Endpoint não encontrado' });
      }
      res.status(404).render('404');
    });

    // Tratamento de erro específico para CSRF inválido (DEVE SER DEPOIS DAS ROTAS)
    app.use((err, req, res, next) => {
      if (err === invalidCsrfTokenError) {
        console.warn('CSRF Token inválido detectado para a rota:', req.path);
        req.flash('error_msg', 'Sua sessão expirou ou o formulário é inválido. Por favor, tente novamente.');
        res.status(403).redirect(req.get('Referrer') || '/');
      } else {
        next(err);
      }
    });

    // --- INICIAR SERVIDOR ---
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`Server is running at http://localhost:${PORT}`);
      cleanupJob.start();
      startCleanupTrashJob();
      try {
        import('open').then(({ default: open }) => {
          open(`http://localhost:${PORT}`);
        });
      } catch (error) {
        console.error('Could not open browser:', error);
      }
    });

  } catch (error) {
    console.error('Failed to start the server:', error);
    process.exit(1);
  }
}

// --- EXECUTAR A FUNÇÃO DE STARTUP ---
startServer();
