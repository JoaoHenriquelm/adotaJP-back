# Documentação da API — AdotaJP (`adotaJP-back`)

## Informações Gerais

- **Base URL (padrão local):** `http://localhost:1000`
- **Formato padrão:** `application/json` (exceto upload de imagem em `multipart/form-data`)
- **Autenticação:** JWT via cabeçalho HTTP:
  ```http
  Authorization: Bearer <SEU_TOKEN_JWT>
  ```
- **Arquivos de imagem enviados localmente:** servidos estaticamente em `GET http://localhost:1000/uploads/<nome-do-arquivo>`.

---

## Visão Geral das Rotas

### Autenticação (`/auth`)
| Método | Rota | Autenticação | Status Sucesso | Descrição |
|---|---|---|---|---|
| `POST` | `/auth/register` | Não | `201 Created` | Cadastra um novo usuário |
| `POST` | `/auth/login` | Não | `200 OK` | Autentica o usuário e retorna o token JWT |

### Usuários (`/users`)
| Método | Rota | Autenticação | Status Sucesso | Descrição |
|---|---|---|---|---|
| `GET` | `/users/me` | Sim | `200 OK` | Consulta o perfil do usuário autenticado |
| `PATCH` | `/users/me` | Sim | `200 OK` | Atualiza telefone e/ou endereço do usuário |
| `GET` | `/users/me/favorites` | Sim | `200 OK` | Lista animais favoritados disponíveis (paginado) |
| `POST` | `/users/me/favorites/:animalPostId` | Sim | `200 OK` | Adiciona uma publicação aos favoritos |
| `DELETE` | `/users/me/favorites/:animalPostId` | Sim | `200 OK` | Remove uma publicação dos favoritos |
| `GET` | `/users/me/animal-posts` | Sim | `200 OK` | Lista todas as publicações criadas pelo usuário (paginado) |

### Publicações de Animais (`/animal-posts`)
| Método | Rota | Autenticação | Status Sucesso | Descrição |
|---|---|---|---|---|
| `POST` | `/animal-posts` | Sim | `201 Created` | Cria uma nova publicação de animal |
| `GET` | `/animal-posts` | Não | `200 OK` | Lista publicações disponíveis (com paginação e filtro por espécie) |
| `GET` | `/animal-posts/:id` | Não | `200 OK` | Consulta detalhes públicos de uma publicação específica |
| `PATCH` | `/animal-posts/:id` | Sim (Dono) | `200 OK` | Atualiza informações editáveis da publicação |
| `PATCH` | `/animal-posts/:id/confirm-availability` | Sim (Dono) | `200 OK` | Renova a disponibilidade da publicação por mais 30 dias |
| `PATCH` | `/animal-posts/:id/adopt` | Sim (Dono) | `200 OK` | Alterna ou define o status de adoção do animal |
| `DELETE` | `/animal-posts/:id` | Sim (Dono) | `204 No Content` | Exclui definitivamente a publicação (hard delete) |

---

## 1. Autenticação

### 1.1. Cadastrar Usuário — `POST /auth/register`
Cria uma nova conta de usuário. Valida unicidade de `email` e `cpf` (aceita CPF com ou sem pontuação e armazena apenas os 11 dígitos), criptografa a senha com bcrypt e inicializa `favoriteAnimals` vazio. Dados sensíveis (`passwordHash` e `cpf`) não são expostos na resposta.

- **Autenticação:** Não requer token.

**Request**
```http
POST /auth/register
Content-Type: application/json
```
```json
{
  "name": "Maria Silva",
  "email": "maria@exemplo.com",
  "cpf": "123.456.789-01",
  "birthDate": "1996-04-12",
  "phone": "83999991111",
  "address": "Manaíra, João Pessoa - PB",
  "password": "senhaSegura123"
}
```

**Response (`201 Created`)**
```json
{
  "id": "673001a9f1d2c40012ab3456",
  "name": "Maria Silva",
  "email": "maria@exemplo.com",
  "birthDate": "1996-04-12T00:00:00.000Z",
  "phone": "83999991111",
  "address": "Manaíra, João Pessoa - PB",
  "favoriteAnimals": [],
  "createdAt": "2026-11-09T22:50:00.000Z",
  "updatedAt": "2026-11-09T22:50:00.000Z"
}
```

**Possíveis erros:**
- `400 VALIDATION_ERROR` — Campos inválidos ou ausentes.
- `409 EMAIL_ALREADY_EXISTS` / `409 CPF_ALREADY_EXISTS` — E-mail ou CPF já cadastrado.

---

### 1.2. Login — `POST /auth/login`
Autentica um usuário por e-mail e senha e retorna o token JWT (`accessToken`) junto aos dados públicos do perfil. Por segurança, não diferencia se o erro foi no e-mail ou na senha.

- **Autenticação:** Não requer token.

**Request**
```http
POST /auth/login
Content-Type: application/json
```
```json
{
  "email": "maria@exemplo.com",
  "password": "senhaSegura123"
}
```

**Response (`200 OK`)**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "673001a9f1d2c40012ab3456",
    "name": "Maria Silva",
    "email": "maria@exemplo.com",
    "birthDate": "1996-04-12T00:00:00.000Z",
    "phone": "83999991111",
    "address": "Manaíra, João Pessoa - PB",
    "favoriteAnimals": [],
    "createdAt": "2026-11-09T22:50:00.000Z",
    "updatedAt": "2026-11-09T22:50:00.000Z"
  }
}
```

**Possíveis erros:**
- `400 VALIDATION_ERROR` — E-mail inválido ou senha vazia.
- `401 INVALID_CREDENTIALS` — Credenciais inválidas.

---

## 2. Usuários

> Todas as rotas de `/users` exigem o header `Authorization: Bearer <TOKEN_JWT>`.

### 2.1. Consultar Meu Perfil — `GET /users/me`
Retorna os dados do usuário autenticado identificado pelo token JWT.

**Request**
```http
GET /users/me
Authorization: Bearer <TOKEN_JWT>
```

**Response (`200 OK`)**
```json
{
  "id": "673001a9f1d2c40012ab3456",
  "name": "Maria Silva",
  "email": "maria@exemplo.com",
  "birthDate": "1996-04-12T00:00:00.000Z",
  "phone": "83999991111",
  "address": "Manaíra, João Pessoa - PB",
  "favoriteAnimals": [
    "67300255f1d2c40012ab7890"
  ],
  "createdAt": "2026-11-09T22:50:00.000Z",
  "updatedAt": "2026-11-09T22:50:00.000Z"
}
```

---

### 2.2. Atualizar Telefone e Endereço — `PATCH /users/me`
Permite atualizar **somente** `phone` e/ou `address` do usuário autenticado. Enviar outros campos (como `cpf`, `email`, `name` ou `password`) retorna erro `400`.

**Request**
```http
PATCH /users/me
Authorization: Bearer <TOKEN_JWT>
Content-Type: application/json
```
```json
{
  "phone": "83988887777",
  "address": "Tambaú, João Pessoa - PB"
}
```

**Response (`200 OK`)**
```json
{
  "id": "673001a9f1d2c40012ab3456",
  "name": "Maria Silva",
  "email": "maria@exemplo.com",
  "birthDate": "1996-04-12T00:00:00.000Z",
  "phone": "83988887777",
  "address": "Tambaú, João Pessoa - PB",
  "favoriteAnimals": [],
  "createdAt": "2026-11-09T22:50:00.000Z",
  "updatedAt": "2026-11-09T23:05:00.000Z"
}
```

---

### 2.3. Listar Meus Favoritos — `GET /users/me/favorites`
Lista de forma paginada as publicações favoritadas pelo usuário autenticado. Retorna **apenas** publicações existentes e disponíveis (`status: true`), ordenadas das mais recentes para as mais antigas.

**Query Parameters (opcionais):**
- `page` (padrão: `1`)
- `limit` (padrão: `10`, máximo: `100`)

**Request**
```http
GET /users/me/favorites?page=1&limit=10
Authorization: Bearer <TOKEN_JWT>
```

**Response (`200 OK`)**
```json
{
  "data": [
    {
      "id": "67300255f1d2c40012ab7890",
      "name": "Thor",
      "species": "CACHORRO",
      "age": 2,
      "ageUnit": "YEARS",
      "weight": 14.5,
      "vaccines": "V10 e Antirrábica",
      "illnesses": "",
      "status": true,
      "publishedAt": "2026-11-09T22:52:00.000Z",
      "returnDate": "2026-12-09T22:52:00.000Z",
      "imagePath": "/uploads/4655cc61-3329-44c2-a073-1a95967e7eeb.jpg",
      "owner": {
        "id": "673001a9f1d2c40012ab3456",
        "name": "Maria Silva",
        "email": "maria@exemplo.com",
        "phone": "83988887777"
      },
      "createdAt": "2026-11-09T22:52:00.000Z",
      "updatedAt": "2026-11-09T22:52:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

---

### 2.4. Adicionar Animal aos Favoritos — `POST /users/me/favorites/:animalPostId`
Adiciona uma publicação disponível à lista `favoriteAnimals` do usuário autenticado sem duplicar referências (`$addToSet`).

**Request**
```http
POST /users/me/favorites/67300255f1d2c40012ab7890
Authorization: Bearer <TOKEN_JWT>
```

**Response (`200 OK`)**
```json
{
  "id": "67300999f1d2c40012ab9999",
  "name": "João Souza",
  "email": "joao@exemplo.com",
  "birthDate": "1992-08-20T00:00:00.000Z",
  "phone": "83988882222",
  "address": "Bancários, João Pessoa - PB",
  "favoriteAnimals": [
    "67300255f1d2c40012ab7890"
  ],
  "createdAt": "2026-11-09T22:51:00.000Z",
  "updatedAt": "2026-11-09T23:10:00.000Z"
}
```

**Possíveis erros:**
- `400 VALIDATION_ERROR` — `animalPostId` não é um ObjectId válido.
- `400 ANIMAL_POST_UNAVAILABLE` — Publicação indisponível (`status: false`).
- `404 ANIMAL_POST_NOT_FOUND` — Publicação não encontrada.

---

### 2.5. Remover Animal dos Favoritos — `DELETE /users/me/favorites/:animalPostId`
Remove uma publicação da lista `favoriteAnimals` do usuário autenticado (`$pull`).

**Request**
```http
DELETE /users/me/favorites/67300255f1d2c40012ab7890
Authorization: Bearer <TOKEN_JWT>
```

**Response (`200 OK`)**
```json
{
  "id": "67300999f1d2c40012ab9999",
  "name": "João Souza",
  "email": "joao@exemplo.com",
  "birthDate": "1992-08-20T00:00:00.000Z",
  "phone": "83988882222",
  "address": "Bancários, João Pessoa - PB",
  "favoriteAnimals": [],
  "createdAt": "2026-11-09T22:51:00.000Z",
  "updatedAt": "2026-11-09T23:12:00.000Z"
}
```

---

### 2.6. Listar Minhas Publicações — `GET /users/me/animal-posts`
Retorna de forma paginada **todas** as publicações criadas pelo usuário autenticado, incluindo tanto disponíveis (`status: true`) quanto expiradas ou adotadas (`status: false`).

**Query Parameters (opcionais):**
- `page` (padrão: `1`)
- `limit` (padrão: `10`, máximo: `100`)

**Request**
```http
GET /users/me/animal-posts?page=1&limit=10
Authorization: Bearer <TOKEN_JWT>
```

**Response (`200 OK`)**
```json
{
  "data": [
    {
      "id": "67300255f1d2c40012ab7890",
      "name": "Thor",
      "species": "CACHORRO",
      "age": 2,
      "ageUnit": "YEARS",
      "weight": 14.5,
      "vaccines": "V10 e Antirrábica",
      "illnesses": "",
      "status": false,
      "isAdopted": true,
      "ownerId": "673001a9f1d2c40012ab3456",
      "publishedAt": "2026-11-09T22:52:00.000Z",
      "returnDate": "2026-12-09T22:52:00.000Z",
      "imagePath": "/uploads/4655cc61-3329-44c2-a073-1a95967e7eeb.jpg",
      "createdAt": "2026-11-09T22:52:00.000Z",
      "updatedAt": "2026-11-09T23:18:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

---

## 3. Publicações de Animais

### 3.1. Criar Publicação — `POST /animal-posts`
Cria uma nova publicação de animal para adoção vinculada automaticamente ao usuário autenticado.
- Define `publishedAt` com a data/hora atual.
- Define `returnDate` para **30 dias** após `publishedAt`.
- Inicia com `status: true` e `isAdopted: false`.
- Normaliza `species` para letras maiúsculas sem acentos (ex.: `"  Cão  "` -> `"CAO"`).
- `ageUnit` aceita `"MONTHS"` ou `"YEARS"`.

Aceita **duas formas** de envio:

#### Opção A: `multipart/form-data` (Upload de imagem para o servidor)
- O campo do arquivo deve se chamar `image`, `photo` ou `file` (formatos aceitos: JPEG, PNG, WEBP ou GIF; limite padrão: 5 MB).

```bash
curl -X POST http://localhost:1000/animal-posts \
  -H "Authorization: Bearer <TOKEN_JWT>" \
  -F "name=Thor" \
  -F "species=Cachorro" \
  -F "age=2" \
  -F "ageUnit=YEARS" \
  -F "weight=14.5" \
  -F "vaccines=V10 e Antirrábica" \
  -F "illnesses=" \
  -F "image=@./thor.jpg"
```

#### Opção B: `application/json` (Informando URL/caminho da imagem)
```http
POST /animal-posts
Authorization: Bearer <TOKEN_JWT>
Content-Type: application/json
```
```json
{
  "name": "Thor",
  "species": "Cachorro",
  "age": 2,
  "ageUnit": "YEARS",
  "weight": 14.5,
  "vaccines": "V10 e Antirrábica",
  "illnesses": "",
  "imagePath": "https://cdn.exemplo.com/animais/thor.jpg"
}
```

**Response (`201 Created`)**
```json
{
  "id": "67300255f1d2c40012ab7890",
  "name": "Thor",
  "species": "CACHORRO",
  "age": 2,
  "ageUnit": "YEARS",
  "weight": 14.5,
  "vaccines": "V10 e Antirrábica",
  "illnesses": "",
  "status": true,
  "isAdopted": false,
  "ownerId": "673001a9f1d2c40012ab3456",
  "publishedAt": "2026-11-09T22:52:00.000Z",
  "returnDate": "2026-12-09T22:52:00.000Z",
  "imagePath": "/uploads/4655cc61-3329-44c2-a073-1a95967e7eeb.jpg",
  "createdAt": "2026-11-09T22:52:00.000Z",
  "updatedAt": "2026-11-09T22:52:00.000Z"
}
```

---

### 3.2. Listar Publicações Disponíveis (e Filtrar por Espécie) — `GET /animal-posts`
Rota pública que retorna apenas publicações com `status: true`, ordenadas das mais recentes para as mais antigas (`publishedAt` decrescente), acompanhadas dos dados públicos de contato do responsável (`id`, `name`, `email`, `phone` — nunca expõe CPF ou endereço).

**Query Parameters (opcionais):**
- `page` (padrão: `1`)
- `limit` (padrão: `10`, máximo: `100`)
- `species` (opcional — normalizado automaticamente, ex.: `species=cachorro` ou `species=DOG`)

**Request**
```http
GET /animal-posts?page=1&limit=10&species=cachorro
```

**Response (`200 OK`)**
```json
{
  "data": [
    {
      "id": "67300255f1d2c40012ab7890",
      "name": "Thor",
      "species": "CACHORRO",
      "age": 2,
      "ageUnit": "YEARS",
      "weight": 14.5,
      "vaccines": "V10 e Antirrábica",
      "illnesses": "",
      "status": true,
      "publishedAt": "2026-11-09T22:52:00.000Z",
      "returnDate": "2026-12-09T22:52:00.000Z",
      "imagePath": "/uploads/4655cc61-3329-44c2-a073-1a95967e7eeb.jpg",
      "owner": {
        "id": "673001a9f1d2c40012ab3456",
        "name": "Maria Silva",
        "email": "maria@exemplo.com",
        "phone": "83988887777"
      },
      "createdAt": "2026-11-09T22:52:00.000Z",
      "updatedAt": "2026-11-09T22:52:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

---

### 3.3. Consultar Publicação por ID — `GET /animal-posts/:id`
Rota pública que retorna os detalhes completos de uma publicação específica e o contato público do responsável.

**Request**
```http
GET /animal-posts/67300255f1d2c40012ab7890
```

**Response (`200 OK`)**
```json
{
  "id": "67300255f1d2c40012ab7890",
  "name": "Thor",
  "species": "CACHORRO",
  "age": 2,
  "ageUnit": "YEARS",
  "weight": 14.5,
  "vaccines": "V10 e Antirrábica",
  "illnesses": "",
  "status": true,
  "publishedAt": "2026-11-09T22:52:00.000Z",
  "returnDate": "2026-12-09T22:52:00.000Z",
  "imagePath": "/uploads/4655cc61-3329-44c2-a073-1a95967e7eeb.jpg",
  "owner": {
    "id": "673001a9f1d2c40012ab3456",
    "name": "Maria Silva",
    "email": "maria@exemplo.com",
    "phone": "83988887777"
  },
  "createdAt": "2026-11-09T22:52:00.000Z",
  "updatedAt": "2026-11-09T22:52:00.000Z"
}
```

**Possíveis erros:**
- `400 VALIDATION_ERROR` — `id` inválido.
- `404 ANIMAL_POST_NOT_FOUND` — Publicação não encontrada.

---

### 3.4. Atualizar Publicação — `PATCH /animal-posts/:id`
Permite que **somente o proprietário** atualize os dados editáveis do animal (`name`, `species`, `age`, `ageUnit`, `weight`, `vaccines`, `illnesses` e nova imagem via `multipart/form-data` ou `imagePath` via JSON).
- Não permite alterar `owner`, `publishedAt`, `_id`, `createdAt`, `returnDate` ou `status`.
- Caso a imagem seja substituída, o arquivo antigo salvo localmente em `uploads/` é removido automaticamente.

**Request (`application/json`)**
```http
PATCH /animal-posts/67300255f1d2c40012ab7890
Authorization: Bearer <TOKEN_JWT>
Content-Type: application/json
```
```json
{
  "weight": 15.2,
  "vaccines": "V10, Antirrábica e Giárdia"
}
```
*(Também aceita `multipart/form-data` enviando o campo de arquivo `image` junto aos campos que deseja atualizar).*

**Response (`200 OK`)**
```json
{
  "id": "67300255f1d2c40012ab7890",
  "name": "Thor",
  "species": "CACHORRO",
  "age": 2,
  "ageUnit": "YEARS",
  "weight": 15.2,
  "vaccines": "V10, Antirrábica e Giárdia",
  "illnesses": "",
  "status": true,
  "isAdopted": false,
  "ownerId": "673001a9f1d2c40012ab3456",
  "publishedAt": "2026-11-09T22:52:00.000Z",
  "returnDate": "2026-12-09T22:52:00.000Z",
  "imagePath": "/uploads/4655cc61-3329-44c2-a073-1a95967e7eeb.jpg",
  "createdAt": "2026-11-09T22:52:00.000Z",
  "updatedAt": "2026-11-09T23:15:00.000Z"
}
```

**Possíveis erros:**
- `400 VALIDATION_ERROR` — Nenhum campo informado ou tentativa de alterar campo proibido.
- `403 FORBIDDEN` — Usuário autenticado não é o proprietário da publicação.
- `404 ANIMAL_POST_NOT_FOUND` — Publicação não encontrada.

---

### 3.5. Confirmar Disponibilidade (+30 dias) — `PATCH /animal-posts/:id/confirm-availability`
Permite que o proprietário confirme que o animal continua disponível para adoção (inclusive reativando uma publicação que tenha sido pausada pelo job diário após 30 dias).
- Atualiza `returnDate` para **+30 dias** a partir da confirmação.
- Garante `status: true` mantendo `publishedAt` original.
- Bloqueia a operação com `409 Conflict` caso o animal esteja marcado como adotado (`isAdopted: true`).

**Request**
```http
PATCH /animal-posts/67300255f1d2c40012ab7890/confirm-availability
Authorization: Bearer <TOKEN_JWT>
```

**Response (`200 OK`)**
```json
{
  "id": "67300255f1d2c40012ab7890",
  "name": "Thor",
  "species": "CACHORRO",
  "age": 2,
  "ageUnit": "YEARS",
  "weight": 15.2,
  "vaccines": "V10, Antirrábica e Giárdia",
  "illnesses": "",
  "status": true,
  "isAdopted": false,
  "ownerId": "673001a9f1d2c40012ab3456",
  "publishedAt": "2026-11-09T22:52:00.000Z",
  "returnDate": "2026-12-09T23:16:00.000Z",
  "imagePath": "/uploads/4655cc61-3329-44c2-a073-1a95967e7eeb.jpg",
  "createdAt": "2026-11-09T22:52:00.000Z",
  "updatedAt": "2026-11-09T23:16:00.000Z"
}
```

**Possíveis erros:**
- `403 FORBIDDEN` — Usuário não é o proprietário.
- `404 ANIMAL_POST_NOT_FOUND` — Publicação não encontrada.
- `409 ANIMAL_ALREADY_ADOPTED` — O animal está marcado como adotado.

---

### 3.6. Alternar / Definir Status de Adoção — `PATCH /animal-posts/:id/adopt`
Permite que o proprietário marque o animal como adotado ou reverta a adoção:
- **Sem body** (ou `{}`): funciona como **toggle**, invertendo o valor atual de `isAdopted`.
- **Com body opcional** `{ "isAdopted": true | false }`: define explicitamente o estado desejado.

Comportamento:
- Quando `isAdopted` passa a `true` → define `status: false` (desativa a publicação na listagem pública e nos favoritos, mantendo-a em `GET /users/me/animal-posts`).
- Quando `isAdopted` passa a `false` → define `status: true` (reativa a publicação e, caso `returnDate` esteja vencido, renova para `+30 dias`).

**Request (Toggle simples, sem body)**
```http
PATCH /animal-posts/67300255f1d2c40012ab7890/adopt
Authorization: Bearer <TOKEN_JWT>
```

**Request alternativo (Body explícito)**
```http
PATCH /animal-posts/67300255f1d2c40012ab7890/adopt
Authorization: Bearer <TOKEN_JWT>
Content-Type: application/json
```
```json
{
  "isAdopted": true
}
```

**Response (`200 OK`)**
```json
{
  "id": "67300255f1d2c40012ab7890",
  "name": "Thor",
  "species": "CACHORRO",
  "age": 2,
  "ageUnit": "YEARS",
  "weight": 15.2,
  "vaccines": "V10, Antirrábica e Giárdia",
  "illnesses": "",
  "status": false,
  "isAdopted": true,
  "ownerId": "673001a9f1d2c40012ab3456",
  "publishedAt": "2026-11-09T22:52:00.000Z",
  "returnDate": "2026-12-09T23:16:00.000Z",
  "imagePath": "/uploads/4655cc61-3329-44c2-a073-1a95967e7eeb.jpg",
  "createdAt": "2026-11-09T22:52:00.000Z",
  "updatedAt": "2026-11-09T23:20:00.000Z"
}
```

---

### 3.7. Excluir Publicação (Hard Delete) — `DELETE /animal-posts/:id`
Permite que **somente o proprietário** exclua definitivamente uma publicação:
1. Remove o documento da collection `animalPosts` no MongoDB.
2. Remove o ID da publicação da lista `favoriteAnimals` de todos os usuários.
3. Apaga o arquivo de imagem correspondente em `uploads/` (caso seja local).

**Request**
```http
DELETE /animal-posts/67300255f1d2c40012ab7890
Authorization: Bearer <TOKEN_JWT>
```

**Response (`204 No Content`)**
*(Sem corpo na resposta)*

**Possíveis erros:**
- `403 FORBIDDEN` — Usuário não é o proprietário.
- `404 ANIMAL_POST_NOT_FOUND` — Publicação não encontrada.

---

## 4. Padrão de Respostas de Erro

Todos os erros da API seguem um formato JSON padronizado:

### Erro de Validação (`400 Bad Request`)
```json
{
  "statusCode": 400,
  "error": "VALIDATION_ERROR",
  "message": "Dados inválidos na requisição.",
  "details": [
    {
      "field": "cpf",
      "message": "O CPF deve conter exatamente 11 dígitos numéricos."
    }
  ]
}
```

### Erro de Autenticação (`401 Unauthorized`)
```json
{
  "statusCode": 401,
  "error": "UNAUTHORIZED",
  "message": "Token de autenticação ausente ou malformado."
}
```

### Erro de Autorização (`403 Forbidden`)
```json
{
  "statusCode": 403,
  "error": "FORBIDDEN",
  "message": "Você não tem permissão para editar esta publicação."
}
```

### Recurso Não Encontrado (`404 Not Found`)
```json
{
  "statusCode": 404,
  "error": "ANIMAL_POST_NOT_FOUND",
  "message": "Publicação de animal não encontrada."
}
```

### Conflito de Regra de Negócio / Duplicidade (`409 Conflict`)
```json
{
  "statusCode": 409,
  "error": "EMAIL_ALREADY_EXISTS",
  "message": "Este e-mail já está cadastrado."
}
```
