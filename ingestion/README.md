# Ingestion CLI

Ferramenta de linha de comando que lê arquivos de legenda (.srt) e popula o banco de dados do MovieLingo com cards de prática organizados cena a cena.

## Como funciona

Para cada frase da legenda, o pipeline gera uma "escada" de fragmentos usando SpaCy (NLP), do mais simples ao mais complexo, seguida da frase completa:

```
Bloco 1:
  "Captain"                                [scaffold]
  "fight"                                  [scaffold]
  "this fight"                             [scaffold]
  "in this fight"                          [scaffold]
  "Captain, we should be in this fight."   [frase completa]

Bloco 2:
  "know"                                   [scaffold]
  "point"                                  [scaffold]
  "no point"                               [scaffold]
  "You know there'd be no point."          [frase completa]
```

O usuário domina os fragmentos antes de enfrentar a frase completa, e depois avança para a próxima cena do filme.

## Instalação

```bash
cd ingestion
pip install -e ".[dev]"
python -m spacy download en_core_web_md
```

Pré-requisitos: Python 3.10+, PostgreSQL rodando via Docker Compose.

## Comandos

### preview

Visualiza os cards que seriam gerados, sem inserir no banco.

```bash
python -m ingestion preview --srt <arquivo.srt>
```

Opções:
- `--min-words N` — Ignora frases com menos de N palavras (default: 3)
- `--merge-short / --no-merge-short` — Mescla legendas consecutivas curtas (<3 palavras, gap <500ms)

Exemplo:
```bash
python -m ingestion preview \
  --srt subtitles/solo.leveling.s01.e01/Solo.Leveling.S01E01.srt
```

### ingest

Processa o arquivo SRT e insere o filme e os cards no banco de dados.

```bash
python -m ingestion ingest \
  --srt <arquivo.srt> \
  --title "Nome do Filme" \
  --language en
```

Opções:
- `--srt` — Caminho para o arquivo .srt (obrigatório)
- `--title` — Titulo do filme/episódio (obrigatório)
- `--language` — Código do idioma do áudio original, ex: `en` (obrigatório)
- `--genre` — Gênero, ex: `anime`, `action`, `sci-fi`
- `--release-date` — Data de lançamento no formato `YYYY-MM-DD`
- `--rating` — Nota, ex: `8.7`
- `--min-words N` — Ignora frases com menos de N palavras (default: 3)
- `--merge-short` — Mescla legendas consecutivas curtas
- `--force` — Sobrescreve se o filme com mesmo título já existir

Exemplo completo:
```bash
python -m ingestion ingest \
  --srt subtitles/solo.leveling.s01.e01/Solo.Leveling.S01E01.srt \
  --title "Solo Leveling S01E01" \
  --language en \
  --genre anime \
  --release-date 2024-01-07 \
  --rating 8.2
```

## Configuração do banco

A conexão com o PostgreSQL usa variáveis de ambiente com os mesmos defaults do backend:

| Variável | Default |
|---|---|
| `DB_HOST` | `localhost` |
| `DB_PORT` | `5432` |
| `DB_NAME` | `movielingo` |
| `DB_USER` | `movielingo` |
| `DB_PASSWORD` | `movielingo_dev` |

Copie `.env.example` para `.env` para customizar:
```bash
cp .env.example .env
```

## Testes

```bash
python -m pytest tests/ -v
```
