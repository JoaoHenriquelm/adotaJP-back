# Desenvolvimento do Backend — Sistema de Adoção de Animais

## 1. Contexto do projeto

Estou desenvolvendo um sistema de adoção de animais que permite que usuários cadastrados publiquem animais disponíveis para adoção.

O backend deverá ser desenvolvido utilizando:

- Node.js
- TypeScript
- Fastify
- MongoDB
- Mongoose

O objetivo é construir uma API REST organizada, escalável e de fácil manutenção, seguindo boas práticas de desenvolvimento e separação de responsabilidades.

Antes de iniciar a implementação, analise a estrutura existente do projeto e respeite os padrões arquiteturais já utilizados.

Não modifique funcionalidades existentes sem necessidade.

## 2. Arquitetura e organização

Utilize uma arquitetura dividida nas seguintes responsabilidades:

- **Models:** definição dos schemas e documentos do Mongoose.
- **Repositories:** responsáveis exclusivamente pelas operações de persistência e consultas ao banco de dados.
- **Services:** responsáveis pelas regras de negócio e orquestração das operações.
- **Controllers:** responsáveis por receber as requisições HTTP e retornar as respostas.
- **Routes:** responsáveis pelo registro dos endpoints no Fastify.
- **Jobs:** responsáveis pelas tarefas automáticas e agendadas.
- **Types/DTOs:** definição dos tipos e estruturas de dados utilizados na aplicação.

Não concentre a lógica de negócio nos controllers ou repositories.

## 3. Modelagem do banco de dados

Inicialmente, utilize duas collections principais: `users` e `animalPosts`.

### 3.1. User

O usuário deverá possuir os seguintes campos:

- `_id`: ObjectId.
- `name`: String, obrigatório.
- `passwordHash`: String, obrigatório.
- `email`: String, obrigatório e único.
- `cpf`: String, obrigatório e único.
- `birthDate`: Date, obrigatório.
- `phone`: String.
- `address`: String.
- `favoriteAnimals`: Array de ObjectId referenciando AnimalPost.
- `createdAt`: Date.
- `updatedAt`: Date.

O campo `favoriteAnimals` deverá iniciar como um array vazio.

Utilize timestamps do Mongoose para controlar `createdAt` e `updatedAt`.

### 3.2. AnimalPost

A postagem deverá possuir:

- `_id`: ObjectId.
- `name`: String, nome do animal.
- `species`: String, espécie do animal.
- `age`: Number, idade.
- `ageUnit`: String, MONTHS ou YEARS.
- `weight`: Number.
- `vaccines`: String.
- `illnesses`: String
- `status`: Boolean.
- `owner`: ObjectId referenciando User.
- `publishedAt`: Date.
- `returnDate`: Date, prazo limite para confirmação de disponibilidade.
- `imagePath`: String.
- `createdAt`: Date.
- `updatedAt`: Date.

Utilize referências do Mongoose para os relacionamentos.

Não armazene documentos completos de postagens dentro dos usuários.

### 3.3. Regras dos campos

- `publishedAt` deverá ser definido automaticamente na criação da postagem.
- `returnDate` deverá ser definido inicialmente para 30 dias após a publicação.
- `returnDate` será atualizado sempre que o proprietário confirmar que o animal continua disponível.
- `status` deverá iniciar como AVAILABLE.
- `owner` não poderá ser alterado depois da criação da postagem.
- `publishedAt` não poderá ser alterado depois da criação da postagem.

## 4. Repositories

Implemente os seguintes métodos.

### 4.1. UserRepository

**store(data)**

- Cria um usuário.
- Inicializa `favoriteAnimals` como array vazio.
- Retorna o usuário criado.

**findByEmail(email)**

- Busca um usuário pelo email.
- Retorna o documento encontrado ou null.

**findById(id)**

- Busca um usuário pelo ObjectId.
- Retorna o documento encontrado ou null.

**updateById(id, data)**

- Atualiza somente `phone` e `address`.
- Não permite modificar outros campos.
- Retorna o documento atualizado ou null.

**addFavoriteAnimalPost(userId, animalPostId)**

- Adiciona uma postagem aos favoritos.
- Utiliza `$addToSet` para evitar duplicações.
- Retorna o usuário atualizado.

**removeFavoriteAnimalPost(userId, animalPostId)**

- Remove uma postagem dos favoritos.
- Utiliza `$pull`.
- Retorna o usuário atualizado.

**findFavoriteAnimalsPaged(userId, page, limit)**

- Busca as postagens favoritas do usuário.
- Implementa paginação.
- Retorna os dados e os metadados de paginação.
- Não deve apresentar postagens inexistentes ou que não estejam disponíveis para adoção.

### 4.2. AnimalPostRepository

**store(data)**

- Cria uma postagem.
- Recebe o ID do proprietário.
- Define `publishedAt` automaticamente.
- Define `returnDate` para 30 dias após a publicação.
- Define `status` como true.
- Retorna a postagem criada.

**findAllPaged(page, limit)**

- Busca postagens com status true.
- Ordena pelas mais recentes utilizando `publishedAt` em ordem decrescente.
- Implementa paginação.
- Retorna data, total, página atual, limite e total de páginas.

**findBySpeciesPaged(species, page, limit)**

- Busca postagens disponíveis de determinada espécie.
- Ordena pelas mais recentes.
- Implementa paginação.
- Retorna os mesmos metadados de paginação.

**findById(id)**

- Busca uma postagem pelo ID.

**findByOwnerPaged(ownerId, page, limit)**

- Busca todas as postagens criadas pelo usuário.
- Permite visualizar também postagens false.
- Ordena pelas mais recentes.
- Implementa paginação.

**updateAnimalById(id, ownerId, data)**

- Atualiza os dados da postagem.
- Permite modificar as informações do animal, imagem, vacinas, enfermidades e demais campos editáveis.
- Não permite alterar `owner`, `publishedAt`, `_id` ou `createdAt`.
- Garante que somente o proprietário consiga atualizar a postagem.
- Retorna o documento atualizado ou null.

**confirmAvailability(id, ownerId)**

- Localiza uma postagem pertencente ao usuário.
- Atualiza `returnDate` para 30 dias a partir da confirmação.
- Retorna a postagem atualizada ou null.

**updateStatus(id, ownerId, status)**

- Atualiza o status da postagem.
- Garante que somente o proprietário possa executar a operação.
- Retorna a postagem atualizada ou null.

**deactivateExpiredPosts()**

- Procura postagens com status true e `returnDate` menor ou igual à data atual.
- Atualiza todas as postagens encontradas para false.
- Retorna a quantidade de postagens modificadas.

## 5. Requisitos funcionais

Implemente os seguintes requisitos:

### RF01 — Cadastro de usuários

Permitir que novos usuários realizem cadastro informando nome (name), e-mail, CPF, data de nascimento, telefone, localização (address) e senha.

Regras:

- Validar os dados recebidos.
- Garantir que email e CPF sejam únicos.
- Criptografar a senha utilizando bcrypt ou argon2.
- Armazenar somente o hash da senha no campo `passwordHash`.
- Não retornar a senha ou hash nas respostas HTTP.
- Inicializar a lista de favoritos vazia.

### RF02 — Login

Permitir autenticação utilizando e-mail e senha.

Regras:

- Buscar o usuário pelo email.
- Comparar a senha informada com o hash armazenado.
- Utilizar JWT para autenticação.
- Retornar um token de acesso.
- Não revelar se o email ou a senha foram incorretos individualmente.
- Proteger as rotas que exigem autenticação.

### RF03 — Filtro por espécie

Permitir que qualquer usuário consulte as postagens filtrando pela espécie do animal.

Regras:

- Disponibilizar endpoint de consulta por espécie.
- Retornar somente postagens com status true.
- Implementar paginação.
- Ordenar pelas mais recentes.
- Padronizar os valores de espécie para evitar inconsistências.

### RF04 — Criação de postagens

Permitir que usuários autenticados criem postagens de animais para adoção.

Informações:

- Nome.
- Espécie.
- Idade.
- Unidade da idade.
- Peso.
- Vacinas.
- Enfermidades ou deficiências.
- Foto do animal.

Regras:

- O proprietário será identificado pelo usuário autenticado, nunca pelo ID enviado livremente pelo cliente.
- A imagem deverá ser armazenada em serviço apropriado de armazenamento de arquivos.
- O MongoDB deverá armazenar somente o caminho ou URL da imagem.
- Definir automaticamente `publishedAt`, `returnDate` e `status`.

### RF05 — Listagem pública de postagens

Permitir que qualquer usuário visualize postagens de animais disponíveis para adoção.

As respostas deverão apresentar:

- Informações completas do animal.
- Foto.
- Data de publicação.
- Status da postagem.
- Nome do responsável.
- Email do responsável.
- Número de celular do responsável.

Regras:

- Buscar as postagens disponíveis.
- Recuperar os dados públicos do proprietário por meio de referência.
- Não retornar CPF, senha, hash da senha ou endereço completo do usuário.
- Implementar paginação.
- Permitir ordenação pelas publicações mais recentes.

### RF06 — Minhas postagens

Permitir que usuários autenticados visualizem todas as postagens que criaram.

Regras:

- Buscar pelo ID do usuário autenticado.
- Apresentar postagens com status true e false.
- Implementar paginação.
- Ordenar pelas mais recentes.

### RF07 — Desativação automática após 30 dias

Implementar uma tarefa automática para desativar postagens cuja disponibilidade não foi confirmada pelo proprietário.

Regras:

- Na criação da postagem, definir `returnDate` para 30 dias após `publishedAt`.
- O proprietário poderá confirmar que o animal continua disponível.
- Ao confirmar, atualizar `returnDate` para 30 dias após a confirmação.
- Caso a data atual seja maior ou igual a `returnDate`, o status da postagem deverá ser alterada para false.
- A tarefa deverá executar automaticamente uma vez por dia.
- Utilizar node-cron para o agendamento.
- Implementar a lógica de desativação no repository através do método `deactivateExpiredPosts()`.
- A tarefa deverá ficar isolada na pasta jobs.
- Registrar erros e a quantidade de postagens desativadas.

Não utilizar TTL Index, pois as postagens não devem ser excluídas do banco de dados.

### RF09 — Favoritos

Permitir que usuários autenticados adicionem animais aos favoritos e visualizem sua lista em uma aba dedicada.

Regras:

- Utilizar o campo `favoriteAnimals` do User.
- Utilizar `$addToSet` para adicionar.
- Utilizar `$pull` para remover.
- Validar a existência da postagem.
- Impedir duplicações.
- Implementar listagem paginada dos favoritos.
- Apresentar somente postagens disponíveis.
- Garantir que cada usuário manipule somente sua própria lista.

### RF10 — Marcar animal como adotado

Permitir que o proprietário marque uma postagem como status false.

Regras:

- Somente o proprietário poderá executar a operação.
- Atualizar o status para false.
- A postagem deverá deixar de aparecer nas listagens públicas de animais disponíveis.
- Não excluir o documento do MongoDB.
- Não permitir que uma postagem adotada seja confirmada como disponível automaticamente.

### RF11 — Atualização de telefone e localização

Permitir que usuários autenticados atualizem seu número de celular e endereço.

Regras:

- Atualizar somente `phone` e `address`.
- Identificar o usuário pelo JWT.
- Não permitir que o usuário atualize dados de outra conta.
- Validar os dados recebidos.

### RF12 — Atualização de postagens

Permitir que o proprietário atualize todas as informações da postagem, exceto autoria e data de publicação.

Regras:

- Somente o proprietário poderá atualizar a postagem.
- Não permitir alteração de `owner`.
- Não permitir alteração de `publishedAt`.
- Não permitir alteração de `_id` ou `createdAt`.
- Validar os dados recebidos.
- Atualizar `updatedAt` automaticamente.
- Não modificar `returnDate` durante uma edição comum da postagem, a menos que a operação seja explicitamente uma confirmação de disponibilidade.

## 6. Tarefas agendadas

Crie a estrutura de jobs:

`src/jobs/deactivate-expired-posts.job.ts`

Utilize node-cron para executar a tarefa diariamente à meia-noite.

A tarefa deverá:

1. Consultar postagens true cujo `returnDate` seja menor ou igual à data atual.
2. Alterar o status para false.
3. Registrar a quantidade de documentos modificados.
4. Tratar possíveis erros.
5. Ser inicializada somente depois da conexão com MongoDB.

Considere que, em ambientes com múltiplas instâncias do backend, será necessário evitar a execução duplicada da rotina.

## 7. Índices do MongoDB

Configure os seguintes índices:

### Users

- `email`: único.
- `cpf`: único.

### AnimalPosts

- `owner`: índice.
- `status + publishedAt`: índice composto.
- `species + status + publishedAt`: índice composto.
- `returnDate + status`: índice composto.

Avalie os índices de acordo com as consultas implementadas, evitando índices redundantes.

## 8. TypeScript

Toda a aplicação deverá utilizar TypeScript.

Requisitos:

- Ativar `strict: true` no tsconfig.
- Evitar `any`.
- Utilizar interfaces, types e generics.
- Utilizar `Types.ObjectId` para referências.
- Utilizar tipagem adequada do Mongoose.
- Diferenciar documentos persistidos, DTOs de criação e DTOs de atualização.
- Tipar os parâmetros e retornos dos repositories e services.
- Tipar as requisições e respostas do Fastify.
- Utilizar `unknown` para erros não tipados.
- Evitar `@ts-ignore` e conversões desnecessárias com `as`.

Organize os tipos por entidade.

Sugestões:

- `user.types.ts`
- `animal-post.types.ts`

## 9. Validação e segurança

Utilize a biblioteca de validação já presente no projeto. Caso não exista, avalie o uso de Zod.

Requisitos:

- Validar parâmetros, query strings e body das requisições.
- Validar ObjectIds recebidos.
- Implementar autenticação JWT.
- Implementar autorização nas operações protegidas.
- Não confiar em IDs de usuários enviados pelo frontend.
- Não retornar informações sensíveis.
- Tratar erros de duplicidade de email e CPF.
- Evitar exposição de detalhes internos do banco de dados.
- Utilizar tratamento centralizado de erros, caso exista.

## 10. Rotas da aplicação

Implemente as rotas REST abaixo, respeitando a separação entre controllers, services e repositories.

Todas as rotas deverão possuir validação dos parâmetros, dos dados recebidos e dos identificadores utilizados.

### 10.1. Autenticação

| Método | Rota | Descrição | Autenticação |
|---|---|---|---|
| POST | `/auth/register` | Cadastrar um novo usuário | Não |
| POST | `/auth/login` | Autenticar um usuário e retornar o token JWT | Não |

**POST `/auth/register`**

Recebe os dados necessários para cadastrar um usuário, realiza as validações, verifica se o e-mail e o CPF já estão cadastrados e armazena a senha utilizando hash.

A resposta deverá retornar os dados públicos do usuário criado, sem expor a senha ou outros dados sensíveis desnecessários.

**POST `/auth/login`**

Recebe e-mail e senha, verifica as credenciais e retorna um token JWT válido para autenticação nas rotas protegidas.

### 10.2. Usuários

| Método | Rota | Descrição | Autenticação |
|---|---|---|---|
| GET | `/users/me` | Consultar os dados do usuário autenticado | Sim |
| PATCH | `/users/me` | Atualizar telefone e endereço | Sim |
| GET | `/users/me/favorites` | Listar os animais favoritados | Sim |
| POST | `/users/me/favorites/:animalPostId` | Adicionar um animal aos favoritos | Sim |
| DELETE | `/users/me/favorites/:animalPostId` | Remover um animal dos favoritos | Sim |
| GET | `/users/me/animal-posts` | Listar as publicações do usuário autenticado | Sim |

**GET `/users/me`**

Retorna os dados do usuário autenticado, respeitando a proteção de informações sensíveis.

**PATCH `/users/me`**

Permite atualizar somente o telefone e o endereço do usuário. Não deverá permitir alterações de CPF, e-mail, senha ou outros campos não previstos nesse requisito.

**GET `/users/me/favorites`**

Retorna as publicações favorizadas pelo usuário, com suporte à paginação.

Publicações removidas ou que não estejam mais disponíveis não deverão aparecer na listagem de favoritos.

**POST `/users/me/favorites/:animalPostId`**

Adiciona uma publicação aos favoritos do usuário autenticado.

Não deverá permitir a inclusão de referências duplicadas.

**DELETE `/users/me/favorites/:animalPostId`**

Remove uma publicação dos favoritos do usuário autenticado.

**GET `/users/me/animal-posts`**

Retorna todas as publicações criadas pelo usuário autenticado, independentemente do status.

A resposta deverá possuir paginação.

### 10.3. Publicações de animais

| Método | Rota | Descrição | Autenticação |
|---|---|---|---|
| POST | `/animal-posts` | Criar uma publicação de animal | Sim |
| GET | `/animal-posts` | Listar publicações disponíveis | Não |
| GET | `/animal-posts/:id` | Consultar uma publicação específica | Não |
| PATCH | `/animal-posts/:id` | Atualizar uma publicação | Sim |
| PATCH | `/animal-posts/:id/confirm-availability` | Confirmar que o animal continua disponível | Sim |
| PATCH | `/animal-posts/:id/adopt` | Marcar o animal como adotado | Sim |

**POST `/animal-posts`**

Permite que um usuário autenticado crie uma publicação.

O proprietário deverá ser definido automaticamente com base no usuário autenticado.

Na criação:
- `publishedAt` deverá receber a data atual.
- `returnDate` deverá receber a data atual acrescida de 30 dias.
- `status` deverá iniciar como true.

**GET `/animal-posts`**

Retorna as publicações com status true.

Deverá permitir paginação e filtragem por espécie por meio de query parameters.

Exemplo:

`GET /animal-posts?page=1&limit=10&species=DOG`

Os parâmetros deverão funcionar da seguinte forma:

- `page`: página solicitada.
- `limit`: quantidade de registros por página.
- `species`: espécie utilizada para filtrar os animais. Opcional.

A filtragem por espécie deverá ocorrer na mesma rota, sem a necessidade de criar um endpoint específico para cada espécie.

**GET `/animal-posts/:id`**

Retorna os dados públicos de uma publicação específica, incluindo as informações do animal e os dados de contato do responsável.

Não deverá expor dados sensíveis do proprietário.

**PATCH `/animal-posts/:id`**

Permite que o proprietário atualize as informações da publicação.

Poderão ser atualizados os dados do animal, como nome, espécie, idade, peso, vacinas, enfermidades e imagem.

Não será permitido alterar:
- O proprietário da publicação.
- O identificador da publicação.
- A data original de publicação (`publishedAt`).
- Os campos de controle interno que não fazem parte da edição prevista.

A operação deverá verificar se o usuário autenticado é o proprietário da publicação.

**PATCH `/animal-posts/:id/confirm-availability`**

Permite que o proprietário confirme que o animal continua disponível para adoção.

Ao confirmar:
- Verificar se o usuário autenticado é o proprietário.
- Atualizar `returnDate` para a data atual acrescida de 30 dias.
- Atualiza o status para true
- Manter `publishedAt` inalterado.

Essa operação deverá ser independente da atualização comum da publicação.

**PATCH `/animal-posts/:id/adopt`**

Permite que o proprietário marque o animal como adotado.

Ao realizar a operação:
- Verificar se o usuário autenticado é o proprietário.
- Atualizar o status da publicação para false.
- Impedir que a publicação continue aparecendo na listagem pública de animais disponíveis.

### 10.4. Regras gerais das rotas

- Rotas protegidas deverão utilizar middleware ou mecanismo equivalente de autenticação JWT.
- Operações de edição, confirmação de disponibilidade e adoção deverão verificar a propriedade da publicação.
- A API deverá retornar códigos HTTP adequados para cada situação.
- Listagens deverão possuir paginação.
- Erros deverão seguir um padrão consistente de resposta.
- As validações deverão ocorrer antes da execução das regras de negócio.
- Não deverá existir uma rota HTTP para a desativação automática de publicações, pois essa responsabilidade será executada pelo sistema de tarefas agendadas.

## 11. Entrega e execução

Não implemente todo o sistema em um único arquivo.

Primeiramente:

1. Analise a estrutura atual do projeto.
2. Identifique os padrões existentes.
3. Apresente a estrutura de diretórios proposta.
4. Explique brevemente como os módulos serão organizados.

Depois, implemente progressivamente:

1. Types e Models.
2. Repositories.
3. Services.
4. Controllers.
5. Routes.
6. Jobs.
7. Integrações necessárias.

Ao finalizar:

- Verifique se o TypeScript compila.
- Verifique se as dependências estão corretamente configuradas.
- Verifique se as rotas estão registradas.
- Verifique se as regras de autorização estão sendo respeitadas.
- Apresente um resumo dos arquivos criados e modificados.
- Apresente exemplos de requisições e respostas dos principais endpoints.

Priorize código simples, legível, tipado e de fácil manutenção.

Não implemente funcionalidades além do escopo sem antes justificar sua necessidade.

Se alguma regra funcional apresentar ambiguidade, explique o problema e apresente uma decisão técnica antes de implementá-la.