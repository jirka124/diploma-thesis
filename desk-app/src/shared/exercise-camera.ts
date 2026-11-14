import { animationForExercise } from './exercise-animation';

export type ExerciseCameraPreset = {
  /** Target coordinates normalized within the character's bounding box. */
  target: { x: number; y: number; z: number };
  /** Multiplier of the fitted camera radius; smaller values move closer. */
  zoom: number;
  alpha: number;
  beta: number;
};

function preset(y: number, zoom: number, alpha = Math.PI / 2): ExerciseCameraPreset {
  return { target: { x: 0.5, y, z: 0.5 }, zoom, alpha, beta: Math.PI / 2 };
}

// Keep both sides in view for alternating movements. Oblique views reveal depth
// for shoulders, arms and legs without hiding the far side of the character.
const animationCameraPresets = {
  DV_Idle: preset(0.5, 1),
  DV_EyeFocus: preset(0.84, 0.58),
  DV_Palming: preset(0.8, 0.68),
  DV_NeckSideTilt: preset(0.78, 0.7),
  DV_ShoulderRolls: preset(0.72, 0.8, Math.PI / 2 - Math.PI / 8),
  DV_ChestOpener: preset(0.65, 0.95, Math.PI / 2 - Math.PI / 4),
  DV_WristStretch: preset(0.63, 0.85, Math.PI / 2 - Math.PI / 6),
  DV_FingerFan: preset(0.62, 0.72),
  DV_ForearmRotation: preset(0.61, 0.8, Math.PI / 2 - Math.PI / 8),
  DV_SeatedLegExtension: preset(0.39, 1.1, Math.PI / 2 - Math.PI / 4),
  DV_AnkleCircles: preset(0.24, 0.85, Math.PI / 2 - Math.PI / 6),
  DV_SeatedTwist: preset(0.58, 1, Math.PI / 2 - Math.PI / 8),
} satisfies Record<string, ExerciseCameraPreset>;

export function cameraPresetForExercise(
  id: string | undefined,
  animation = animationForExercise(id),
): ExerciseCameraPreset {
  return (
    animationCameraPresets[animation as keyof typeof animationCameraPresets] ??
    animationCameraPresets.DV_Idle
  );
}
