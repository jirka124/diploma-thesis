import type { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';

export function handleAvatarCameraKey(
  event: KeyboardEvent,
  camera: ArcRotateCamera,
  cancelCameraTransition: () => void,
  resetCamera: () => void,
) {
  const key = event.key.toLowerCase();
  if (!['arrowleft', 'arrowright', 'arrowup', 'arrowdown', '+', '=', '-', '_', 'r'].includes(key))
    return;
  event.preventDefault();
  cancelCameraTransition();
  if (key === 'r') {
    resetCamera();
    return;
  }
  if (key === '+' || key === '=')
    camera.radius = Math.max(camera.lowerRadiusLimit ?? 0, camera.radius * 0.9);
  else if (key === '-' || key === '_')
    camera.radius = Math.min(camera.upperRadiusLimit ?? Infinity, camera.radius / 0.9);
  else if (event.shiftKey) {
    const right = camera.getDirection(Vector3.Right());
    const up = camera.getDirection(Vector3.Up());
    const delta = camera.radius * 0.035;
    const offset =
      key === 'arrowleft'
        ? right.scale(-delta)
        : key === 'arrowright'
          ? right.scale(delta)
          : key === 'arrowup'
            ? up.scale(delta)
            : up.scale(-delta);
    camera.setTarget(camera.target.add(offset), false, false, true);
  } else {
    if (key === 'arrowleft') camera.alpha -= 0.1;
    if (key === 'arrowright') camera.alpha += 0.1;
    if (key === 'arrowup') camera.beta = Math.max(0.08, camera.beta - 0.1);
    if (key === 'arrowdown') camera.beta = Math.min(Math.PI - 0.08, camera.beta + 0.1);
  }
}
