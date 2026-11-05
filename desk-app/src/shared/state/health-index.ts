import { clamp01, clamp100 } from '#tools/number-utils';

type CurrentHealthInput = {
  breaks: readonly {
    exerciseCount: number;
    workTimeSec: number;
    postponeTimeSec: number;
  }[];
};

type PotentialHealthInput = {
  breakEveryMin: number;
  exercisesPerBreak: number;
};

function computeFrequencyScore(intervalMin: number) {
  const maxM = 120;
  const capAt = 60;
  if (intervalMin <= capAt) return 1;
  return clamp01(1 - (intervalMin - capAt) / (maxM - capAt));
}

function computeExerciseDensityScore(exercisesPerMinute: number) {
  // Keep compatibility with the original potential formula:
  // exScore = (e / m) * 10; clipped to [0,1]
  return clamp01(exercisesPerMinute * 10);
}

function computeUnifiedHealthIndex(intervalMin: number, exercisesPerMinute: number) {
  const freqScore = computeFrequencyScore(intervalMin);
  const exScore = computeExerciseDensityScore(exercisesPerMinute);
  const raw = 0.72 * freqScore + 0.28 * exScore;
  const curved = Math.pow(raw, 0.95);
  return clamp100(Math.round(curved * 100));
}

export function computeCurrentHealthIndex(input: CurrentHealthInput) {
  let weightedScore = 0;
  let totalEffectiveWorkSec = 0;

  for (const breakTaken of input.breaks) {
    const effectiveWorkSec = Math.max(
      0,
      breakTaken.workTimeSec + breakTaken.postponeTimeSec,
    );
    if (effectiveWorkSec <= 0) continue;

    const effectiveWorkMin = effectiveWorkSec / 60;
    const exercisesPerMinute = Math.max(0, breakTaken.exerciseCount) / effectiveWorkMin;
    const score = computeUnifiedHealthIndex(effectiveWorkMin, exercisesPerMinute);

    weightedScore += score * effectiveWorkSec;
    totalEffectiveWorkSec += effectiveWorkSec;
  }

  if (totalEffectiveWorkSec <= 0) return 0;
  return clamp100(Math.round(weightedScore / totalEffectiveWorkSec));
}

export function getCurrentHealthLabel(score: number) {
  if (score >= 80) return 'Great';
  if (score >= 60) return 'Fair';
  return 'Low';
}

export function getCurrentHealthNote(score: number) {
  if (score >= 80) return 'Great rhythm, keep going';
  if (score >= 60) return 'Fair - keep regular breaks';
  return 'Low - take a break soon';
}

export function computePotentialHealthIndex(input: PotentialHealthInput) {
  const intervalMin = Math.max(1, input.breakEveryMin);
  const exercisesPerMinute = Math.max(0, input.exercisesPerBreak / intervalMin);
  return computeUnifiedHealthIndex(intervalMin, exercisesPerMinute);
}

export function getPotentialHealthLabel(score: number) {
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Great';
  if (score >= 55) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Low';
}
