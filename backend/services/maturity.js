const BASE_GAIN = 15.0;
const INCORRECT_PENALTY = -30.0;

function calculateMaturityDelta(correct, responseTimeMs) {
  if (!correct) return INCORRECT_PENALTY;

  let timeBonus;
  if (responseTimeMs <= 2000) timeBonus = 1.5;
  else if (responseTimeMs <= 4000) timeBonus = 1.2;
  else if (responseTimeMs <= 7000) timeBonus = 1.0;
  else if (responseTimeMs <= 12000) timeBonus = 0.7;
  else timeBonus = 0.4;

  return BASE_GAIN * timeBonus;
}

function responseTimeToQuality(responseTimeMs) {
  if (responseTimeMs <= 2000) return 5;
  if (responseTimeMs <= 4000) return 4;
  if (responseTimeMs <= 7000) return 3;
  if (responseTimeMs <= 12000) return 2;
  return 1;
}

module.exports = { calculateMaturityDelta, responseTimeToQuality };
