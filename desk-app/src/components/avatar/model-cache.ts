import { Tools } from '@babylonjs/core/Misc/tools';

// Keep the original GLB bytes, not scene objects: each canvas owns its GPU resources
// and animation state, while repeated visits avoid reading the same file again.
const models = new Map<string, Promise<ArrayBuffer>>();

export function loadAvatarModel(url: string): Promise<ArrayBuffer> {
  let model = models.get(url);
  if (!model) {
    model = Tools.LoadFileAsync(url, true).catch((error: unknown) => {
      models.delete(url);
      throw error;
    });
    models.set(url, model);
  }
  return model;
}
