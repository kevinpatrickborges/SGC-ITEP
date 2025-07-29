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

// Novos middlewares de melhoria
const { applyPerformanceOptimizations } = require('./middleware/performance');
const { globalErrorHandler, notFoundHandler, handleUncaughtException, handleUnhandledRejection } = require('./middleware/errorHandler');
const { auditarAutenticacao } = require('./middleware/auditoria');

const app = express();

// Configurar handlers de erro não capturado
handleUncaughtException();
handleUnhandledRejection();

// --- CONFIGURAÇÃO DO APP (MIDDLEWARES, VIEWS, ETC.) ---
// Aplicar otimizações de performance primeiro
applyPerformanceOptimizations(app);

require('./config/i18n')(app);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

// 1. Cookie Parser - DEVE VIR ANTES da session.

app.use(cookieParser(process.env.COOKIE_SECRET || 'seu-segredo-super-secreto-para-cookies'));

// 2. Session - Usa os cookies, então vem depois do cookieParser.
app.use(session({
  secret: process.env.SESSION_SECRET || 'itep2025',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 2 * 60 * 60 * 1000 } // 2 horas
}));

// 3. CSRF - Proteção com a nova biblioteca csrf-sync.
const { csrfProtection, addCsrfTokenToLocals, invalidCsrfTokenError } = require('./middleware/csrf');

// 4. Flash Messages - Depende da session.
app.use(flash());

app.use(expressLayouts);

// Middleware para definir req.user baseado na sessão
app.use((req, res, next) => {
  if (req.session && req.session.user) {
    req.user = req.session.user;
  }
  next();
});

// Middleware de debug GLOBAL para todas as requisições /projetos
app.use((req, res, next) => {
  if (req.originalUrl.startsWith('/projetos')) {
    console.log(`🌍 GLOBAL DEBUG: ${req.method} ${req.originalUrl}`);
    console.log('📋 Body:', req.body);
    console.log('🔑 Method Override:', req.body._method);
    console.log('👤 User:', req.user ? req.user.id : 'undefined');
    console.log('🔍 Headers:', req.headers);
  }
  next();
});



// Middleware para disponibilizar variáveis globais para as views
app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.user = req.session.user;
  res.locals.currentUser = req.session.user;
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
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
      res.locals.__ = res.__;
      next();
    });

    // --- ROTAS (carregadas após o DB estar pronto) ---
    console.log('Loading routes...');
    
    // Rotas que NÃO precisam de CSRF (devem vir ANTES da proteção CSRF)
    app.use('/', require('./routes/index'));
    
    // Rotas de importação (sem CSRF global, pois é tratado na própria rota)
    app.use('/nugecid/desarquivamento/importar', require('./modules/nugecid/routes/desarquivamento.import.routes'));

    // Rotas que precisam de CSRF mas com tratamento especial
    app.use('/viewer', require('./routes/viewer.js'));

    // Middleware de debug removido - usando apenas o global
    
    // Aplica a proteção CSRF a todas as rotas que vêm a seguir.
    // Rotas que não devem ser protegidas (ex: APIs sem estado) devem ser declaradas ANTES desta linha.
    app.use(csrfProtection);
    
    // Rotas que PRECISAM de CSRF (devem vir DEPOIS da proteção CSRF)
    app.use('/auth', require('./routes/auth'));
    
    app.use('/usuarios', require('./routes/usuarios'));
    app.use('/dashboard', require('./routes/dashboard'));
    app.use('/importacao', require('./routes/importacao'));
    app.use('/relatorios', require('./routes/relatorios'));
    // Rotas removidas na simplificação: publicações, editor colaborativo e projetos
    
    // Rota simples para página Sobre
    app.get('/sobre', (req, res) => {
      res.render('sobre', {
        title: 'Sobre o SGC-ITEP',
        layout: 'layout'
      });
    });

    // Rotas do Módulo NUGECID (agora consolidadas)
    app.use('/nugecid', require('./routes/nugecid.routes.js'));
    app.use('/api/export', require('./routes/api/export'));
    app.use('/api/v1/auth', require('./routes/api/auth'));
    app.use('/api/v1/usuarios', require('./routes/usuarios'));
    app.use('/api/v1/importacao', require('./routes/importacao'));
    app.use('/api/v1/relatorios', require('./routes/relatorios'));
    app.use('/api/v1/dashboard', require('./routes/dashboard'));
    console.log('Routes loaded successfully.');

    // Rotas da API
    const dashboardApiRoutes = require('./routes/api/dashboard');
    const authApiRoutes = require('./routes/api/auth');
    const exportApiRoutes = require('./routes/api/export');
    const notificationsApiRoutes = require('./routes/api/notifications');

    // API Endpoints
    app.use('/api/dashboard', ensureAuthenticated, dashboardApiRoutes);
    app.use('/api/auth', authApiRoutes);
    app.use('/api/export', ensureAuthenticated, exportApiRoutes);
    app.use('/api/notifications', notificationsApiRoutes);

    // --- TRATAMENTO DE ERROS ---
    // Handler 404 aprimorado
    app.use(notFoundHandler);

    // Tratamento de erro específico para CSRF inválido (DEVE SER ANTES do handler global)
    app.use((err, req, res, next) => {
      if (err === invalidCsrfTokenError) {
        console.warn('CSRF Token inválido detectado para a rota:', req.path);
        req.flash('error_msg', 'Sua sessão expirou ou o formulário é inválido. Por favor, tente novamente.');
        res.status(403).redirect(req.get('Referrer') || '/');
      } else {
        next(err);
      }
    });

    // Handler global de erros (DEVE SER O ÚLTIMO)
    app.use(globalErrorHandler);

    // --- INICIAR SERVIDOR ---
    const PORT = process.env.PORT || 3001;
    const http = require('http');
    const server = http.createServer(app);
    
    // Serviços removidos na simplificação
    
    server.listen(PORT, () => {
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
