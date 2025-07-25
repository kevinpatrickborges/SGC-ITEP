// Middleware aprimorado para registrar logs de auditoria detalhados
const Usuario = require('../models/Usuario');
const Auditoria = require('../models/Auditoria');

// Função para obter IP real do usuário
function obterIPReal(req) {
  return req.headers['x-forwarded-for'] || 
         req.headers['x-real-ip'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         req.ip || 'IP não identificado';
}

// Função para obter User Agent
function obterUserAgent(req) {
  return req.headers['user-agent'] || 'User Agent não identificado';
}

// Registra auditoria na tabela dedicada
async function registrarAuditoria(req, acao, entidade, entidadeId, detalhesAdicionais = {}) {
  try {
    const usuario = req.session?.user || req.user;
    const dadosAuditoria = {
      usuarioId: usuario ? usuario.id : null,
      acao,
      entidade,
      entidadeId: entidadeId || 0,
      detalhes: {
        url: req.originalUrl,
        metodo: req.method,
        ip: obterIPReal(req),
        userAgent: obterUserAgent(req),
        timestamp: new Date().toISOString(),
        parametros: req.params,
        query: req.query,
        ...detalhesAdicionais
      }
    };

    await Auditoria.create(dadosAuditoria);
    
    // Também mantém log simplificado no usuário para compatibilidade
    if (usuario) {
      await registrarAuditoriaUsuario(req, acao, detalhesAdicionais);
    }
  } catch (error) {
    console.error('Erro ao registrar auditoria:', error);
  }
}

// Mantém compatibilidade com sistema anterior
async function registrarAuditoriaUsuario(req, acao, detalhes) {
  try {
    const sessionUser = req.session?.user || req.user;
    if (!sessionUser) return;
    const usuario = await Usuario.findByPk(sessionUser.id);
    if (!usuario) return;
    
    const logs = usuario.logAuditoria || [];
    logs.push({
      acao,
      detalhes,
      data: new Date().toISOString(),
      ip: obterIPReal(req)
    });
    
    // Mantém apenas os últimos 100 logs
    usuario.logAuditoria = logs.slice(-100);
    await usuario.save();
  } catch (error) {
    console.error('Erro ao registrar auditoria no usuário:', error);
  }
}

// Middleware para auditoria automática
function auditar(acao, entidade = 'Sistema') {
  return async (req, res, next) => {
    try {
      // Captura dados antes da execução
      const dadosOriginais = req.body ? { ...req.body } : {};
      
      // Intercepta a resposta para capturar resultados
      const originalSend = res.send;
      res.send = function(data) {
        // Registra auditoria após execução bem-sucedida
        if (res.statusCode >= 200 && res.statusCode < 400) {
          setImmediate(() => {
            registrarAuditoria(req, acao, entidade, req.params.id, {
              dadosOriginais,
              statusCode: res.statusCode,
              sucesso: true
            });
          });
        }
        originalSend.call(this, data);
      };
      
      next();
    } catch (error) {
      console.error('Erro no middleware de auditoria:', error);
      next();
    }
  };
}

// Middleware específico para operações CRUD
function auditarCRUD(entidade) {
  return {
    criar: auditar(`CRIAR_${entidade.toUpperCase()}`, entidade),
    atualizar: auditar(`ATUALIZAR_${entidade.toUpperCase()}`, entidade),
    excluir: auditar(`EXCLUIR_${entidade.toUpperCase()}`, entidade),
    visualizar: auditar(`VISUALIZAR_${entidade.toUpperCase()}`, entidade)
  };
}

// Middleware para auditoria de login/logout
function auditarAutenticacao() {
  return async (req, res, next) => {
    const originalSend = res.send;
    res.send = function(data) {
      if (res.statusCode === 200) {
        const acao = req.originalUrl.includes('login') ? 'LOGIN' : 'LOGOUT';
        setImmediate(() => {
          const usuario = req.session?.user || req.user;
          registrarAuditoria(req, acao, 'Autenticacao', usuario ? usuario.id : 0, {
            sucesso: true,
            email: req.body ? req.body.email : null
          });
        });
      }
      originalSend.call(this, data);
    };
    next();
  };
}

// Middleware para auditoria de falhas de segurança
function auditarFalhaSeguranca(tipoFalha) {
  return async (req, res, next) => {
    try {
      await registrarAuditoria(req, `FALHA_SEGURANCA_${tipoFalha}`, 'Seguranca', 0, {
        tentativa: req.body,
        headers: req.headers,
        risco: 'ALTO'
      });
    } catch (error) {
      console.error('Erro ao auditar falha de segurança:', error);
    }
    next();
  };
}

module.exports = { 
  registrarAuditoria, 
  registrarAuditoriaUsuario,
  auditar, 
  auditarCRUD,
  auditarAutenticacao,
  auditarFalhaSeguranca,
  obterIPReal,
  obterUserAgent
};
