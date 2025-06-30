# NUGECID - ITEP

Sistema de Catalogação e Gerenciamento da Custódia de Vestígios

## Descrição
Sistema web profissional para registro, rastreamento, movimentação e localização de vestígios sob custódia do ITEP.

## Como rodar localmente
1. Instale Node.js (recomendado 18+)
2. Clone o projeto
3. Instale dependências:
   ```bash
   npm install
   ```
4. Configure variáveis no arquivo `.env` (veja `.env.example`).
   - Crie e configure o banco PostgreSQL (veja instruções no README).
   - Execute as migrações Prisma: `npx prisma migrate dev`.
5. Crie os diretórios obrigatórios:
   - `uploads/vestigios/`
   - `downloads/`
6. Inicie a aplicação:
   ```bash
   npm start
   ```

## Estrutura de Pastas
- `/public` - arquivos estáticos (css, js, imagens)
- `/views` - templates EJS
- `/controllers` - lógica dos módulos
- `/models` - modelos Prisma ORM
- `/routes` - rotas Express (incluindo `/routes/api` para REST)
- `/middlewares` - autenticação, validação, CSRF
- `/config` - configurações gerais
- `/utils` - utilitários, helpers
- `/locales` - arquivos de tradução
- `/uploads/vestigios` - anexos e planilhas importadas
- `/downloads` - relatórios gerados

## Funcionalidades
- Cadastro, movimentação e localização de vestígios
- Cadastro de locais (localizações)
- Cadastro e controle de movimentações de vestígios
- Cadastro de usuários e papéis (admin, técnico, auditor)
- Controle de permissões por papel (roles customizáveis)
- Importação de planilhas CSV/XLSX para vestígios, usuários, locais e movimentações
- Geração de relatórios PDF/Excel para todas entidades principais
- Dashboard estatístico
- API RESTful versionada (`/api/v1`) com autenticação JWT
- Logs de auditoria de ações críticas
- Banco relacional normalizado (vestigios, localizacoes, movimentacoes, users, roles)
- Internacionalização (pt-BR/en-US) — alternância de idioma via parâmetro ou configuração
- Frontend responsivo, acessível, com fetch/axios e tratamento de erro
- DevOps: `.env.example`, lint, testes automáticos, README de instalação

---

## 🔐 Autenticação JWT
1. Faça login via API:
   ```http
   POST /api/v1/auth/login
   Content-Type: application/json
   {
     "email": "seu@email.com",
     "senha": "suasenha"
   }
   ```
   - Resposta: `{ "accessToken": "...", "refreshToken": "..." }`
2. Use o token em todas as requisições protegidas:
   ```http
   Authorization: Bearer SEU_TOKEN_AQUI
   ```

---

## 📦 Endpoints RESTful principais

### Vestígios
- `GET /api/v1/vestigios` — Lista todos os vestígios (JWT)
- `GET /api/v1/vestigios/:id` — Detalha vestígio (JWT)
- `POST /api/v1/vestigios` — Cria vestígio (JWT, campos obrigatórios)
- `PUT /api/v1/vestigios/:id` — Edita vestígio (JWT)
- `DELETE /api/v1/vestigios/:id` — Exclui vestígio (JWT)

### Localizações
- `GET /api/v1/localizacoes` — Lista todos os locais (JWT)
- `GET /api/v1/localizacoes/:id` — Detalha local (JWT)
- `POST /api/v1/localizacoes` — Cria local (JWT, admin)
- `PUT /api/v1/localizacoes/:id` — Edita local (JWT, admin)
- `DELETE /api/v1/localizacoes/:id` — Exclui local (JWT, admin)

### Movimentações
- `GET /api/v1/movimentacoes` — Lista todas as movimentações (JWT)
- `GET /api/v1/movimentacoes/:id` — Detalha movimentação (JWT)
- `POST /api/v1/movimentacoes` — Cria movimentação (JWT)
- `PUT /api/v1/movimentacoes/:id` — Edita movimentação (JWT)
- `DELETE /api/v1/movimentacoes/:id` — Exclui movimentação (JWT)

### Usuários
- `GET /api/v1/usuarios` — Lista todos os usuários (JWT)
- `POST /api/v1/usuarios` — Cria usuário (JWT, admin)
- `PUT /api/v1/usuarios/:id` — Edita usuário (JWT, admin)
- `DELETE /api/v1/usuarios/:id` — Exclui usuário (JWT, admin)

### Papéis (Roles)
- `GET /api/v1/roles` — Lista todos os papéis (JWT, admin)
- `POST /api/v1/roles` — Cria papel (JWT, admin)
- `PUT /api/v1/roles/:id` — Edita papel (JWT, admin)
- `DELETE /api/v1/roles/:id` — Exclui papel (JWT, admin)

### Importação de Planilhas
- `POST /api/v1/importacao`
  - Form-data: `arquivo` (CSV/XLSX), `tipo` (`vestigios`, `usuarios`, `localizacoes`, `movimentacoes`)
  - Exemplo com curl:
    ```bash
    curl -X POST http://localhost:3000/api/v1/importacao \
      -H "Authorization: Bearer SEU_TOKEN" \
      -F "arquivo=@planilha.xlsx" -F "tipo=vestigios"
    ```

### Relatórios
- `POST /api/v1/relatorios`
  - JSON: `{ "tipo": "vestigios" | "usuarios" | "localizacoes" | "movimentacoes", "formato": "pdf" | "xlsx" }`
  - Resposta: `{ "success": true, "url": "/downloads/relatorio-<tipo>-<timestamp>.pdf" }`

### Dashboard e Estatísticas
- `GET /api/v1/dashboard` — Retorna métricas e estatísticas consolidadas (JWT)

### Logs de Auditoria
- `GET /api/v1/auditoria` — Lista logs de auditoria (JWT, admin)

---

## ⚠️ Observações
- Todas as rotas da API exigem JWT via header Authorization.
- As rotas legadas (views) continuam acessíveis para navegação web tradicional, mas exigem autenticação para operações sensíveis.
- Para testes, use Postman, Insomnia ou `Invoke-WebRequest` no PowerShell.
- As pastas `uploads/vestigios` e `downloads` devem existir e ter permissão de escrita. O sistema verifica e cria automaticamente se necessário.
- Logs de auditoria são registrados para todas as operações críticas e podem ser exportados.
- O dashboard estatístico está disponível via endpoint e na interface web.
- Internacionalização: alterne o idioma via parâmetro `lang` na URL ou configuração do usuário.
- Frontend utiliza fetch para requisições, tratamento de erros e segue padrões de acessibilidade (WCAG). Layout responsivo garantido via CSS.
- Lint (ESLint/Prettier) e testes automáticos disponíveis via scripts npm.

---

## 📋 Exemplos de uso rápido

### Login e uso do token
```bash
curl -X POST http://localhost:3000/api/v1/auth/login -H "Content-Type: application/json" -d '{"email":"admin@itep.com","senha":"123456"}'
```

### Listar vestígios
```bash
curl -X GET http://localhost:3000/api/v1/vestigios -H "Authorization: Bearer SEU_TOKEN"
```

### Importar planilha
```bash
curl -X POST http://localhost:3000/api/v1/importacao -H "Authorization: Bearer SEU_TOKEN" -F "arquivo=@planilha.xlsx" -F "tipo=vestigios"
```

### Gerar relatório PDF
```bash
curl -X POST http://localhost:3000/api/v1/relatorios -H "Authorization: Bearer SEU_TOKEN" -H "Content-Type: application/json" -d '{"tipo":"vestigios","formato":"pdf"}'
```

---

## 👨‍💻 Contribuição
- Pull requests são bem-vindos!
- Padronize o código com ESLint e Prettier (`npm run lint`).
- Execute os testes automáticos antes de submeter (`npm test`).
- Consulte o código-fonte e exemplos de integração na pasta `/scripts`.
- Sugestões para documentação, internacionalização e acessibilidade são especialmente bem-vindas.

---

## 📄 Licença
MIT

## Segurança
- Autenticação JWT obrigatória para todas as rotas protegidas
- Logs de auditoria para rastreabilidade
- Permissões granulares por papel de usuário
- Proteção contra CSRF e validações robustas

## DevOps
- Exemplo de configuração em `.env.example`
- Scripts de lint (`npm run lint`) e testes (`npm test`)
- Documentação de instalação e deploy neste README

## Pronto para deploy futuro e expansão.
