// Middleware global para tratamento de erros robusto
const { registrarAuditoria } = require('./auditoria');

// Tipos de erro personalizados
class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, field = null) {
    super(message, 400);
    this.name = 'ValidationError';
    this.field = field;
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Não autorizado') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Acesso negado') {
    super(message, 403);
    this.name = 'AuthorizationError';
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Recurso') {
    super(`${resource} não encontrado`, 404);
    this.name = 'NotFoundError';
  }
}

class DatabaseError extends AppError {
  constructor(message = 'Erro interno do servidor') {
    super(message, 500);
    this.name = 'DatabaseError';
  }
}

// Função para determinar se o erro é operacional
function isOperationalError(error) {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}

// Função para log detalhado de erros
function logError(error, req = null) {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    url: req ? req.originalUrl : 'N/A',
    method: req ? req.method : 'N/A',
    ip: req ? (req.headers['x-forwarded-for'] || req.ip) : 'N/A',
    userAgent: req ? req.headers['user-agent'] : 'N/A',
    userId: req && req.user ? req.user.id : null,
    body: req ? req.body : null,
    params: req ? req.params : null,
    query: req ? req.query : null
  };

  // Log no console com formatação
  console.error('\n🚨 ERRO DETECTADO:');
  console.error('📅 Timestamp:', errorInfo.timestamp);
  console.error('📍 URL:', errorInfo.url);
  console.error('🔧 Método:', errorInfo.method);
  console.error('👤 Usuário:', errorInfo.userId || 'Anônimo');
  console.error('💬 Mensagem:', errorInfo.message);
  console.error('📊 Stack:', errorInfo.stack);
  console.error('\n');

  // Registra auditoria se houver request
  if (req) {
    try {
      registrarAuditoria(req, 'ERRO_SISTEMA', 'Sistema', 0, {
        erro: {
          name: error.name,
          message: error.message,
          statusCode: error.statusCode || 500
        },
        contexto: errorInfo
      });
    } catch (auditError) {
      console.error('Erro ao registrar auditoria do erro:', auditError);
    }
  }
}

// Middleware para captura de erros assíncronos
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Middleware de tratamento de erros global
function globalErrorHandler(error, req, res, next) {
  // Log do erro
  logError(error, req);

  // Determina status code
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Erro interno do servidor';
  let details = null;

  // Tratamento específico por tipo de erro
  if (error.name === 'SequelizeValidationError') {
    statusCode = 400;
    message = 'Dados inválidos';
    details = error.errors.map(err => ({
      field: err.path,
      message: err.message,
      value: err.value
    }));
  } else if (error.name === 'SequelizeUniqueConstraintError') {
    statusCode = 409;
    message = 'Registro já existe';
    details = error.errors.map(err => ({
      field: err.path,
      message: `${err.path} já está em uso`
    }));
  } else if (error.name === 'SequelizeForeignKeyConstraintError') {
    statusCode = 400;
    message = 'Referência inválida';
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Token inválido';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expirado';
  } else if (error.name === 'MulterError') {
    statusCode = 400;
    if (error.code === 'LIMIT_FILE_SIZE') {
      message = 'Arquivo muito grande';
    } else if (error.code === 'LIMIT_FILE_COUNT') {
      message = 'Muitos arquivos';
    } else {
      message = 'Erro no upload do arquivo';
    }
  }

  // Resposta baseada no tipo de requisição
  if (req.xhr || req.headers.accept?.includes('application/json')) {
    // Requisição AJAX/API
    return res.status(statusCode).json({
      success: false,
      error: {
        message,
        code: error.name || 'UnknownError',
        timestamp: new Date().toISOString(),
        ...(details && { details }),
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      }
    });
  } else {
    // Requisição de página
    req.flash('error', message);
    
    // Redireciona baseado no status
    if (statusCode === 401) {
      return res.redirect('/auth/login');
    } else if (statusCode === 403) {
      return res.redirect('/dashboard');
    } else if (statusCode === 404) {
      return res.status(404).render('errors/404', { 
        title: 'Página não encontrada',
        message 
      });
    } else {
      return res.status(statusCode).render('errors/500', { 
        title: 'Erro interno',
        message: process.env.NODE_ENV === 'production' ? 'Erro interno do servidor' : message
      });
    }
  }
}

// Middleware para captura de rotas não encontradas
function notFoundHandler(req, res, next) {
  // Ignora rotas do Vite (desenvolvimento) para evitar spam de logs
  if (req.originalUrl.startsWith('/@vite/') || 
      req.originalUrl.startsWith('/node_modules/') ||
      req.originalUrl.includes('vite') ||
      req.originalUrl.includes('hot-update')) {
    return res.status(404).end();
  }
  
  const error = new NotFoundError(`Rota ${req.originalUrl}`);
  next(error);
}

// Handler para erros não capturados
function handleUncaughtException() {
  process.on('uncaughtException', (error) => {
    console.error('🚨 UNCAUGHT EXCEPTION! Encerrando aplicação...');
    logError(error);
    process.exit(1);
  });
}

// Handler para promises rejeitadas
function handleUnhandledRejection() {
  process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 UNHANDLED REJECTION! Encerrando aplicação...');
    console.error('Promise:', promise);
    console.error('Reason:', reason);
    process.exit(1);
  });
}

// Função para validação de entrada
function validateInput(schema) {
  return (req, res, next) => {
    try {
      const { error, value } = schema.validate(req.body, { abortEarly: false });
      
      if (error) {
        const details = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }));
        
        throw new ValidationError('Dados de entrada inválidos', details);
      }
      
      req.body = value;
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = {
  // Classes de erro
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  DatabaseError,
  
  // Middlewares
  globalErrorHandler,
  notFoundHandler,
  asyncHandler,
  validateInput,
  
  // Utilitários
  isOperationalError,
  logError,
  handleUncaughtException,
  handleUnhandledRejection
};