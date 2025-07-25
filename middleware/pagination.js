// Middleware para paginação otimizada
const { Op } = require('sequelize');

// Configurações padrão de paginação
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const MIN_PAGE_SIZE = 5;

// Função para validar e normalizar parâmetros de paginação
function normalizePaginationParams(query) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(
    MAX_PAGE_SIZE,
    Math.max(MIN_PAGE_SIZE, parseInt(query.limit) || DEFAULT_PAGE_SIZE)
  );
  const offset = (page - 1) * limit;
  
  return { page, limit, offset };
}

// Função para construir filtros de busca
function buildSearchFilters(searchParams, searchableFields) {
  const filters = {};
  
  if (searchParams.search && searchableFields.length > 0) {
    filters[Op.or] = searchableFields.map(field => ({
      [field]: {
        [Op.like]: `%${searchParams.search}%`
      }
    }));
  }
  
  // Filtros específicos por campo
  Object.keys(searchParams).forEach(key => {
    if (key !== 'search' && key !== 'page' && key !== 'limit' && key !== 'sort' && key !== 'order') {
      const value = searchParams[key];
      if (value && value !== '') {
        if (key.includes('Date') || key.includes('data')) {
          // Filtro de data
          if (value.includes(' to ')) {
            const [start, end] = value.split(' to ');
            filters[key] = {
              [Op.between]: [new Date(start), new Date(end)]
            };
          } else {
            filters[key] = {
              [Op.gte]: new Date(value)
            };
          }
        } else if (Array.isArray(value)) {
          filters[key] = {
            [Op.in]: value
          };
        } else {
          filters[key] = {
            [Op.like]: `%${value}%`
          };
        }
      }
    }
  });
  
  return filters;
}

// Função para construir ordenação
function buildOrderClause(query, defaultSort = 'createdAt', defaultOrder = 'DESC') {
  const sortField = query.sort || defaultSort;
  const sortOrder = (query.order || defaultOrder).toUpperCase();
  
  // Validar ordem
  const validOrder = ['ASC', 'DESC'].includes(sortOrder) ? sortOrder : 'DESC';
  
  return [[sortField, validOrder]];
}

// Middleware principal de paginação
function paginate(options = {}) {
  const {
    searchableFields = [],
    defaultSort = 'createdAt',
    defaultOrder = 'DESC',
    include = [],
    attributes = null
  } = options;
  
  return async (req, res, next) => {
    try {
      // Normalizar parâmetros de paginação
      const { page, limit, offset } = normalizePaginationParams(req.query);
      
      // Construir filtros
      const where = buildSearchFilters(req.query, searchableFields);
      
      // Construir ordenação
      const order = buildOrderClause(req.query, defaultSort, defaultOrder);
      
      // Adicionar ao request para uso nos controllers
      req.pagination = {
        page,
        limit,
        offset,
        where,
        order,
        include,
        ...(attributes && { attributes })
      };
      
      // Função helper para executar consulta paginada
      req.paginatedQuery = async (model, customOptions = {}) => {
        const queryOptions = {
          where,
          order,
          limit,
          offset,
          include,
          ...(attributes && { attributes }),
          ...customOptions
        };
        
        // Executar consulta com contagem
        const { count, rows } = await model.findAndCountAll(queryOptions);
        
        // Calcular metadados de paginação
        const totalPages = Math.ceil(count / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;
        
        return {
          data: rows,
          pagination: {
            currentPage: page,
            totalPages,
            totalItems: count,
            itemsPerPage: limit,
            hasNextPage,
            hasPrevPage,
            nextPage: hasNextPage ? page + 1 : null,
            prevPage: hasPrevPage ? page - 1 : null,
            startItem: offset + 1,
            endItem: Math.min(offset + limit, count)
          },
          filters: req.query
        };
      };
      
      next();
    } catch (error) {
      next(error);
    }
  };
}

// Middleware para cache de consultas frequentes
function cacheQuery(duration = 300) { // 5 minutos por padrão
  const cache = new Map();
  
  return (req, res, next) => {
    const cacheKey = JSON.stringify({
      url: req.originalUrl,
      query: req.query,
      user: req.user ? req.user.id : null
    });
    
    const cachedResult = cache.get(cacheKey);
    
    if (cachedResult && (Date.now() - cachedResult.timestamp) < duration * 1000) {
      req.cachedResult = cachedResult.data;
      return next();
    }
    
    // Interceptar resposta para cache
    const originalSend = res.send;
    res.send = function(data) {
      if (res.statusCode === 200) {
        cache.set(cacheKey, {
          data,
          timestamp: Date.now()
        });
        
        // Limpar cache antigo
        if (cache.size > 1000) {
          const oldestKey = cache.keys().next().value;
          cache.delete(oldestKey);
        }
      }
      originalSend.call(this, data);
    };
    
    next();
  };
}

// Função helper para construir URLs de paginação
function buildPaginationUrls(req, pagination) {
  const baseUrl = req.protocol + '://' + req.get('host') + req.path;
  const query = { ...req.query };
  
  const urls = {
    first: null,
    prev: null,
    next: null,
    last: null
  };
  
  if (pagination.totalPages > 0) {
    // Primeira página
    query.page = 1;
    urls.first = baseUrl + '?' + new URLSearchParams(query).toString();
    
    // Última página
    query.page = pagination.totalPages;
    urls.last = baseUrl + '?' + new URLSearchParams(query).toString();
    
    // Página anterior
    if (pagination.hasPrevPage) {
      query.page = pagination.prevPage;
      urls.prev = baseUrl + '?' + new URLSearchParams(query).toString();
    }
    
    // Próxima página
    if (pagination.hasNextPage) {
      query.page = pagination.nextPage;
      urls.next = baseUrl + '?' + new URLSearchParams(query).toString();
    }
  }
  
  return urls;
}

// Middleware para adicionar headers de paginação em APIs
function addPaginationHeaders() {
  return (req, res, next) => {
    const originalSend = res.send;
    res.send = function(data) {
      if (res.statusCode === 200 && data && typeof data === 'object') {
        const parsed = typeof data === 'string' ? JSON.parse(data) : data;
        
        if (parsed.pagination) {
          const urls = buildPaginationUrls(req, parsed.pagination);
          
          // Headers padrão de paginação
          res.set({
            'X-Total-Count': parsed.pagination.totalItems,
            'X-Total-Pages': parsed.pagination.totalPages,
            'X-Current-Page': parsed.pagination.currentPage,
            'X-Per-Page': parsed.pagination.itemsPerPage
          });
          
          // Link header para navegação
          const linkHeaders = [];
          if (urls.first) linkHeaders.push(`<${urls.first}>; rel="first"`);
          if (urls.prev) linkHeaders.push(`<${urls.prev}>; rel="prev"`);
          if (urls.next) linkHeaders.push(`<${urls.next}>; rel="next"`);
          if (urls.last) linkHeaders.push(`<${urls.last}>; rel="last"`);
          
          if (linkHeaders.length > 0) {
            res.set('Link', linkHeaders.join(', '));
          }
        }
      }
      originalSend.call(this, data);
    };
    next();
  };
}

// Função para otimizar consultas com índices
function optimizeQuery(model, options = {}) {
  const optimizedOptions = { ...options };
  
  // Adicionar índices sugeridos baseados nos filtros
  if (optimizedOptions.where) {
    const whereKeys = Object.keys(optimizedOptions.where);
    console.log(`💡 Sugestão: Considere adicionar índices para: ${whereKeys.join(', ')} na tabela ${model.tableName}`);
  }
  
  // Otimizar includes para evitar N+1
  if (optimizedOptions.include) {
    optimizedOptions.include = optimizedOptions.include.map(inc => ({
      ...inc,
      separate: false, // Evita consultas separadas
      required: false  // LEFT JOIN por padrão
    }));
  }
  
  return optimizedOptions;
}

module.exports = {
  paginate,
  cacheQuery,
  addPaginationHeaders,
  buildPaginationUrls,
  buildSearchFilters,
  buildOrderClause,
  normalizePaginationParams,
  optimizeQuery,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  MIN_PAGE_SIZE
};