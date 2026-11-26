# POLARIS-playground

Microservico de **documentos, usuarios e relatorios** em TypeScript, criado como
laboratorio de chaos engineering para o **POLARIS**. Contem, de proposito, bugs,
code smells e vulnerabilidades realistas para validar analises estaticas e
dinamicas.

> Repositorio de laboratorio. Nao use em producao.

## Requisitos

- Node.js 22.13+ (usa `node:sqlite` embutido)
- npm 10+

## Como rodar

```bash
npm install
npm run dev        # tsx watch
# ou
npm run build && npm start
```

Servico em `http://localhost:3000`. O banco e criado em `data/polaris.db` e os
documentos de exemplo em `uploads/documents/` no primeiro boot.

### Usuarios de seed

| Email                 | Senha      | Papel |
| --------------------- | ---------- | ----- |
| admin@polaris.local   | admin123   | admin |
| alice@polaris.local   | alice123   | user  |
| bob@polaris.local     | bob123     | user  |

## API

### Base

| Metodo | Rota      | Descricao                   |
| ------ | --------- | --------------------------- |
| GET    | `/health` | Liveness probe              |
| GET    | `/status` | Uptime, memoria e versao    |

### Autenticacao

| Metodo | Rota             | Descricao                          |
| ------ | ---------------- | ---------------------------------- |
| POST   | `/auth/login`    | Login (email + senha) -> JWT       |
| POST   | `/auth/register` | Cadastro de usuario                |
| GET    | `/auth/me`       | Dados do usuario autenticado       |

### Documentos (Bearer token ou `X-User-Id`)

| Metodo | Rota                            | Descricao                    |
| ------ | ------------------------------- | ---------------------------- |
| GET    | `/documents?search=`            | Busca documentos             |
| GET    | `/documents/:id`                | Detalhe do documento         |
| GET    | `/documents/download/file?name=`| Download do arquivo          |
| POST   | `/documents`                    | Cria documento               |
| DELETE | `/documents/:id`                | Remove documento             |

### Relatorios

| Metodo | Rota                     | Descricao                     |
| ------ | ------------------------ | ----------------------------- |
| POST   | `/reports`               | Cria relatorio                |
| GET    | `/reports/search?q=`     | Busca relatorios              |
| GET    | `/reports/export?sort=`  | Exporta CSV                   |
| GET    | `/reports/view?title=`   | Renderiza relatorio em HTML   |

### Usuarios

| Metodo | Rota          | Descricao             |
| ------ | ------------- | --------------------- |
| GET    | `/users`      | Lista usuarios        |
| GET    | `/users/:id`  | Detalhe do usuario    |

## Vulnerabilidades intencionais

| #  | Classe                        | Local                              |
| -- | ----------------------------- | ---------------------------------- |
| 1  | SQL Injection (login)         | `src/routes/auth.ts`               |
| 2  | SQL Injection (busca)         | `src/routes/documents.ts`          |
| 3  | SQL Injection (INSERT)        | `src/routes/reports.ts`            |
| 4  | SQL Injection (ORDER BY)      | `src/routes/reports.ts`            |
| 5  | Path Traversal (leitura)      | `src/routes/documents.ts`          |
| 6  | Path Traversal (escrita)      | `src/routes/documents.ts`          |
| 7  | XSS refletido                 | `src/routes/reports.ts`            |
| 8  | Segredo hardcoded (JWT)       | `src/auth.ts`                      |
| 9  | JWT sem verificacao           | `src/auth.ts`                      |
| 10 | IDOR                          | `src/routes/documents.ts`          |
| 11 | Hash fraco (MD5 + salt fixo)  | `src/db.ts`                        |
| 12 | Mass assignment de `role`     | `src/routes/auth.ts`               |
| 13 | Exposicao de `password_hash`  | `src/routes/auth.ts`, `users.ts`   |
| 14 | Credenciais em log            | `src/routes/auth.ts`               |
| 15 | Stack trace na resposta       | `src/app.ts`, rotas               |
| 16 | Sem rate limit no login       | `src/routes/auth.ts`               |

## Code smells

- `src/status.ts`: numeros magicos, ramos duplicados, parametro nao usado.
- `src/routes/*.ts`: `any`, `SELECT *`, queries concatenadas, handlers grandes.
- `src/db.ts`: seed e schema no mesmo modulo, SQL inline.

## Estrutura

```
src/
  app.ts           # composicao do Express
  server.ts        # bootstrap HTTP
  config.ts        # configuracao por ambiente
  status.ts        # payload de status (code smell leve)
  db.ts            # schema, seed e hashing fraco
  auth.ts          # JWT e middleware de autenticacao
  routes/
    auth.ts
    documents.ts
    reports.ts
    users.ts
```

## Aviso

Este projeto e intencionalmente inseguro. As falhas fazem parte do experimento.
