# 🎬 API REST — Filmes & Prática de Tradução

Documentação de referência para os endpoints de listagem de filmes, detalhes e prática de tradução com repetição espaçada.

---

## Índice

- [Visão Geral](#visão-geral)
- [Autenticação](#autenticação)
- [Fluxo da Prática](#fluxo-da-prática)
- [Endpoints](#endpoints)
  - [Listagem de Filmes](#1-listagem-de-filmes)
  - [Detalhes do Filme](#2-detalhes-do-filme)
  - [Próximo Card](#3-próximo-card)
  - [Submeter Revisão](#4-submeter-revisão)
- [Códigos de Erro](#códigos-de-erro)
- [Modelos de Dados](#modelos-de-dados)

---

## Visão Geral

**Base URL:**
```
https://api.exemplo.com/v1
```

**Content-Type:** `application/json`

**Formato de resposta:** Todas as respostas são retornadas em JSON.

> A prática é vinculada a um filme e não possui fim. Cada card é um trecho de áudio do filme que o usuário deve traduzir selecionando a opção correta. O sistema utiliza um algoritmo de repetição espaçada para determinar quando cada card deve ser revisitado, garantindo a memorização progressiva.

## Fluxo da Prática

O fluxo é um ciclo contínuo sem início ou fim definidos. O sistema decide qual card apresentar com base no algoritmo de repetição espaçada.

```
┌──────────────────────────────────────────────┐
│  GET /movies/{movie_id}/practice/next        │
│  ← card com áudio + opções de tradução       │
└───────────────────┬──────────────────────────┘
                    │
                    │  usuário ouve o áudio
                    │  e seleciona uma opção
                    │
                    ▼
┌──────────────────────────────────────────────┐
│  POST /movies/{movie_id}/practice/           │
│        cards/{card_id}/review                │
│  → selected_option_id                        │
│  ← resultado + data da próxima revisão       │
└───────────────────┬──────────────────────────┘
                    │
                    │  algoritmo agenda
                    │  próxima revisão do card
                    │
                    ▼
          GET .../practice/next  ♻️
```

---

## Endpoints

### 1. Listagem de Filmes

Retorna uma lista paginada de filmes disponíveis na plataforma.

```
GET /movies
```

#### Query Parameters

| Parâmetro | Tipo      | Obrigatório | Descrição                                                      |
|-----------|-----------|-------------|----------------------------------------------------------------|
| `page`    | `integer` | Não         | Número da página (padrão: `1`)                                 |
| `limit`   | `integer` | Não         | Itens por página (padrão: `20`, máx: `100`)                    |
| `genre`   | `string`  | Não         | Filtrar por gênero (ex: `action`, `drama`)                     |
| `search`  | `string`  | Não         | Busca por título do filme                                      |
| `sort`    | `string`  | Não         | Ordenação: `title`, `release_date`, `rating` (padrão: `title`) |
| `order`   | `string`  | Não         | Direção: `asc` ou `desc` (padrão: `asc`)                       |

#### Exemplo de Requisição

```http
GET /movies?page=1&limit=10
```

#### Resposta `200 OK`

```json
{
  "data": [
    {
      "id": "f1a2b3c4",
      "title": "Matrix",
      "practice": {
        "total_cards": 42,
        "cards_due": 5
      }
    },
    {
      "id": "d5e6f7g8",
      "title": "Interstellar",
      "practice": {
        "total_cards": 38,
        "cards_due": 0
      }
    }
  ],
  "pagination": {
    "current_page": 1,
    "per_page": 10,
    "total_items": 243,
    "total_pages": 25
  }
}
```

---

### 2. Detalhes do Filme

Retorna as informações completas de um filme e o resumo do progresso de prática do usuário.

```
GET /movies/{movie_id}
```

#### Path Parameters

| Parâmetro  | Tipo     | Obrigatório | Descrição         |
|------------|----------|-------------|-------------------|
| `movie_id` | `string` | Sim         | ID único do filme |

#### Exemplo de Requisição

```http
GET /movies/f1a2b3c4
```

#### Resposta `200 OK`

```json
{
  "id": "f1a2b3c4",
  "title": "Matrix",
  "practice": {
    "total_cards": 42,
    "cards_due": 5,
    "cards_reviewed": 30,
    "next_review_at": "2025-03-21T09:00:00Z"
  }
}
```

---

### 3. Próximo Card

Retorna o próximo card de prática para o usuário com base no algoritmo de repetição espaçada. O sistema determina automaticamente qual trecho de áudio deve ser revisado neste momento.

```
GET /movies/{movie_id}/practice/next
```

#### Path Parameters

| Parâmetro  | Tipo     | Obrigatório | Descrição         |
|------------|----------|-------------|-------------------|
| `movie_id` | `string` | Sim         | ID único do filme |

#### Exemplo de Requisição

```http
GET /movies/f1a2b3c4/practice/next
```

#### Resposta — Card disponível `200 OK`

```json
{
  "card": {
    "id": "card_7h8i9j0k",
    "movie_id": "f1a2b3c4",
    "audio_url": "https://cdn.exemplo.com/cards/f1a2b3c4/card_7h8i9j0k.mp3",
    "value": "Unfortunately, no one can be told what the Matrix is.",
    "instruction": "Ouça o trecho e selecione a tradução correta.",
    "options": [
      { "id": "opt_a", "value": "Você acha que o ar que respira é real?" },
      { "id": "opt_b", "value": "Infelizmente, ninguém pode ser informado sobre o que é Matrix." },
      { "id": "opt_c", "value": "Você tomou a pílula errada." },
      { "id": "opt_d", "value": "Eu sei que você está aqui, Neo." }
    ]
  }
}
```

#### Resposta — Nenhum card disponível no momento `200 OK`

Retornado quando todos os cards foram revisados e nenhum atingiu ainda seu tempo de revisão.

```json
{
  "card": null,
  "next_review_at": "2025-03-21T09:00:00Z",
  "message": "Nenhum card disponível no momento. Volte em breve para a próxima revisão."
}
```

---

### 4. Submeter Revisão

Registra a resposta do usuário para um card e aciona o algoritmo de repetição espaçada para agendar a próxima revisão daquele card.

```
POST /movies/{movie_id}/practice/cards/{card_id}/review
```

#### Path Parameters

| Parâmetro  | Tipo     | Obrigatório | Descrição          |
|------------|----------|-------------|--------------------|
| `movie_id` | `string` | Sim         | ID único do filme  |
| `card_id`  | `string` | Sim         | ID único do card   |

#### Request Body

```json
{
  "selected_option_id": "opt_b",
  "response_time_ms": 3200
}
```

| Campo                | Tipo      | Obrigatório | Descrição                                                        |
|----------------------|-----------|-------------|------------------------------------------------------------------|
| `selected_option_id` | `string`  | Sim         | ID da opção selecionada pelo usuário                             |
| `response_time_ms`   | `integer` | Não         | Tempo em milissegundos entre o fim do áudio e a seleção da opção |

#### Exemplo de Requisição

```http
POST /movies/f1a2b3c4/practice/cards/card_7h8i9j0k/review
Content-Type: application/json

{
  "selected_option_id": "opt_b",
  "response_time_ms": 3200
}
```

#### Resposta `200 OK`

```json
{
  "card_id": "card_7h8i9j0k",
  "selected_option": { "id": "opt_b", "value": "Infelizmente, ninguém pode ser informado sobre o que é Matrix." },
  "correct": true,
  "correct_option": { "id": "opt_b", "value": "Infelizmente, ninguém pode ser informado sobre o que é Matrix." },
  "next_review_at": "2025-03-24T09:00:00Z",
  "practice_summary": {
    "cards_reviewed_today": 8,
    "cards_due": 4
  }
}
```

> **Nota:** O campo `next_review_at` é calculado pelo algoritmo de repetição espaçada. Respostas corretas espaçam progressivamente o intervalo de revisão; respostas incorretas reiniciam o ciclo para aquele card.

---

## Códigos de Erro

| Código | Status                | Descrição                                              |
|--------|-----------------------|--------------------------------------------------------|
| `400`  | Bad Request           | Parâmetros inválidos ou ausentes na requisição         |
| `401`  | Unauthorized          | Token ausente, inválido ou expirado                    |
| `403`  | Forbidden             | Usuário sem permissão para o recurso                   |
| `404`  | Not Found             | Filme ou card não encontrado                           |
| `409`  | Conflict              | Revisão já registrada para este card nesta sessão      |
| `429`  | Too Many Requests     | Limite de requisições excedido                         |
| `500`  | Internal Server Error | Erro interno no servidor                               |

#### Formato do Objeto de Erro

```json
{
  "error": {
    "code": "CARD_NOT_FOUND",
    "message": "O card informado não existe ou não pertence a este filme.",
    "details": {
      "card_id": "card_7h8i9j0k",
      "movie_id": "f1a2b3c4"
    }
  }
}
```
