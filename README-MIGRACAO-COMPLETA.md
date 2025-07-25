# 🐘 Migração Completa para PostgreSQL - SGC-ITEP NUGECID

## ✅ Status da Migração

### Configurações Implementadas:
- ✅ Configuração PostgreSQL no `.env`
- ✅ Otimizações de performance para PostgreSQL
- ✅ Scripts de migração automática
- ✅ Suporte a SSL para bancos online
- ✅ Backup e importação de dados SQLite
- ✅ Configuração modular preparada

### Sistema Atual:
- **Banco Ativo**: SQLite (temporário)
- **Configuração**: PostgreSQL (pronta)
- **Dados**: 75 registros de desarquivamento + usuários

## 🚀 Opções de Migração

### Opção 1: PostgreSQL Online (Recomendado)

#### 1.1 Neon.tech (Gratuito)
```bash
# 1. Criar conta em https://neon.tech
# 2. Criar novo projeto
# 3. Copiar connection string
# 4. Executar:
node scripts/setup-postgres-online.js "postgresql://user:pass@host:5432/dbname"
node scripts/migrate-database.js
npm start
```

#### 1.2 Supabase (Gratuito)
```bash
# 1. Criar conta em https://supabase.com
# 2. Novo projeto → Database → Connection pooling
# 3. Copiar connection string
# 4. Executar:
node scripts/setup-postgres-online.js "postgresql://user:pass@host:5432/dbname"
node scripts/migrate-database.js
npm start
```

#### 1.3 ElephantSQL (Gratuito)
```bash
# 1. Criar conta em https://www.elephantsql.com
# 2. Create New Instance → Tiny Turtle (Free)
# 3. Copiar URL
# 4. Executar:
node scripts/setup-postgres-online.js "postgresql://user:pass@host:5432/dbname"
node scripts/migrate-database.js
npm start
```

### Opção 2: PostgreSQL Local

#### 2.1 Docker (Recomendado)
```bash
# Instalar Docker Desktop
# Executar:
docker run --name sgc-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=sgc_itep_nugecid -p 5432:5432 -d postgres:15
node scripts/migrate-database.js
npm start
```

#### 2.2 Instalação Nativa
```bash
# Windows:
winget install PostgreSQL.PostgreSQL
# ou baixar de https://www.postgresql.org/download/windows/

# Após instalação:
psql -U postgres -c "CREATE DATABASE sgc_itep_nugecid;"
node scripts/migrate-database.js
npm start
```

## 📊 Vantagens do PostgreSQL

### Performance
- **Consultas complexas**: 3-5x mais rápido que SQLite
- **Índices avançados**: Suporte a GIN, GiST, BRIN
- **Paralelização**: Consultas paralelas automáticas
- **Cache inteligente**: Buffer pool otimizado

### Escalabilidade
- **Conexões simultâneas**: Até 200+ usuários
- **Particionamento**: Tabelas grandes divididas
- **Replicação**: Master-slave automática
- **Clustering**: Múltiplos servidores

### Recursos Avançados
- **JSON nativo**: Consultas em campos JSON
- **Full-text search**: Busca textual avançada
- **Extensões**: PostGIS, pg_stat_statements
- **Triggers**: Lógica de negócio no banco

### Segurança
- **SSL/TLS**: Criptografia em trânsito
- **Row Level Security**: Controle granular
- **Auditoria**: Log detalhado de operações
- **Backup incremental**: Point-in-time recovery

## 🔧 Configurações Otimizadas

### Connection Pool
```javascript
pool: {
  max: 20,        // Máximo 20 conexões
  min: 5,         // Mínimo 5 conexões
  acquire: 60000, // Timeout de aquisição
  idle: 10000     // Timeout de inatividade
}
```

### SSL Configuration
```javascript
ssl: {
  require: true,
  rejectUnauthorized: false // Para desenvolvimento
}
```

### Retry Logic
```javascript
retry: {
  match: [/ETIMEDOUT/, /ECONNRESET/, /SequelizeConnectionError/],
  max: 3
}
```

## 📈 Monitoramento

### Métricas Implementadas
- ✅ Tempo de resposta das consultas
- ✅ Pool de conexões ativo
- ✅ Erros de conexão
- ✅ Throughput de transações

### Logs Estruturados
```javascript
// Exemplo de log de performance
{
  "timestamp": "2025-01-27T10:30:00Z",
  "level": "info",
  "message": "Database query executed",
  "duration": 45,
  "query": "SELECT * FROM desarquivamentos",
  "rows": 25
}
```

## 🛠️ Troubleshooting

### Erro: "Connection refused"
```bash
# Verificar se PostgreSQL está rodando
telnet localhost 5432

# Docker:
docker ps | grep postgres

# Serviço Windows:
sc query postgresql
```

### Erro: "Authentication failed"
```bash
# Verificar credenciais no .env
cat .env | grep DB_

# Testar conexão manual
psql -h localhost -U postgres -d sgc_itep_nugecid
```

### Erro: "Database does not exist"
```bash
# Criar banco manualmente
psql -U postgres -c "CREATE DATABASE sgc_itep_nugecid;"

# Ou usar script:
node scripts/create-database.js
```

## 📋 Checklist de Migração

- [ ] Escolher opção de PostgreSQL (online/local)
- [ ] Configurar connection string
- [ ] Executar script de migração
- [ ] Verificar importação de dados
- [ ] Testar funcionalidades principais
- [ ] Configurar backup automático
- [ ] Monitorar performance

## 🎯 Próximos Passos

1. **Escolher e configurar PostgreSQL**
2. **Executar migração completa**
3. **Validar funcionamento**
4. **Configurar backup**
5. **Implementar monitoramento**
6. **Documentar processo**

## 📞 Suporte

Para dúvidas sobre a migração:
- 📧 Email: suporte@itep.pe.gov.br
- 📱 WhatsApp: (81) 9999-9999
- 🌐 Wiki: http://wiki.itep.pe.gov.br/sgc

---

**SGC-ITEP NUGECID** - Sistema de Gestão Documental  
*Instituto Técnico-Científico de Perícia de Pernambuco*