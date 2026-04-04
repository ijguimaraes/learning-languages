const Anthropic = require('@anthropic-ai/sdk');

const LANGUAGE_NAMES = {
  pt: 'Portuguese',
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  ja: 'Japanese',
  ko: 'Korean',
  zh: 'Chinese',
};

const client = new Anthropic();

async function generateAndSaveOptions(db, cardId, cardValue, sourceLang, targetLang) {
  const sourceName = LANGUAGE_NAMES[sourceLang] || sourceLang;
  const targetName = LANGUAGE_NAMES[targetLang] || targetLang;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          `Translate the following text from ${sourceName} to ${targetName}.`,
          'Then generate 3 plausible but incorrect distractor translations.',
          'The distractors must have approximately the same length (number of words) as the correct translation.',
          'The distractors must be semantically different from the correct translation.',
          '',
          `Text: "${cardValue}"`,
          '',
          'Respond with ONLY a JSON object in this exact format:',
          '{',
          '  "correct": "the correct translation",',
          '  "distractors": [',
          '    "plausible wrong translation 1",',
          '    "plausible wrong translation 2",',
          '    "plausible wrong translation 3"',
          '  ]',
          '}',
        ].join('\n'),
      },
    ],
  });

  let content = message.content[0].text.trim();
  if (content.startsWith('```')) {
    content = content.split('\n').slice(1).join('\n').replace(/```\s*$/, '').trim();
  }

  const { correct, distractors } = JSON.parse(content);

  const options = [
    { value: correct, isCorrect: true },
    ...distractors.map((d) => ({ value: d, isCorrect: false })),
  ];

  // Shuffle options
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }

  const insertedOptions = [];
  for (let i = 0; i < options.length; i++) {
    const opt = options[i];
    const result = await db.query(
      `INSERT INTO card_options (card_id, language, value, is_correct, display_order)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, value`,
      [cardId, targetLang, opt.value, opt.isCorrect, i + 1]
    );
    insertedOptions.push(result.rows[0]);
  }

  return insertedOptions;
}

module.exports = { generateAndSaveOptions };
