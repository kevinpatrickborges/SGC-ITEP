# SGC‑ITEP – Orientações de Projeto (Guia "Gemini")

> **Propósito deste arquivo**
> Fornecer um resumo conciso – em português claro – de **como queremos que o sistema funcione e evolua**, para orientar qualquer IA (Gemini, GPT, Copilot) ou novo desenvolvedor que leia o repositório.

---

## 1. Visão Geral

O **SGC‑ITEP** é um **Sistema de Gestão Documental** modular destinado ao Instituto Técnico‑Científico de Perícia.
Ele substitui planilhas soltas e pastas físicas por um fluxo digital auditável que abrange:

1. **Desarquivamento de Prontuários** (módulo **NUGECID**) – registrar, acompanhar, imprimir recibos.
2. **Gestão de Custódia de Vestígios** (módulo **Custódia**) – já existente.
3. Futuras extensões (Balística, Toxicologia, DNA…).

Cada setor é um **plug‑in independente** (pasta `modules/<setor>`), mas compartilha login, auditoria, uploads e API.

---

## 2. Arquitetura Técnica

| Camada               | Stack/Detalhes                                  |
| -------------------- | ----------------------------------------------- |
| **Backend**          | Node 18 · Express 4 · Sequelize (MySQL/PG)      |
| **Frontend**         | EJS + Bootstrap 5 · Vanilla JS · Three.js p/ 3D |
| **Auth & Segurança** | Bcrypt · CSRF · Helmet · ACL por perfil/role    |
| **Uploads**          | `/storage/{yyyy}/{mm}/…` (multer)               |
| **PDF & Excel**      | jsPDF · exceljs                                 |
| **Tests**            | Jest (models/services)                          |

---

## 3. Módulos Atuais

### 3.1 NUGECID – Desarquivamento

* **Model** `Desarquivamento` (id, nome, numProntuario, motivo, solicitante, status, dataSolicitacao, dataDevolucao, digitalizado, createdBy, updatedBy, deletedAt).
* **Funcionalidades:**

  * CRUD web + API REST `/api/v1/desarquivamentos`
  * Importação XLSX com validação (campos padrão)
  * Preview & confirmação antes de gravar
  * Recibo PDF com QR‑Code para assinatura da retirada
  * Lista "Itens Desarquivados" (soft‑delete)
  * Painel com indicadores (abertos, pendentes, vencidos).

### 3.2 Custódia de Vestígios

* Cadastro de vestígio, localização hierárquica, movimentações.
* Visual 3D de armário/estante (Three.js).

---

## 4. Padrões de Código

* ES Modules – `type: "module"` no *package.json*.
* Pastas fixas:

  ```
  ```

/models        # Sequelize models
/routes        # Express routers
/controllers   # Regras de negócio
/views         # EJS templates
/modules/<x>   # plug‑ins de cada setor
/public        # css, js, imgs

```
* Middleware `checkRole()` controla acesso por perfil.
* Sempre usar **try/catch async** e devolver `next(err)`.
* Comentários em português, estilo JSDoc onde fizer sentido.

---

## 5. Fluxo de Contribuição

1. **Clone** → `npm install` → `cp .env.example .env` → ajustar variáveis.
2. **Rodar** → `npm run dev` (nodemon) ou `docker compose up`.
3. Crie branch `feature/<nome>`.
4. Testes unitários obrigatórios para services ou models novos.
5. **Pull Request** com descrição, prints e passo‑a‑passo de teste.

---

## 6. Roadmap Imediato

1. **Digitalização & pendências** – flag `digitalizado` + página "A digitalizar".  
2. **Empréstimos internos** – tabelar saídas temporárias c/ alerta por e‑mail.  
3. **Descarte definitivo** – agenda de eliminação + Termo de Destruição.  
4. **Busca full‑text** – integração Elastic‑like nos anexos PDF.

---

## 7. Contato / Manutenção

*Responsável técnico inicial:* Kevin P. Borges  
*E‑mail institucional:*

Todo novo módulo deve seguir este guia e ser colocado dentro de `modules/` com:
`model.js`, `routes.js`, `controller.js`, `views/*` e `README_module.md` explicativo.

```
