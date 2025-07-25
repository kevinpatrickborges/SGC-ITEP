# 🚀 Migração para PostgreSQL - SGC-ITEP NUGECID

## 📋 Status Atual

✅ **Sistema Funcionando**: O SGC-ITEP NUGECID está rodando com SQLite otimizado  
✅ **Configuração Preparada**: PostgreSQL configurado para migração futura  
✅ **Performance Otimizada**: Middlewares de cache, compressão e rate limiting aplicados  
✅ **Segurança Implementada**: Headers de segurança e auditoria completa  

## 🔄 Para Migrar para PostgreSQL

### 1. Instalar PostgreSQL

**Windows:**
```bash
# Baixar e instalar do site oficial
https://www.postgresql.org/download/windows/

# Durante a instalação:
- Usuário: postgres
- Senha: postgres
- Porta: 5432
```

### 2. Criar Banco de Dados

```sql
-- Conectar ao PostgreSQL
psql -U postgres

-- Criar banco
CREATE DATABASE sgc_itep_nugecid;

-- Verificar
\l
```

### 3. Executar Migração

```bash
# Executar script de migração
node scripts/migrate-to-postgresql.js

# Ou manualmente:
# 1. Editar .env (descomentar linhas PostgreSQL)
# 2. Comentar linhas SQLite
# 3. Reiniciar servidor
```

### 4. Configuração .env para PostgreSQL

```env
# Banco de dados
DB_DIALECT=postgres
DB_NAME=sgc_itep_nugecid
DB_USER=postgres
DB_PASS=postgres
DB_HOST=localhost
DB_PORT=5432

# SQLite (comentar quando migrar)
# DB_DIALECT=sqlite
# DB_STORAGE=./nugecid_itep.sqlite
```

## 🎯 Funcionalidades Implementadas

### ✅ Módulo NUGECID Completo
- **CRUD Completo**: Criar, ler, atualizar, excluir registros
- **Controle de Acesso**: Administrador e Usuário (Editor)
- **Pesquisa Avançada**: Filtros por status, datas, solicitante, prontuário
- **Importação XLSX**: Upload, validação, pré-visualização e importação
- **Auditoria Completa**: Log de todas as operações

### ✅ Performance e Segurança
- **Compressão Gzip**: Reduz tamanho das respostas
- **Rate Limiting**: Proteção contra ataques
- **Cache de Recursos**: Otimização de arquivos estáticos
- **Headers de Segurança**: Helmet.js implementado
- **Monitoramento**: Logs detalhados de performance

### ✅ Banco de Dados Otimizado
- **SQLite**: Pool de conexões e otimizações
- **PostgreSQL**: Configuração avançada com retry e SSL
- **Migrações**: Consolidadas e otimizadas

## 🔧 Comandos Úteis

```bash
# Iniciar servidor
npm start

# Executar migrações
npx sequelize-cli db:migrate

# Verificar status do banco
node scripts/migrate-to-postgresql.js

# Backup do banco atual
cp nugecid_itep.sqlite backups/backup_$(date +%Y%m%d_%H%M%S).sqlite
```

## 📊 Estrutura do Banco

### Tabela Principal: Desarquivamentos
- `id` - Chave primária
- `nomeSolicitante` - Nome do solicitante
- `numDocumento` - Número do prontuário/documento
- `motivoSolicitacao` - Motivo da solicitação
- `status` - Status atual (Solicitado, Desarquivado, Devolvido)
- `dataSolicitacao` - Data da solicitação
- `dataDevolucao` - Data de devolução (opcional)
- `createdBy` - ID do usuário que criou
- `deletedBy` - ID do usuário que excluiu (soft delete)

### Outras Tabelas
- `Usuarios` - Controle de acesso
- `Auditorias` - Log de operações
- `SequelizeMeta` - Controle de migrações

## 🚨 Troubleshooting

### Erro de Porta em Uso
```bash
# Verificar processos na porta 3000
netstat -ano | findstr :3000

# Finalizar processo
taskkill /F /PID [PID_NUMBER]
```

### Erro de Rate Limiting
- Configuração otimizada para desenvolvimento local
- IPs locais (127.0.0.1, ::1) são ignorados

### Problemas de Conexão PostgreSQL
- Verificar se PostgreSQL está rodando
- Confirmar credenciais no .env
- Testar conexão: `psql -U postgres -h localhost`

## 📈 Próximos Passos

1. **Migrar para PostgreSQL** quando disponível
2. **Implementar novos módulos** (Custódia, Balística)
3. **Adicionar relatórios avançados**
4. **Implementar notificações**
5. **Melhorar interface visual** (ícones)

---

**Sistema SGC-ITEP NUGECID v1.0**  
*Instituto Técnico-Científico de Perícia*  
*Desenvolvido com Node.js, Express.js, Sequelize e Bootstrap 5*