# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Idioma

O projeto é escrito em português brasileiro (nomes de classes, variáveis, mensagens de erro, endpoints). Manter esse padrão em todo código novo.

## Visão Geral

Sistema fullstack de autuação de veículos de trânsito.

- `back/` — API REST em Java 25 e Spring Boot 4.0.3
- `front/` — SPA em TypeScript vanilla com Vite e Tailwind CSS v4

## Comandos de Build e Desenvolvimento

### Backend (`back/`)

```bash
# Compilar
./mvnw compile

# Executar a aplicação (porta 8080)
./mvnw spring-boot:run

# Executar todos os testes
./mvnw test

# Executar um único teste
./mvnw test -Dtest=TransitoApplicationTests

# Build completo com testes
./mvnw package
```

### Frontend (`front/`)

```bash
# Instalar dependências
npm install

# Servidor de desenvolvimento
npm run dev

# Verificação de tipos
npm run typecheck

# Build de produção
npm run build

# Preview local do build
npm run preview
```

## Pré-requisitos

- Java 25
- Node 24+
- MySQL rodando em `localhost:3306` (o banco `transito` é criado automaticamente via `createDatabaseIfNotExist=true`)
- As migrações Flyway em `back/src/main/resources/db/migration/` são aplicadas automaticamente ao iniciar

## Arquitetura

Pacote raiz do backend: `com.template.transito`

### Backend

A API segue separação em camadas com isolamento entre Domain Model e Representation Model (DTOs).

- `domain.model` — Entidades JPA: `Proprietario`, `Veiculo`, `Autuacao`, `StatusVeiculo`
- `domain.repository` — Spring Data JPA repositories. `VeiculoRepository` expõe `findByPlaca()` e `ProprietarioRepository` expõe `findByEmail()`
- `domain.service` — Regras de negócio para cadastro de veículo, cadastro de proprietário, apreensão/liberação e registro de autuação
- `domain.exception` — `NegocioException` e `EntidadeNaoEncontradaException`
- `domain.validation` — `ValidationGroups` usados na validação em cascata do proprietário no cadastro de veículo
- `api.controller` — Controllers REST para proprietários, veículos e autuações
- `api.model` e `api.model.dto` — models de saída e DTOs de entrada
- `api.assembler` — conversão entre entidade e DTO/Model usando ModelMapper
- `api.exceptionhandler` — tratamento global com `ProblemDetail`
- `common/ModelMapperConfig` — configuração do bean `ModelMapper`

### Frontend

O frontend em `front/` é uma SPA sem framework de componentes, com renderização manual em TypeScript.

- `src/main.ts` — bootstrap da aplicação e inicialização do tema
- `src/app.ts` — estado da interface, renderização e eventos
- `src/api/cliente.ts` — cliente HTTP tipado para consumir a API
- `src/core` — utilitários de tema, formatação e escape de HTML
- `src/tipos/api.ts` — contratos usados pelo frontend, espelhando os modelos expostos pelo backend
- `vite.config.ts` — plugin oficial do Tailwind CSS v4 e proxy `/api` para `http://localhost:8080`

## Padrões Importantes

- **Lombok**: entidades e DTOs usam `@Getter`/`@Setter`. Entidades usam `@EqualsAndHashCode(onlyExplicitlyIncluded = true)` com `@EqualsAndHashCode.Include` apenas no campo `id`.
- **Validação**: DTOs usam Bean Validation (`@NotBlank`, `@NotNull`, `@Pattern`, `@Positive`). No frontend, as validações visíveis da API são espelhadas nos formulários.
- **Migrações Flyway**: arquivos SQL em `back/src/main/resources/db/migration/` com prefixo `V00N__descricao.sql`. Nunca alterar migrações já aplicadas; sempre criar novas.
- **Ações não-CRUD**: apreensão/liberação de veículo são modeladas como sub-recursos (`/veiculos/{id}/apreensao`) com `PUT` e `DELETE`.
- **Tratamento de erros**: respostas de erro seguem `ProblemDetail`. O frontend lê `title` e `detail` para feedback ao usuário.
- **Escopo da UI**: o frontend implementa apenas os fluxos já disponíveis na API atual — proprietários (CRUD), veículos (listagem, cadastro, apreensão e liberação) e autuações como sub-recurso de veículo.
- **Integração local**: no frontend, as chamadas usam o prefixo `/api`; o Vite reescreve esse prefixo para o backend em `localhost:8080`.
- **Tema**: o modo claro/escuro é manual, persistido em `localStorage` com a chave `transito.tema` e aplicado pela classe `dark` no elemento raiz.
