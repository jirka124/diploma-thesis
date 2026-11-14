const exerciseAnimations: Record<string, string> = {
  'eye-focus': 'DV_EyeFocus',
  palming: 'DV_Palming',
  'neck-side-tilt': 'DV_NeckSideTilt',
  'shoulder-rolls': 'DV_ShoulderRolls',
  'chest-opener': 'DV_ChestOpener',
  'wrist-stretch': 'DV_WristStretch',
  'finger-fan': 'DV_FingerFan',
  'forearm-rotation': 'DV_ForearmRotation',
  'seated-leg-extension': 'DV_SeatedLegExtension',
  'ankle-circles': 'DV_AnkleCircles',
  'seated-twist': 'DV_SeatedTwist',
};

export function animationForExercise(id: string | undefined): string {
  return (id && Object.hasOwn(exerciseAnimations, id) && exerciseAnimations[id]) || 'DV_Idle';
}
