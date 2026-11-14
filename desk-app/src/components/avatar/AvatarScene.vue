<template>
  <div class="avatar-view" :aria-label="`${characterDefinition.name} 3D character`" role="group">
    <canvas
      ref="canvas"
      class="avatar-canvas"
      :class="{ interactive }"
      :tabindex="interactive ? 0 : -1"
      :aria-label="
        interactive
          ? '3D character. Drag to rotate, scroll or pinch to zoom, two fingers or Shift and arrows to pan. Arrows rotate, plus and minus zoom, R resets.'
          : 'Character preview'
      "
      @pointerdown="cancelCameraTransition"
      @wheel="cancelCameraTransition"
      @keydown="handleCameraKey"
    />
    <q-btn
      v-if="interactive && !preview && cameraPreset"
      round
      unelevated
      class="camera-reset"
      icon="center_focus_strong"
      aria-label="Reset to recommended view"
      @click="resetCamera()"
    >
      <q-tooltip>Reset to recommended view (R)</q-tooltip>
    </q-btn>
    <span v-if="status" class="avatar-status" role="status">{{ status }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { Engine } from '@babylonjs/core/Engines/engine';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { RawTexture } from '@babylonjs/core/Materials/Textures/rawTexture';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import { Color4 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Scene } from '@babylonjs/core/scene';
import type { AnimationGroup } from '@babylonjs/core/Animations/animationGroup';
import { AnimationGroupMask } from '@babylonjs/core/Animations/animationGroupMask';
import '@babylonjs/loaders/glTF';
import { handleAvatarCameraKey } from './camera-keyboard';
import { loadAvatarModel } from './model-cache';
import { avatars, useAvatarSettings, type AvatarId } from 'src/composables/settings/avatar';
import brdfUrl from 'src/assets/avatars/environment-brdf.rgba?url';
const props = withDefaults(
  defineProps<{
    character?: AvatarId;
    animation?: string;
    paused?: boolean;
    preview?: boolean;
    interactive?: boolean;
    playbackKey?: string;
    durationSec?: number;
    cameraPreset?: {
      target: { x: number; y: number; z: number };
      zoom: number;
      alpha: number;
      beta: number;
    };
    cameraPresetKey?: string;
  }>(),
  { animation: 'DV_Idle', paused: false, preview: false, interactive: true },
);
const emit = defineEmits<{ loading: []; ready: []; error: [] }>();
const { selected } = useAvatarSettings();
const characterDefinition = computed(
  () => avatars.find((a) => a.id === (props.character ?? selected.value)) ?? avatars[0],
);
const canvas = ref<HTMLCanvasElement | null>(null);
const status = ref('Loading character�');
let engine: Engine | null = null;
let scene: Scene | null = null;
let active: AnimationGroup | null = null;
let blink: AnimationGroup | null = null;
let groups: AnimationGroup[] = [];
let observer: ResizeObserver | null = null;
let visibilityObserver: IntersectionObserver | null = null;
let visible = false;
let rendering = false;
let generation = 0;
let fitCamera: (() => void) | null = null;
let resetCamera: (smooth?: boolean) => void = () => {};
let exerciseCamera: ArcRotateCamera | null = null;
let cancelCameraTransition = () => {};
function handleCameraKey(event: KeyboardEvent) {
  if (!props.interactive || !exerciseCamera) return;
  handleAvatarCameraKey(event, exerciseCamera, cancelCameraTransition, resetCamera);
}
function play(name: string, restart = false) {
  const next =
    groups.find((group) => group.name === name) || groups.find((group) => group.name === 'DV_Idle');
  if (!next) return;
  if (next !== active || restart) {
    active?.stop();
    blink?.stop();
    active = next;
    const fps = active.targetedAnimations[0]?.animation.framePerSecond ?? 60;
    const clipSeconds = (active.to - active.from) / fps;
    const duration = props.durationSec;
    const speed =
      active.name !== 'DV_Idle' && duration && duration > 0 && clipSeconds > 0
        ? (clipSeconds * Math.max(1, Math.round(duration / clipSeconds))) / duration
        : 1;
    active.start(true, speed, active.from, active.to, false);
    if (active.name === 'DV_Idle' && blink && blink !== active) {
      blink.start(true, 0.35, blink.from, blink.to, false);
    }
  }
  if (props.paused) {
    active.pause();
    blink?.pause();
  } else {
    if (!active.isPlaying) active.play(true);
    if (active.name === 'DV_Idle' && blink && !blink.isPlaying) blink.play(true);
  }
}
async function load() {
  if (!engine || !canvas.value) return;
  const version = ++generation;
  emit('loading');
  fitCamera = null;
  exerciseCamera = null;
  resetCamera = () => {};
  cancelCameraTransition = () => {};
  scene?.dispose();
  groups = [];
  active = null;
  blink = null;
  const current = new Scene(engine);
  scene = current;
  current.clearColor = new Color4(0.025, 0.01, 0.07, 0);
  const camera = new ArcRotateCamera(
    'avatar-camera',
    Math.PI / 2,
    Math.PI / 2,
    7.2,
    new Vector3(0, -0.25, 0),
    current,
  );
  if (props.interactive) {
    exerciseCamera = camera;
    camera.attachControl(canvas.value, false);
    camera.keysUp = [];
    camera.keysDown = [];
    camera.keysLeft = [];
    camera.keysRight = [];
    camera.lowerBetaLimit = 0.08;
    camera.upperBetaLimit = Math.PI - 0.08;
    camera.wheelDeltaPercentage = 0.01;
    camera.pinchDeltaPercentage = 0.01;
    camera.panningSensibility = 120;
    camera.useNaturalPinchZoom = true;
  }
  const light = new HemisphericLight('avatar-light', new Vector3(0.4, 1, -0.7), current);
  light.intensity = 1.7;
  status.value = 'Loading character�';
  try {
    const [model, brdf] = await Promise.all([
      loadAvatarModel(characterDefinition.value.model),
      loadAvatarModel(brdfUrl),
    ]);
    if (version !== generation) return;
    const environmentBRDF = RawTexture.CreateRGBATexture(
      new Uint8Array(brdf),
      256,
      256,
      current,
      false,
      false,
      Texture.BILINEAR_SAMPLINGMODE,
    );
    environmentBRDF.isRGBD = true;
    current.environmentBRDFTexture = environmentBRDF;
    const imported = await SceneLoader.ImportMeshAsync(
      '',
      '',
      new Uint8Array(model),
      current,
      undefined,
      '.glb',
    );
    if (version !== generation) return;
    const min = new Vector3(Infinity, Infinity, Infinity);
    const max = new Vector3(-Infinity, -Infinity, -Infinity);
    for (const mesh of imported.meshes) {
      if (!mesh.getTotalVertices()) continue;
      mesh.computeWorldMatrix(true);
      const bounds = mesh.getBoundingInfo().boundingBox;
      min.minimizeInPlace(bounds.minimumWorld);
      max.maximizeInPlace(bounds.maximumWorld);
    }
    if (Number.isFinite(min.y) && Number.isFinite(max.y)) {
      camera.setTarget(min.add(max).scale(0.5));
      const size = max.subtract(min);
      let previousFit = 0;
      let transition: {
        start: number;
        target: Vector3;
        alpha: number;
        beta: number;
        zoom: number;
        fromTarget: Vector3;
        fromAlpha: number;
        fromBeta: number;
        fromZoom: number;
      } | null = null;
      cancelCameraTransition = () => {
        transition = null;
      };
      resetCamera = (smooth = true) => {
        if (!previousFit) return;
        const preset = props.cameraPreset;
        const finite = (value: number | undefined, fallback: number) =>
          value !== undefined && Number.isFinite(value) ? value : fallback;
        const normalized = (value: number | undefined) =>
          Math.max(0, Math.min(1, finite(value, 0.5)));
        const target = new Vector3(
          min.x + size.x * normalized(preset?.target.x),
          min.y + size.y * normalized(preset?.target.y),
          min.z + size.z * normalized(preset?.target.z),
        );
        const alpha = finite(preset?.alpha, Math.PI / 2);
        const beta = Math.max(0.08, Math.min(Math.PI - 0.08, finite(preset?.beta, Math.PI / 2)));
        const zoom = Math.max(0.12, Math.min(4, finite(preset?.zoom, 1)));
        camera.inertialAlphaOffset =
          camera.inertialBetaOffset =
          camera.inertialRadiusOffset =
          camera.inertialPanningX =
          camera.inertialPanningY =
            0;
        camera.movement.resetPanVelocity();
        if (!smooth || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          transition = null;
          camera.setTarget(target);
          camera.alpha = alpha;
          camera.beta = beta;
          camera.radius = previousFit * zoom;
        } else {
          transition = {
            start: performance.now(),
            target,
            alpha:
              camera.alpha +
              Math.atan2(Math.sin(alpha - camera.alpha), Math.cos(alpha - camera.alpha)),
            beta,
            zoom,
            fromTarget: camera.target.clone(),
            fromAlpha: camera.alpha,
            fromBeta: camera.beta,
            fromZoom: camera.radius / previousFit,
          };
        }
      };
      current.onBeforeRenderObservable.add(() => {
        if (!transition) return;
        const t = Math.min(1, (performance.now() - transition.start) / 550);
        const eased = t * t * (3 - 2 * t);
        camera.setTarget(Vector3.Lerp(transition.fromTarget, transition.target, eased));
        camera.alpha = transition.fromAlpha + (transition.alpha - transition.fromAlpha) * eased;
        camera.beta = transition.fromBeta + (transition.beta - transition.fromBeta) * eased;
        camera.radius =
          previousFit * (transition.fromZoom + (transition.zoom - transition.fromZoom) * eased);
        if (t === 1) transition = null;
      });
      fitCamera = () => {
        const width = engine?.getRenderWidth() ?? 0;
        const height = engine?.getRenderHeight() ?? 0;
        if (!width || !height) return;
        const halfView = Math.tan(camera.fov / 2);
        const radius =
          size.z / 2 + (1.25 * Math.max(size.y / 2, size.x / 2 / (width / height))) / halfView;
        const firstFit = previousFit === 0;
        const zoom = previousFit ? camera.radius / previousFit : 1;
        camera.lowerRadiusLimit = radius * (props.preview && !props.interactive && !props.cameraPreset ? 0.8 : 0.12);
        camera.upperRadiusLimit = radius * (props.preview && !props.interactive && !props.cameraPreset ? 1.6 : 4);
        camera.minZ = Math.max(0.001, radius * 0.001);
        camera.radius = Math.max(
          camera.lowerRadiusLimit,
          Math.min(camera.upperRadiusLimit, radius * zoom),
        );
        previousFit = radius;
        if (firstFit) resetCamera(false);
      };
      fitCamera();
    }
    groups = imported.animationGroups;
    groups.forEach((group) => group.stop());
    blink =
      groups.find((group) => group.name === 'DV_FaceBlink') ||
      groups.find((group) => group.name === 'DV_Blink') ||
      null;
    // Exported blink clips also key the body's rest pose. Only let them drive
    // the eyelids so the idle animation keeps control of the body.
    if (blink) {
      blink.mask = new AnimationGroupMask([
        'eyelid_lower.L',
        'eyelid_lower.R',
        'eyelid_upper.L',
        'eyelid_upper.R',
      ]);
    }
    play(props.animation);
    current.executeWhenReady(() => {
      if (version !== generation) return;
      current.onAfterRenderObservable.addOnce(() => {
        if (version !== generation) return;
        status.value = '';
        emit('ready');
      });
    });
  } catch (error) {
    if (version === generation) {
      status.value = 'Character preview unavailable';
      emit('error');
      console.error(error);
    }
  }
}
function renderFrame() {
  scene?.render();
}
function updateRendering() {
  if (!engine) return;
  const shouldRender = visible && !document.hidden;
  if (shouldRender) {
    engine.resize();
    fitCamera?.();
    if (!rendering) {
      rendering = true;
      engine.runRenderLoop(renderFrame);
    }
  } else if (rendering) {
    rendering = false;
    engine.stopRenderLoop(renderFrame);
  }
}
function resumeRendering() {
  if (engine && visible && !document.hidden) {
    engine.stopRenderLoop(renderFrame);
    rendering = false;
  }
  updateRendering();
}
function initialize() {
  if (engine || !canvas.value) return;
  try {
    engine = new Engine(canvas.value, true, { preserveDrawingBuffer: false, stencil: true });
    if (props.preview) engine.setHardwareScalingLevel(1.5);
    observer = new ResizeObserver(() => {
      engine?.resize();
      fitCamera?.();
    });
    observer.observe(canvas.value);
    updateRendering();
    void load();
  } catch (error) {
    status.value = '3D preview unavailable';
    emit('error');
    console.error(error);
  }
}
onMounted(() => {
  if (!canvas.value) return;
  document.addEventListener('visibilitychange', updateRendering);
  window.addEventListener('focus', resumeRendering);
  window.addEventListener('pageshow', resumeRendering);
  if (typeof IntersectionObserver === 'undefined') {
    visible = true;
    initialize();
    return;
  }
  visibilityObserver = new IntersectionObserver(([entry]) => {
    visible = !!entry?.isIntersecting;
    if (visible) initialize();
    updateRendering();
  });
  visibilityObserver.observe(canvas.value);
});
watch(characterDefinition, () => {
  void load();
});
watch(
  () => [props.cameraPresetKey, props.cameraPreset, props.animation] as const,
  () => resetCamera(),
  { deep: true },
);
watch(
  () => [props.animation, props.paused, props.playbackKey] as const,
  ([animation, , key], previous) => play(animation, key !== previous[2]),
);
onBeforeUnmount(() => {
  generation++;
  document.removeEventListener('visibilitychange', updateRendering);
  window.removeEventListener('focus', resumeRendering);
  window.removeEventListener('pageshow', resumeRendering);
  visibilityObserver?.disconnect();
  observer?.disconnect();
  fitCamera = null;
  exerciseCamera = null;
  resetCamera = () => {};
  cancelCameraTransition = () => {};
  scene?.dispose();
  engine?.dispose();
  engine = null;
  scene = null;
  groups = [];
  active = null;
  blink = null;
});
</script>

<style scoped>
.avatar-view {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 0;
  border-radius: 22px;
  overflow: hidden;
  background:
    radial-gradient(700px 380px at 30% 20%, rgba(var(--accent-5-rgb), 0.12), transparent 60%),
    rgba(var(--bg-15-rgb), 0.72);
}
.avatar-canvas {
  width: 100%;
  height: 100%;
  display: block;
}
.avatar-canvas:not(.interactive) {
  pointer-events: none;
}
.avatar-canvas.interactive {
  touch-action: none;
  cursor: grab;
}
.avatar-canvas.interactive:active { cursor: grabbing; }
.avatar-canvas:focus-visible {
  outline: 2px solid rgb(var(--txt-1-rgb));
  outline-offset: -3px;
}
.camera-reset {
  position: absolute;
  right: 12px;
  top: 12px;
  width: 40px;
  height: 40px;
  border: 1px solid rgba(var(--txt-1-rgb), 0.12);
  background: rgba(var(--bg-0-rgb), 0.35);
  backdrop-filter: blur(10px);
  color: rgba(var(--txt-1-rgb), 0.9);
}
.camera-reset:hover {
  background: rgba(var(--bg-0-rgb), 0.55);
  border-color: rgba(var(--txt-1-rgb), 0.22);
}
.camera-reset:focus-visible {
  outline: 2px solid rgb(var(--txt-1-rgb));
  outline-offset: 1px;
}
.avatar-status {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 12px;
  color: rgb(var(--txt-1-rgb));
  font-size: 12px;
  text-align: center;
}
</style>
