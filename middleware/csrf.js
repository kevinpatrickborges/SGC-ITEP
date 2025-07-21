const { csrfSync } = require("csrf-sync");

/**
 * Configuração do csrf-sync.
 * A biblioteca é desenhada para ser flexível.
 * @see https://www.npmjs.com/package/csrf-sync
 */

const { 
  generateToken,
  csrfSynchronisedProtection,
  invalidCsrfTokenError, 
} = csrfSync({
  // Esta função é usada para obter o token da requisição do cliente.
  // Procura o token no corpo do formulário (para submissões normais)
  // e nos cabeçalhos (para requisições AJAX).
  getTokenFromRequest: (req) => {
    // Formulários HTML tradicionais enviam o token no corpo da requisição.
    if (req.body && req.body._csrf) {
      return req.body._csrf;
    }
    // Clientes AJAX (como o nosso script de edição inline) enviam o token num cabeçalho.
    if (req.headers['x-csrf-token']) {
      return req.headers['x-csrf-token'];
    }
    return null;
  },
  // Omitimos a maioria das configurações para usar os padrões seguros da biblioteca.
  // A biblioteca já ignora os métodos GET, HEAD, OPTIONS por padrão.
  skipCsrfProtection: (req) => {
    // Pular a proteção global para a rota de upload de arquivo.
    // A proteção será aplicada manualmente na definição da rota, após o multer.
    if (req.path === '/nugecid/desarquivamento/importar' && req.method === 'POST') {
      return true;
    }
    // Pular também para a rota do viewer upload, pois será aplicada manualmente
    if (req.path === '/viewer/upload' && req.method === 'POST') {
      return true;
    }
    return false;
  }
});

/**
 * Middleware para gerar um novo token CSRF e adicioná-lo às variáveis locais da view (res.locals).
 * Isto torna o token acessível em qualquer template EJS como `csrfToken`.
 */
const addCsrfTokenToLocals = (req, res, next) => {
  res.locals.csrfToken = generateToken(req);
  next();
};

module.exports = {
  csrfProtection: csrfSynchronisedProtection,
  addCsrfTokenToLocals,
  invalidCsrfTokenError,
};
