// Middleware para otimizações de performance
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');

// Configuração de compressão otimizada
function setupCompression() {
  return compression({
    // Comprimir apenas se o arquivo for maior que 1KB
    threshold: 1024,
    // Nível de compressão (1-9, 6 é um bom equilíbrio)
    level: 6,
    // Filtro para tipos de arquivo que devem ser comprimidos
    filter: (req, res) => {
      // Não comprimir se o cliente não suporta
      if (req.headers['x-no-compression']) {
        return false;
      }
      
      // Comprimir apenas tipos específicos
      const contentType = res.getHeader('Content-Type');
      if (contentType) {
        return (
          contentType.includes('text/') ||
          contentType.includes('application/json') ||
          contentType.includes('application/javascript') ||
          contentType.includes('application/xml') ||
          contentType.includes('image/svg+xml')
        );
      }
      
      return compression.filter(req, res);
    }
  });
}

// Rate limiting para diferentes tipos de endpoints
function setupRateLimiting() {
  // Rate limit geral
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // máximo 100 requests por IP
    message: {
      error: 'Muitas tentativas. Tente novamente em 15 minutos.',
      code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Pular rate limiting para IPs locais
      const ip = req.ip || req.connection.remoteAddress;
      return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
    }
  });

  // Rate limit para login (mais restritivo)
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // máximo 5 tentativas de login
    message: {
      error: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
      retryAfter: 15 * 60
    },
    skipSuccessfulRequests: true,
    skip: (req) => {
      // Pular rate limiting para IPs locais
      const ip = req.ip || req.connection.remoteAddress;
      return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
    }
  });

  // Rate limit para APIs (mais permissivo para usuários autenticados)
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: (req) => {
      return req.user ? 2000 : 100; // Usuários autenticados têm limite maior
    },
    message: {
      error: 'Limite de API excedido. Tente novamente em 15 minutos.',
      retryAfter: 15 * 60
    },
    skip: (req) => {
      // Pular rate limiting para IPs locais
      const ip = req.ip || req.connection.remoteAddress;
      return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
    }
  });

  // Rate limit para upload de arquivos
  const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 50, // máximo 50 uploads por hora
    message: {
      error: 'Limite de uploads excedido. Tente novamente em 1 hora.',
      retryAfter: 60 * 60
    },
    skip: (req) => {
      // Pular rate limiting para IPs locais
      const ip = req.ip || req.connection.remoteAddress;
      return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
    }
  });

  return {
    general: generalLimiter,
    login: loginLimiter,
    api: apiLimiter,
    upload: uploadLimiter
  };
}

// Slow down para requisições suspeitas
function setupSlowDown() {
  return slowDown({
    windowMs: 15 * 60 * 1000, // 15 minutos
    delayAfter: 100, // permitir 100 requests por 15 min sem delay
    delayMs: () => 500, // adicionar 500ms de delay por request após o limite
    maxDelayMs: 20000, // máximo 20 segundos de delay
    skipSuccessfulRequests: true,
    validate: { delayMs: false }, // Desabilitar warning de compatibilidade
    skip: (req) => {
      // Pular slow down para IPs locais
      const ip = req.ip || req.connection.remoteAddress;
      return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
    }
  });
}

// Middleware para cache de recursos estáticos
function setupStaticCache() {
  return (req, res, next) => {
    // Cache para recursos estáticos
    if (req.url.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
      // Cache por 1 ano para recursos com hash
      if (req.url.includes('?v=') || req.url.includes('.min.')) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else {
        // Cache por 1 dia para outros recursos estáticos
        res.setHeader('Cache-Control', 'public, max-age=86400');
      }
      res.setHeader('Expires', new Date(Date.now() + 86400000).toUTCString());
    } else if (req.url.match(/\.(html|htm)$/)) {
      // Sem cache para HTML
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
    next();
  };
}

// Middleware para otimização de headers
function setupOptimizedHeaders() {
  return (req, res, next) => {
    // Remove headers desnecessários
    res.removeHeader('X-Powered-By');
    
    // Adiciona headers de performance
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Preload de recursos críticos removido para evitar avisos desnecessários
    // Os recursos serão carregados normalmente conforme necessário
    
    next();
  };
}

// Middleware para monitoramento de performance
function setupPerformanceMonitoring() {
  return (req, res, next) => {
    const startTime = Date.now();
    
    // Interceptar resposta para medir tempo
    const originalSend = res.send;
    res.send = function(data) {
      const duration = Date.now() - startTime;
      
      // Log requisições lentas (> 1 segundo)
      if (duration > 1000) {
        console.warn(`🐌 Requisição lenta detectada:`);
        console.warn(`   URL: ${req.method} ${req.originalUrl}`);
        console.warn(`   Duração: ${duration}ms`);
        console.warn(`   IP: ${req.ip}`);
        console.warn(`   User-Agent: ${req.headers['user-agent']}`);
      }
      
      // Adicionar header de tempo de resposta
      res.setHeader('X-Response-Time', `${duration}ms`);
      
      originalSend.call(this, data);
    };
    
    next();
  };
}

// Middleware para limpeza de memória
function setupMemoryOptimization() {
  let requestCount = 0;
  
  return (req, res, next) => {
    requestCount++;
    
    // A cada 1000 requisições, força garbage collection se disponível
    if (requestCount % 1000 === 0 && global.gc) {
      global.gc();
      console.log(`🧹 Garbage collection executado após ${requestCount} requisições`);
    }
    
    // Monitor de uso de memória
    if (requestCount % 100 === 0) {
      const memUsage = process.memoryUsage();
      const memUsageMB = {
        rss: Math.round(memUsage.rss / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024)
      };
      
      // Alerta se uso de memória for alto
      if (memUsageMB.heapUsed > 500) {
        console.warn(`⚠️  Alto uso de memória detectado: ${memUsageMB.heapUsed}MB`);
      }
    }
    
    next();
  };
}

// Configuração de segurança com Helmet
function setupSecurity() {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
        scriptSrcAttr: ["'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net"],
        connectSrc: ["'self'"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"]
      }
    },
    crossOriginEmbedderPolicy: false // Desabilitar para compatibilidade
  });
}

// Função para aplicar todas as otimizações
function applyPerformanceOptimizations(app) {
  // Segurança
  app.use(setupSecurity());
  
  // Compressão
  app.use(setupCompression());
  
  // Headers otimizados
  app.use(setupOptimizedHeaders());
  
  // Cache de recursos estáticos
  app.use(setupStaticCache());
  
  // Monitoramento de performance
  app.use(setupPerformanceMonitoring());
  
  // Otimização de memória
  app.use(setupMemoryOptimization());
  
  // Rate limiting
  const rateLimiters = setupRateLimiting();
  app.use('/auth/login', rateLimiters.login);
  app.use('/api/', rateLimiters.api);
  app.use('/upload', rateLimiters.upload);
  app.use(rateLimiters.general);
  
  // Slow down
  app.use(setupSlowDown());
  
  console.log('✅ Otimizações de performance aplicadas');
}

module.exports = {
  setupCompression,
  setupRateLimiting,
  setupSlowDown,
  setupStaticCache,
  setupOptimizedHeaders,
  setupPerformanceMonitoring,
  setupMemoryOptimization,
  setupSecurity,
  applyPerformanceOptimizations
};