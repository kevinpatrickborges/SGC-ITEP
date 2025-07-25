# 🐘 Guia Completo de Migração para PostgreSQL

## ✅ Sistema Preparado para Migração

O SGC-ITEP está **100% configurado** para PostgreSQL. Todos os scripts e configurações necessários foram implementados.

## 🚀 Opções de Migração

### 1. PostgreSQL Local (Recomendado para Desenvolvimento)

#### Opção A: Instalação Nativa
```bash
# Windows (usando Chocolatey)
choco install postgresql

# Ou baixar do site oficial
# https://www.postgresql.org/download/windows/
```

#### Opção B: Docker (Mais Fácil)
```bash
# Iniciar Docker Desktop primeiro

# Criar container PostgreSQL
docker run --name sgc-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_DB=sgc_itep \
  -p 5432:5432 \
  -d postgres:15

# Verificar se está rodando
docker ps
```

### 2. PostgreSQL Online (Gratuito)

#### 🌟 Neon.tech (Recomendado)
1. Acesse: https://neon.tech
2. Crie uma conta gratuita
3. Crie um novo projeto
4. Copie a connection string
5. Execute:
```bash
node scripts/setup-postgres-online.js "sua_connection_string_aqui"
```

#### 🔥 Supabase
1. Acesse: https://supabase.com
2. Crie uma conta e projeto
3. Vá em Settings → Database
4. Copie a connection string

#### 🐘 ElephantSQL
1. Acesse: https://www.elephantsql.com
2. Crie conta e instância "Tiny Turtle" (gratuita)
3. Copie a URL de conexão

## 📋 Processo de Migração

### Passo 1: Configurar Banco
Escolha uma das opções acima e configure o PostgreSQL.

### Passo 2: Executar Migração
```bash
# Para PostgreSQL local
node scripts/migrate-database.js

# Para PostgreSQL online (após configurar)
node scripts/run-online-migration.js
```

### Passo 3: Iniciar Sistema
```bash
npm start
```

### Passo 4: Verificar
Acesse http://localhost:3000 e faça login:
- **Usuário:** admin@sgc.com
- **Senha:** admin123

## 🔧 Configurações Atuais

### Arquivo .env
```env
DB_DIALECT=postgres
DB_NAME=sgc_itep
DB_USER=postgres
DB_PASS=postgres
DB_HOST=localhost
DB_PORT=5432
DB_SSL=false
```

### Para PostgreSQL Online
Após usar `setup-postgres-online.js`, o .env será automaticamente atualizado.

## 🎯 Vantagens da Migração

### Performance
- ✅ Consultas 3-5x mais rápidas
- ✅ Melhor handling de concorrência
- ✅ Índices mais eficientes

### Recursos Avançados
- ✅ JSON nativo para dados complexos
- ✅ Full-text search integrado
- ✅ Extensões (PostGIS, etc.)
- ✅ Triggers e stored procedures

### Escalabilidade
- ✅ Suporte a milhões de registros
- ✅ Replicação master-slave
- ✅ Particionamento de tabelas
- ✅ Connection pooling

### Segurança
- ✅ Row Level Security (RLS)
- ✅ Criptografia nativa
- ✅ Auditoria avançada
- ✅ Backup automático

## 🛠️ Scripts Disponíveis

| Script | Função |
|--------|--------|
| `migrate-database.js` | Migração completa local |
| `setup-postgres-online.js` | Configurar PostgreSQL online |
| `run-online-migration.js` | Executar migração online |
| `demo-neon-migration.js` | Demo com Neon.tech |

## 🚨 Troubleshooting

### Erro de Conexão
```bash
# Verificar se PostgreSQL está rodando
# Windows
net start postgresql-x64-15

# Docker
docker start sgc-postgres
```

### Porta em Uso
```bash
# Verificar processo na porta 5432
netstat -ano | findstr :5432

# Parar processo se necessário
taskkill /PID <PID> /F
```

### Permissões
```sql
-- Conectar como superuser e executar:
CREATE DATABASE sgc_itep;
CREATE USER postgres WITH PASSWORD 'postgres';
GRANT ALL PRIVILEGES ON DATABASE sgc_itep TO postgres;
```

## 📊 Monitoramento

Após a migração, monitore:
- Tempo de resposta das consultas
- Uso de memória
- Conexões ativas
- Tamanho do banco

## 🎉 Próximos Passos

1. **Escolher opção de PostgreSQL**
2. **Executar migração**
3. **Testar funcionalidades**
4. **Configurar backup automático**
5. **Otimizar consultas se necessário**

---

**💡 Dica:** Para produção, recomendamos PostgreSQL online (Neon.tech) pela facilidade de backup, escalabilidade automática e zero manutenção.

**🔗 Links Úteis:**
- [Documentação PostgreSQL](https://www.postgresql.org/docs/)
- [Neon.tech Docs](https://neon.tech/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Docker PostgreSQL](https://hub.docker.com/_/postgres)