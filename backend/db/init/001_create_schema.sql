-- ============================================================
-- Movie Lingo — Schema
-- ============================================================

CREATE TABLE users (
    id              VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    token           VARCHAR(255) NOT NULL UNIQUE,
    native_language VARCHAR(5)   NOT NULL,
    language_locked BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_token ON users(token);

COMMENT ON TABLE  users IS 'Usuários da plataforma';
COMMENT ON COLUMN users.token IS 'Token Bearer usado para autenticação nas requisições';
COMMENT ON COLUMN users.native_language IS 'Idioma nativo do usuário (ex: pt, en, fr). Define o idioma das opções de tradução exibidas';
COMMENT ON COLUMN users.language_locked IS 'Trava após a primeira prática em qualquer filme; impede troca de idioma depois de iniciado';

CREATE TABLE movies (
    id                VARCHAR(64)  PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title             VARCHAR(255) NOT NULL,
    original_language VARCHAR(5)   NOT NULL,
    genre             VARCHAR(100),
    release_date      DATE,
    rating            NUMERIC(3,1),
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  movies IS 'Filmes disponíveis para prática';
COMMENT ON COLUMN movies.original_language IS 'Idioma original do filme (ex: en). O áudio dos cards é nesse idioma';
COMMENT ON COLUMN movies.genre IS 'Gênero para filtragem na listagem (ex: action, drama, sci-fi)';
COMMENT ON COLUMN movies.rating IS 'Nota do filme (ex: 8.7). Usado para ordenação na listagem';

CREATE TABLE cards (
    id          VARCHAR(64)  PRIMARY KEY DEFAULT gen_random_uuid()::text,
    movie_id    VARCHAR(64)  NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    position    INTEGER      NOT NULL,
    audio_url   VARCHAR(512),
    value       TEXT         NOT NULL,
    instruction VARCHAR(512) NOT NULL DEFAULT 'Ouça o trecho e selecione a tradução correta.',
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE(movie_id, position)
);

CREATE INDEX idx_cards_movie_position ON cards(movie_id, position);

COMMENT ON TABLE  cards IS 'Cards de prática — cada card é um trecho de diálogo do filme que o usuário deve traduzir';
COMMENT ON COLUMN cards.position IS 'Ordem sequencial do diálogo no filme (1, 2, 3...). Define a posição do card na janela de treino';
COMMENT ON COLUMN cards.audio_url IS 'URL do áudio da fala original. NULL enquanto o áudio não foi gerado; cards sem áudio não aparecem no app';
COMMENT ON COLUMN cards.value IS 'Transcrição da fala no idioma original do filme. Texto usado para gerar o áudio';
COMMENT ON COLUMN cards.instruction IS 'Instrução exibida ao usuário no card';

CREATE TABLE card_options (
    id            VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    card_id       VARCHAR(64) NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    language      VARCHAR(5)  NOT NULL,
    value         TEXT        NOT NULL,
    is_correct    BOOLEAN     NOT NULL DEFAULT FALSE,
    display_order INTEGER     NOT NULL DEFAULT 0
);

CREATE INDEX idx_card_options_card_lang ON card_options(card_id, language);
CREATE UNIQUE INDEX idx_card_options_one_correct
    ON card_options(card_id, language) WHERE is_correct = TRUE;

COMMENT ON TABLE  card_options IS 'Opções de tradução por card e idioma. Cada card tem 4 opções por idioma, sendo exatamente 1 correta';
COMMENT ON COLUMN card_options.language IS 'Idioma desta opção (deve corresponder ao native_language do usuário)';
COMMENT ON COLUMN card_options.value IS 'Texto da opção de tradução exibida ao usuário';
COMMENT ON COLUMN card_options.is_correct IS 'Indica se esta é a tradução correta do áudio';
COMMENT ON COLUMN card_options.display_order IS 'Ordem de exibição das opções (1, 2, 3, 4)';

CREATE TABLE user_movie_progress (
    id           VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id      VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    movie_id     VARCHAR(64) NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    window_start INTEGER     NOT NULL DEFAULT 1,
    window_size  INTEGER     NOT NULL DEFAULT 10,
    started_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, movie_id)
);

COMMENT ON TABLE  user_movie_progress IS 'Progresso do usuário por filme — controla a janela de treino. A janela avança 1 posição quando todos os cards dentro dela atingem maturidade suficiente';
COMMENT ON COLUMN user_movie_progress.window_start IS 'Posição (cards.position) do primeiro card na janela atual';
COMMENT ON COLUMN user_movie_progress.window_size IS 'Quantidade de cards visíveis na janela (ex: 10 significa janela de window_start até window_start+9)';
COMMENT ON COLUMN user_movie_progress.started_at IS 'Quando o usuário iniciou a prática neste filme';

CREATE TABLE user_card_progress (
    id                  VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id             VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    card_id             VARCHAR(64) NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    in_training_window  BOOLEAN     NOT NULL DEFAULT TRUE,
    training_maturity   NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    consecutive_correct INTEGER     NOT NULL DEFAULT 0,
    repetition          INTEGER     NOT NULL DEFAULT 0,
    ease_factor         NUMERIC(4,2) NOT NULL DEFAULT 2.50,
    interval_days       NUMERIC(7,2) NOT NULL DEFAULT 0,
    next_review_at      TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, card_id)
);

CREATE INDEX idx_ucp_user_next_review ON user_card_progress(user_id, next_review_at);

COMMENT ON TABLE  user_card_progress IS 'Progresso do usuário por card — unifica janela de treino e repetição espaçada (SM-2). O campo in_training_window define qual algoritmo governa o card';
COMMENT ON COLUMN user_card_progress.in_training_window IS 'TRUE = card está na janela de treino (usa training_maturity); FALSE = card graduou para repetição espaçada (usa campos SM-2)';
COMMENT ON COLUMN user_card_progress.training_maturity IS 'Maturidade de 0 a 100. Leva em conta acertos e tempo de resposta. Card gradua da janela ao atingir 80';
COMMENT ON COLUMN user_card_progress.consecutive_correct IS 'Quantidade de acertos consecutivos. Reseta a zero em caso de erro';
COMMENT ON COLUMN user_card_progress.repetition IS 'SM-2: número de revisões corretas consecutivas no ciclo de repetição espaçada';
COMMENT ON COLUMN user_card_progress.ease_factor IS 'SM-2: fator de facilidade (mínimo 1.30, padrão 2.50). Ajustado pelo tempo de resposta do usuário';
COMMENT ON COLUMN user_card_progress.interval_days IS 'SM-2: intervalo em dias até a próxima revisão. Cresce a cada acerto multiplicado pelo ease_factor';
COMMENT ON COLUMN user_card_progress.next_review_at IS 'Data/hora da próxima revisão. Cards com next_review_at <= NOW() estão devidos para revisão';

CREATE TABLE user_card_reviews (
    id                 VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id            VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    card_id            VARCHAR(64) NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    selected_option_id VARCHAR(64) NOT NULL REFERENCES card_options(id),
    correct            BOOLEAN     NOT NULL,
    response_time_ms   INTEGER     NOT NULL,
    reviewed_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ucr_user_card ON user_card_reviews(user_id, card_id);
CREATE INDEX idx_ucr_user_reviewed_at ON user_card_reviews(user_id, reviewed_at);

COMMENT ON TABLE  user_card_reviews IS 'Log imutável de cada resposta submetida. Nunca é atualizado ou deletado — serve como histórico completo de revisões';
COMMENT ON COLUMN user_card_reviews.selected_option_id IS 'Opção que o usuário escolheu';
COMMENT ON COLUMN user_card_reviews.correct IS 'Se a opção escolhida era a tradução correta';
COMMENT ON COLUMN user_card_reviews.response_time_ms IS 'Milissegundos entre o fim do áudio e a seleção da opção. Influencia a maturidade na janela e o quality score no SM-2';
COMMENT ON COLUMN user_card_reviews.reviewed_at IS 'Quando a revisão foi submetida';
