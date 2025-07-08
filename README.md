# SGC-ITEP

Sistema de Gestão Documental para o Instituto Técnico-Científico de Perícia.

## Descrição
O SGC-ITEP é um sistema web para a gestão de documentos do ITEP, com foco inicial no desarquivamento de prontuários do NUGECID e na gestão da custódia de vestígios.

## Como rodar localmente
1. Instale Node.js (recomendado 18+)
2. Clone o projeto
3. Instale dependências:
   ```bash
   npm install
   ```
4. Configure o banco de dados. O projeto usa **Sequelize** e está configurado para **SQLite** por padrão. O arquivo de banco de dados `nugecid_itep.sqlite` já está no projeto.
5. Execute as migrações para criar o esquema do banco de dados:
   ```bash
   node run-migration.js
   ```
6. Crie os diretórios obrigatórios:
   - `uploads/`
   - `uploads/movimentacoes`
   - `uploads/vestigios`
7. Inicie a aplicação:
   ```bash
   npm start
   ```

## Estrutura de Pastas
- `/public` - arquivos estáticos (css, js, imagens)
- `/views` - templates EJS
- `/controllers` - lógica dos módulos
- `/models` - modelos Sequelize ORM
- `/routes` - rotas Express (incluindo `/routes/api` para REST)
- `/middlewares` - autenticação, validação, CSRF
- `/config` - configurações gerais
- `/utils` - utilitários, helpers
- `/locales` - arquivos de tradução
- `/uploads` - anexos e planilhas importadas

## Funcionalidades
- **Gestão de Desarquivamento (NUGECID):**
  - Registrar pedidos de desarquivamento de prontuários.
  - Controlar status do pedido (solicitado, em posse, devolvido).
  - Registrar motivo e solicitante.
  - Visualizar lista de pedidos.
  - Imprimir recibo de retirada.
  - Registrar devolução do documento.
- **Custódia de Vestígios:**
  - Cadastro, movimentação e localização de vestígios.
  - Cadastro de locais (localizações).
  - Cadastro e controle de movimentações de vestígios.
- **Geral:**
  - Cadastro de usuários e papéis (admin, técnico, auditor).
  - Controle de permissões por papel (roles customizáveis).
  - Importação de planilhas CSV/XLSX.
  - Geração de relatórios PDF/Excel.
  - Dashboard estatístico.
  - API RESTful versionada (`/api/v1`) com autenticação JWT.
  - Logs de auditoria de ações críticas.
  - Internacionalização (pt-BR/en-US).

---

## 📦 Módulos e Rotas

### Desarquivamentos (Interface Web)
- `GET /desarquivamentos` — Lista todos os pedidos.
- `GET /desarquivamentos/novo` — Formulário para novo pedido.
- `POST /desarquivamentos/novo` — Cria um novo pedido.
- `GET /desarquivamentos/:id/editar` — Formulário de edição.
- `POST /desarquivamentos/:id/editar` — Atualiza um pedido.
- `POST /desarquivamentos/:id/excluir` — Exclui um pedido.
- `POST /desarquivamentos/status/:id` — Atualiza o status de um pedido.

### API RESTful (`/api/v1`)
A API segue os padrões REST e utiliza autenticação JWT.

#### Vestígios
- `GET /api/v1/vestigios` — Lista todos os vestígios.
- `POST /api/v1/vestigios` — Cria um novo vestígio.

_(demais endpoints de vestígios, localizações, movimentações, etc. seguem o mesmo padrão)_

---

## 🔐 Autenticação JWT (Para API)
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
2. Use o token nas requisições à API:
   ```http
   Authorization: Bearer SEU_TOKEN_AQUI
   ```

---

## 👨‍💻 Contribuição
- Pull requests são bem-vindos!
- Padronize o código com ESLint e Prettier (`npm run lint`).
- Execute os testes automáticos antes de submeter (`npm test`).
- Consulte o código-fonte e exemplos de integração na pasta `/scripts`.

---

## 📄 Licença
MIT
