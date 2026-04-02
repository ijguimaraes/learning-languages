-- ============================================================
-- Movie Lingo — Seed Data
-- ============================================================

-- Test user
INSERT INTO users (id, token, native_language, language_locked)
VALUES ('user_test_01', 'fake-token-for-wiremock', 'pt', FALSE);

-- Movies
INSERT INTO movies (id, title, original_language, genre, release_date, rating) VALUES
    ('f1a2b3c4', 'Matrix',        'en', 'action',  '1999-03-31', 8.7),
    ('d5e6f7g8', 'Interstellar',  'en', 'sci-fi',  '2014-11-07', 8.6);

-- Cards for Matrix (10 cards, positions 1-10)
INSERT INTO cards (id, movie_id, position, audio_url, value) VALUES
    ('card_7h8i9j0k', 'f1a2b3c4', 1,  'http://192.168.1.19:3000/v1/audio/output.mp3', 'Unfortunately, no one can be told what the Matrix is.'),
    ('card_matrix_02', 'f1a2b3c4', 2,  'http://192.168.1.19:3000/v1/audio/output.mp3', 'I can only show you the door. You are the one that has to walk through it.'),
    ('card_matrix_03', 'f1a2b3c4', 3,  'http://192.168.1.19:3000/v1/audio/output.mp3', 'Do not try and bend the spoon. That is impossible.'),
    ('card_matrix_04', 'f1a2b3c4', 4,  'http://192.168.1.19:3000/v1/audio/output.mp3', 'Have you ever had a dream that you were so sure was real?'),
    ('card_matrix_05', 'f1a2b3c4', 5,  'http://192.168.1.19:3000/v1/audio/output.mp3', 'Welcome to the desert of the real.'),
    ('card_matrix_06', 'f1a2b3c4', 6,  'http://192.168.1.19:3000/v1/audio/output.mp3', 'I know kung fu.'),
    ('card_matrix_07', 'f1a2b3c4', 7,  'http://192.168.1.19:3000/v1/audio/output.mp3', 'Choice is an illusion created between those with power and those without.'),
    ('card_matrix_08', 'f1a2b3c4', 8,  'http://192.168.1.19:3000/v1/audio/output.mp3', 'The Matrix is the world that has been pulled over your eyes to blind you from the truth.'),
    ('card_matrix_09', 'f1a2b3c4', 9,  'http://192.168.1.19:3000/v1/audio/output.mp3', 'You are the One, Neo.'),
    ('card_matrix_10', 'f1a2b3c4', 10, 'http://192.168.1.19:3000/v1/audio/output.mp3', 'Free your mind.');

-- Cards for Interstellar (10 cards, positions 1-10)
INSERT INTO cards (id, movie_id, position, audio_url, value) VALUES
    ('card_inter_01', 'd5e6f7g8', 1,  'http://192.168.1.19:3000/v1/audio/output.mp3', 'Mankind was born on Earth. It was never meant to die here.'),
    ('card_inter_02', 'd5e6f7g8', 2,  'http://192.168.1.19:3000/v1/audio/output.mp3', 'Do not go gentle into that good night.'),
    ('card_inter_03', 'd5e6f7g8', 3,  'http://192.168.1.19:3000/v1/audio/output.mp3', 'Love is the one thing that transcends time and space.'),
    ('card_inter_04', 'd5e6f7g8', 4,  'http://192.168.1.19:3000/v1/audio/output.mp3', 'We used to look up at the sky and wonder at our place in the stars.'),
    ('card_inter_05', 'd5e6f7g8', 5,  'http://192.168.1.19:3000/v1/audio/output.mp3', 'One hour there equals seven years back on Earth.'),
    ('card_inter_06', 'd5e6f7g8', 6,  'http://192.168.1.19:3000/v1/audio/output.mp3', 'I am coming back.'),
    ('card_inter_07', 'd5e6f7g8', 7,  'http://192.168.1.19:3000/v1/audio/output.mp3', 'Gravity cannot be a choice.'),
    ('card_inter_08', 'd5e6f7g8', 8,  'http://192.168.1.19:3000/v1/audio/output.mp3', 'Nature is not evil, but it is not good either.'),
    ('card_inter_09', 'd5e6f7g8', 9,  'http://192.168.1.19:3000/v1/audio/output.mp3', 'We were not meant to save the world. We were meant to find a new home.'),
    ('card_inter_10', 'd5e6f7g8', 10, 'http://192.168.1.19:3000/v1/audio/output.mp3', 'Rage, rage against the dying of the light.');

-- ============================================================
-- Card options in Portuguese (pt) for Matrix cards
-- ============================================================

-- Card 1 (card_7h8i9j0k) — same options as current mock
INSERT INTO card_options (id, card_id, language, value, is_correct, display_order) VALUES
    ('opt_a', 'card_7h8i9j0k', 'pt', 'Você acha que o ar que respira é real?',                                FALSE, 1),
    ('opt_b', 'card_7h8i9j0k', 'pt', 'Infelizmente, ninguém pode ser informado sobre o que é Matrix.',        TRUE,  2),
    ('opt_c', 'card_7h8i9j0k', 'pt', 'Você tomou a pílula errada.',                                           FALSE, 3),
    ('opt_d', 'card_7h8i9j0k', 'pt', 'Eu sei que você está aqui, Neo.',                                       FALSE, 4);

-- Card 2
INSERT INTO card_options (id, card_id, language, value, is_correct, display_order) VALUES
    ('opt_m02_a', 'card_matrix_02', 'pt', 'Eu só posso te mostrar a porta. Você é quem tem que atravessá-la.', TRUE,  1),
    ('opt_m02_b', 'card_matrix_02', 'pt', 'Não tente dobrar a colher.',                                        FALSE, 2),
    ('opt_m02_c', 'card_matrix_02', 'pt', 'A Matrix está em todo lugar.',                                      FALSE, 3),
    ('opt_m02_d', 'card_matrix_02', 'pt', 'Você já teve um sonho que parecia real?',                            FALSE, 4);

-- Card 3
INSERT INTO card_options (id, card_id, language, value, is_correct, display_order) VALUES
    ('opt_m03_a', 'card_matrix_03', 'pt', 'Liberte sua mente.',                                                FALSE, 1),
    ('opt_m03_b', 'card_matrix_03', 'pt', 'A ignorância é uma bênção.',                                        FALSE, 2),
    ('opt_m03_c', 'card_matrix_03', 'pt', 'Não tente dobrar a colher. Isso é impossível.',                     TRUE,  3),
    ('opt_m03_d', 'card_matrix_03', 'pt', 'Bem-vindo ao deserto do real.',                                     FALSE, 4);

-- Card 4
INSERT INTO card_options (id, card_id, language, value, is_correct, display_order) VALUES
    ('opt_m04_a', 'card_matrix_04', 'pt', 'A Matrix é um sistema, Neo.',                                       FALSE, 1),
    ('opt_m04_b', 'card_matrix_04', 'pt', 'Você já teve um sonho que parecia real?',                            TRUE,  2),
    ('opt_m04_c', 'card_matrix_04', 'pt', 'Eu sei kung fu.',                                                   FALSE, 3),
    ('opt_m04_d', 'card_matrix_04', 'pt', 'A escolha é uma ilusão.',                                           FALSE, 4);

-- Card 5
INSERT INTO card_options (id, card_id, language, value, is_correct, display_order) VALUES
    ('opt_m05_a', 'card_matrix_05', 'pt', 'O que é real? Como você define real?',                               FALSE, 1),
    ('opt_m05_b', 'card_matrix_05', 'pt', 'Eu sei que você está aqui, Neo.',                                    FALSE, 2),
    ('opt_m05_c', 'card_matrix_05', 'pt', 'Bem-vindo ao deserto do real.',                                      TRUE,  3),
    ('opt_m05_d', 'card_matrix_05', 'pt', 'Tudo começa com uma escolha.',                                       FALSE, 4);

-- Card 6
INSERT INTO card_options (id, card_id, language, value, is_correct, display_order) VALUES
    ('opt_m06_a', 'card_matrix_06', 'pt', 'Eu sei kung fu.',                                                    TRUE,  1),
    ('opt_m06_b', 'card_matrix_06', 'pt', 'A Matrix é o mundo puxado sobre seus olhos.',                        FALSE, 2),
    ('opt_m06_c', 'card_matrix_06', 'pt', 'Não existe colher.',                                                 FALSE, 3),
    ('opt_m06_d', 'card_matrix_06', 'pt', 'Você acha que isso é ar que está respirando?',                       FALSE, 4);

-- Card 7
INSERT INTO card_options (id, card_id, language, value, is_correct, display_order) VALUES
    ('opt_m07_a', 'card_matrix_07', 'pt', 'Tudo começa com uma escolha.',                                       FALSE, 1),
    ('opt_m07_b', 'card_matrix_07', 'pt', 'A escolha é uma ilusão.',                                            TRUE,  2),
    ('opt_m07_c', 'card_matrix_07', 'pt', 'A ignorância é uma bênção.',                                         FALSE, 3),
    ('opt_m07_d', 'card_matrix_07', 'pt', 'Liberte sua mente.',                                                 FALSE, 4);

-- Card 8
INSERT INTO card_options (id, card_id, language, value, is_correct, display_order) VALUES
    ('opt_m08_a', 'card_matrix_08', 'pt', 'A Matrix está em todo lugar.',                                       FALSE, 1),
    ('opt_m08_b', 'card_matrix_08', 'pt', 'Você é o Escolhido, Neo.',                                           FALSE, 2),
    ('opt_m08_c', 'card_matrix_08', 'pt', 'O que é real? Como você define real?',                                FALSE, 3),
    ('opt_m08_d', 'card_matrix_08', 'pt', 'A Matrix é o mundo puxado sobre seus olhos para cegá-lo da verdade.', TRUE,  4);

-- Card 9
INSERT INTO card_options (id, card_id, language, value, is_correct, display_order) VALUES
    ('opt_m09_a', 'card_matrix_09', 'pt', 'Você é o Escolhido, Neo.',                                           TRUE,  1),
    ('opt_m09_b', 'card_matrix_09', 'pt', 'Eu só posso te mostrar a porta.',                                    FALSE, 2),
    ('opt_m09_c', 'card_matrix_09', 'pt', 'Não tente dobrar a colher.',                                         FALSE, 3),
    ('opt_m09_d', 'card_matrix_09', 'pt', 'A escolha é sua.',                                                   FALSE, 4);

-- Card 10
INSERT INTO card_options (id, card_id, language, value, is_correct, display_order) VALUES
    ('opt_m10_a', 'card_matrix_10', 'pt', 'Tudo começa com uma escolha.',                                       FALSE, 1),
    ('opt_m10_b', 'card_matrix_10', 'pt', 'Liberte sua mente.',                                                 TRUE,  2),
    ('opt_m10_c', 'card_matrix_10', 'pt', 'A Matrix é um sistema, Neo.',                                        FALSE, 3),
    ('opt_m10_d', 'card_matrix_10', 'pt', 'Bem-vindo ao deserto do real.',                                      FALSE, 4);

-- ============================================================
-- Card options in Portuguese (pt) for Interstellar cards
-- ============================================================

-- Card 1
INSERT INTO card_options (id, card_id, language, value, is_correct, display_order) VALUES
    ('opt_i01_a', 'card_inter_01', 'pt', 'Nós não fomos feitos para salvar o mundo.',                           FALSE, 1),
    ('opt_i01_b', 'card_inter_01', 'pt', 'A humanidade nasceu na Terra, mas não foi feita para morrer aqui.',   TRUE,  2),
    ('opt_i01_c', 'card_inter_01', 'pt', 'O amor é a única coisa que transcende o tempo e o espaço.',           FALSE, 3),
    ('opt_i01_d', 'card_inter_01', 'pt', 'Não vá gentilmente nessa boa noite.',                                 FALSE, 4);

-- Card 2
INSERT INTO card_options (id, card_id, language, value, is_correct, display_order) VALUES
    ('opt_i02_a', 'card_inter_02', 'pt', 'Não vá gentilmente nessa boa noite.',                                 TRUE,  1),
    ('opt_i02_b', 'card_inter_02', 'pt', 'Nós costumávamos olhar para o céu e nos perguntar.',                  FALSE, 2),
    ('opt_i02_c', 'card_inter_02', 'pt', 'A gravidade não pode ser uma escolha.',                               FALSE, 3),
    ('opt_i02_d', 'card_inter_02', 'pt', 'Eu vou voltar.',                                                      FALSE, 4);

-- Card 3
INSERT INTO card_options (id, card_id, language, value, is_correct, display_order) VALUES
    ('opt_i03_a', 'card_inter_03', 'pt', 'A gravidade não pode ser uma escolha.',                               FALSE, 1),
    ('opt_i03_b', 'card_inter_03', 'pt', 'Eu vou voltar.',                                                      FALSE, 2),
    ('opt_i03_c', 'card_inter_03', 'pt', 'O amor é a única coisa que transcende o tempo e o espaço.',           TRUE,  3),
    ('opt_i03_d', 'card_inter_03', 'pt', 'Uma hora lá equivale a sete anos aqui.',                              FALSE, 4);

-- Card 4
INSERT INTO card_options (id, card_id, language, value, is_correct, display_order) VALUES
    ('opt_i04_a', 'card_inter_04', 'pt', 'Nós costumávamos olhar para o céu e nos perguntar.',                  TRUE,  1),
    ('opt_i04_b', 'card_inter_04', 'pt', 'Não vá gentilmente nessa boa noite.',                                 FALSE, 2),
    ('opt_i04_c', 'card_inter_04', 'pt', 'A natureza não é má, mas também não é boa.',                          FALSE, 3),
    ('opt_i04_d', 'card_inter_04', 'pt', 'Eu vou voltar.',                                                      FALSE, 4);

-- Card 5
INSERT INTO card_options (id, card_id, language, value, is_correct, display_order) VALUES
    ('opt_i05_a', 'card_inter_05', 'pt', 'A humanidade nasceu na Terra.',                                       FALSE, 1),
    ('opt_i05_b', 'card_inter_05', 'pt', 'Uma hora lá equivale a sete anos aqui.',                              TRUE,  2),
    ('opt_i05_c', 'card_inter_05', 'pt', 'Nós não fomos feitos para salvar o mundo.',                           FALSE, 3),
    ('opt_i05_d', 'card_inter_05', 'pt', 'O amor é a única coisa que transcende.',                              FALSE, 4);

-- Card 6
INSERT INTO card_options (id, card_id, language, value, is_correct, display_order) VALUES
    ('opt_i06_a', 'card_inter_06', 'pt', 'Eu vou voltar.',                                                      TRUE,  1),
    ('opt_i06_b', 'card_inter_06', 'pt', 'Não vá gentilmente nessa boa noite.',                                 FALSE, 2),
    ('opt_i06_c', 'card_inter_06', 'pt', 'A gravidade não pode ser uma escolha.',                               FALSE, 3),
    ('opt_i06_d', 'card_inter_06', 'pt', 'Nós costumávamos olhar para o céu.',                                  FALSE, 4);

-- Card 7
INSERT INTO card_options (id, card_id, language, value, is_correct, display_order) VALUES
    ('opt_i07_a', 'card_inter_07', 'pt', 'A natureza não é má, mas também não é boa.',                          FALSE, 1),
    ('opt_i07_b', 'card_inter_07', 'pt', 'A gravidade não pode ser uma escolha.',                               TRUE,  2),
    ('opt_i07_c', 'card_inter_07', 'pt', 'Uma hora lá equivale a sete anos aqui.',                              FALSE, 3),
    ('opt_i07_d', 'card_inter_07', 'pt', 'Eu vou voltar.',                                                      FALSE, 4);

-- Card 8
INSERT INTO card_options (id, card_id, language, value, is_correct, display_order) VALUES
    ('opt_i08_a', 'card_inter_08', 'pt', 'Nós não fomos feitos para salvar o mundo.',                           FALSE, 1),
    ('opt_i08_b', 'card_inter_08', 'pt', 'A humanidade nasceu na Terra.',                                       FALSE, 2),
    ('opt_i08_c', 'card_inter_08', 'pt', 'A natureza não é má, mas também não é boa.',                          TRUE,  3),
    ('opt_i08_d', 'card_inter_08', 'pt', 'O amor é a única coisa que transcende.',                              FALSE, 4);

-- Card 9
INSERT INTO card_options (id, card_id, language, value, is_correct, display_order) VALUES
    ('opt_i09_a', 'card_inter_09', 'pt', 'Não vá gentilmente nessa boa noite.',                                 FALSE, 1),
    ('opt_i09_b', 'card_inter_09', 'pt', 'Nós não fomos feitos para salvar o mundo. Fomos feitos para encontrar um novo lar.', TRUE, 2),
    ('opt_i09_c', 'card_inter_09', 'pt', 'Eu vou voltar.',                                                      FALSE, 3),
    ('opt_i09_d', 'card_inter_09', 'pt', 'Uma hora lá equivale a sete anos aqui.',                              FALSE, 4);

-- Card 10
INSERT INTO card_options (id, card_id, language, value, is_correct, display_order) VALUES
    ('opt_i10_a', 'card_inter_10', 'pt', 'A gravidade não pode ser uma escolha.',                               FALSE, 1),
    ('opt_i10_b', 'card_inter_10', 'pt', 'Nós costumávamos olhar para o céu.',                                  FALSE, 2),
    ('opt_i10_c', 'card_inter_10', 'pt', 'A humanidade nasceu na Terra, mas não foi feita para morrer aqui.',   FALSE, 3),
    ('opt_i10_d', 'card_inter_10', 'pt', 'Lembre-se: furiosa, furiosa contra a morte da luz.',                  TRUE,  4);
