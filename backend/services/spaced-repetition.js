const { responseTimeToQuality } = require('./maturity');

const MIN_EASE = 1.30;
const TEN_MINUTES_IN_DAYS = 10 / (60 * 24); // ~0.00694

function updateSpacedRepetition(progress, correct, responseTimeMs) {
  if (!correct) {
    progress.repetition = 0;
    progress.interval_days = TEN_MINUTES_IN_DAYS;
    progress.ease_factor = Math.max(MIN_EASE, progress.ease_factor - 0.20);
  } else {
    const quality = responseTimeToQuality(responseTimeMs);

    progress.ease_factor = Math.max(
      MIN_EASE,
      progress.ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    );

    progress.repetition += 1;

    if (progress.repetition === 1) {
      progress.interval_days = 1;
    } else if (progress.repetition === 2) {
      progress.interval_days = 6;
    } else {
      progress.interval_days = progress.interval_days * progress.ease_factor;
    }
  }

  const now = new Date();
  const intervalMs = progress.interval_days * 24 * 60 * 60 * 1000;
  progress.next_review_at = new Date(now.getTime() + intervalMs);

  return progress;
}

module.exports = { updateSpacedRepetition };
