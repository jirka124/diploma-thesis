<template>
  <div ref="shell" class="avatar-shell" @pointerenter="pointerEnter" @pointerleave="pointerLeave" @focusin="enter" @focusout="focusOut">
    <component
      :is="sceneComponent"
      v-if="sceneComponent"
      v-bind="props"
      class="avatar-scene"
      :class="{ 'hidden-scene': !showModel }"
      @loading="onLoading"
      @ready="onReady"
      @error="onError"
    />
    <div v-show="!showModel" class="avatar-placeholder" :class="{ portrait }">
      <img :src="characterDefinition.id === 'fox' ? (portrait ? foxSmall : foxPreview) : (portrait ? robotSmall : robotPreview)" :alt="characterDefinition.name" />
    </div>
    <div v-if="trigger !== 'static'" class="transition-cover" :class="coverClass" aria-live="polite">
      <div class="cover-icon" aria-hidden="true">
        <q-icon :name="characterDefinition.id === 'fox' ? 'pets' : 'smart_toy'" />
      </div>
      <span class="cover-name">{{ characterDefinition.name }}</span>
      <span class="cover-status">{{ coverText }}</span>
    </div>
    <div v-if="trigger === 'hover'" class="progress-track" aria-hidden="true">
      <div class="progress-fill" :class="{ filled: progressFilled, closing: phase === 'closing' }" />
    </div>
    <button v-if="trigger === 'hover' && !active" class="activate-preview" type="button"
      :aria-label="`Show ${characterDefinition.name} 3D preview`"
      @click.stop="activateImmediately()">
      <span class="preview-hint" aria-hidden="true">3D</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, markRaw, onBeforeUnmount, onMounted, shallowRef, ref, type Component } from 'vue';
import { avatars, useAvatarSettings, type AvatarId } from 'src/composables/settings/avatar';
import foxPreview from 'src/assets/generated/avatars/fox-preview.webp';
import foxSmall from 'src/assets/generated/avatars/fox-small.webp';
import robotPreview from 'src/assets/generated/avatars/robot-preview.webp';
import robotSmall from 'src/assets/generated/avatars/robot-small.webp';

const props = withDefaults(defineProps<{
  character?: AvatarId;
  animation?: string;
  paused?: boolean;
  preview?: boolean;
  interactive?: boolean;
  trigger?: 'visible' | 'hover' | 'static';
  portrait?: boolean;
  playbackKey?: string;
  durationSec?: number;
  cameraPreset?: { target: { x: number; y: number; z: number }; zoom: number; alpha: number; beta: number };
  cameraPresetKey?: string;
}>(), { animation: 'DV_Idle', paused: false, preview: false, interactive: true, trigger: 'visible', portrait: false });
const { selected } = useAvatarSettings();
const characterDefinition = computed(() => avatars.find((a) => a.id === (props.character ?? selected.value)) ?? avatars[0]);
const sceneComponent = shallowRef<Component | null>(null);
const shell = ref<HTMLElement | null>(null);
const state = ref<'idle' | 'loading' | 'ready' | 'error'>('idle');
const phase = ref<'idle' | 'entering' | 'loading' | 'shown' | 'closing' | 'returning' | 'error'>('idle');
const active = ref(false);
const showModel = ref(false);
const progressFilled = computed(() => ['entering', 'loading', 'shown'].includes(phase.value));
const coverClass = computed(() => ({
  covered: ['entering', 'loading', 'closing', 'error'].includes(phase.value),
  closing: phase.value === 'closing',
  entering: phase.value === 'entering',
}));
const coverText = computed(() => {
  if (phase.value === 'closing') return 'Closing preview…';
  if (phase.value === 'error') return 'Character preview unavailable';
  return 'Loading character…';
});
let disposed = false;
let pointerInside = false;
let generation = 0;
let observer: IntersectionObserver | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;

function clearTimer() { clearTimeout(timer); }
function activate() {
  if (active.value) return;
  active.value = true;
  state.value = 'loading';
  phase.value = 'loading';
  const version = ++generation;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    void import('./AvatarScene.vue').then(({ default: component }) => {
      if (!disposed && version === generation) sceneComponent.value = markRaw(component);
    }).catch((error: unknown) => {
      if (!disposed && version === generation) onError();
      console.error('Character renderer could not be loaded', error);
    });
  }));
}
function onLoading() {
  state.value = 'loading';
  if (phase.value !== 'closing') phase.value = 'loading';
}
function onReady() {
  state.value = 'ready';
  if (phase.value === 'closing') return;
  showModel.value = true;
  phase.value = 'shown';
}
function onError() {
  state.value = 'error';
  if (phase.value !== 'closing') phase.value = 'error';
}
function activateImmediately() {
  clearTimer();
  if (active.value) { enter(); return; }
  phase.value = 'entering';
  timer = setTimeout(activate, 1000);
}
function enter() {
  if (props.trigger !== 'hover') return;
  if (phase.value === 'entering') return;
  clearTimer();
  if (active.value) {
    if (state.value === 'ready') { showModel.value = true; phase.value = 'shown'; }
    else phase.value = state.value === 'error' ? 'error' : 'loading';
    return;
  }
  phase.value = 'entering';
  timer = setTimeout(activate, 1000);
}
function pointerEnter(event: PointerEvent) {
  if (event.pointerType === 'touch') return;
  pointerInside = true;
  enter();
}
function pointerLeave(event: PointerEvent) {
  if (event.pointerType === 'touch') return;
  pointerInside = false;
  if (!shell.value?.contains(document.activeElement)) leave();
}
function leave() {
  if (props.trigger !== 'hover') return;
  clearTimer();
  if (!active.value) { phase.value = 'idle'; return; }
  phase.value = 'closing';
  timer = setTimeout(finishClose, 3000);
}
function finishClose() {
  generation++;
  showModel.value = false;
  sceneComponent.value = null;
  active.value = false;
  state.value = 'idle';
  phase.value = 'returning';
  timer = setTimeout(() => { phase.value = 'idle'; }, 350);
}
function focusOut(event: FocusEvent) {
  if (!pointerInside && !shell.value?.contains(event.relatedTarget as Node | null)) leave();
}
onMounted(() => {
  if (props.trigger !== 'visible') return;
  if (!shell.value || typeof IntersectionObserver === 'undefined') { activate(); return; }
  observer = new IntersectionObserver(([entry]) => {
    if (entry?.isIntersecting) { observer?.disconnect(); activate(); }
  });
  observer.observe(shell.value);
});
onBeforeUnmount(() => {
  disposed = true; generation++;
  observer?.disconnect();
  clearTimer();
});
</script>

<style scoped>
.avatar-shell { position: relative; width: 100%; height: 100%; min-height: 0; overflow: hidden; border-radius: 22px; background: radial-gradient(700px 380px at 30% 20%, rgba(var(--accent-5-rgb), .12), transparent 60%), rgba(var(--bg-15-rgb), .72); }
.avatar-scene { position: absolute; inset: 0; }
.avatar-scene.hidden-scene { opacity: 0; pointer-events: none; }
.avatar-placeholder { position: absolute; inset: 0; display: grid; place-items: center; pointer-events: none; }
.avatar-placeholder img { width: 100%; height: 100%; object-fit: contain; }
.avatar-placeholder.portrait img { position: absolute; top: 0; left: 50%; width: auto; max-width: none; height: 235%; transform: translateX(-50%); }
.transition-cover { position: absolute; inset: 0; z-index: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5px; background: rgb(var(--bg-15-rgb)); color: rgba(var(--txt-1-rgb), .85); opacity: 0; pointer-events: none; transition: opacity 350ms cubic-bezier(.1,.8,.2,1); }
.transition-cover.covered { opacity: 1; }
.transition-cover.entering { transition-duration: 1000ms; }
.transition-cover.closing { transition-duration: 3000ms; }
.cover-icon { display: grid; place-items: center; width: 48px; height: 48px; border-radius: 16px; color: rgb(var(--accent-1-rgb)); background: rgba(var(--accent-1-rgb), .12); font-size: 25px; }
.cover-name { font-size: 13px; font-weight: 800; }
.cover-status { font-size: 11px; color: rgba(var(--txt-1-rgb), .65); }
.progress-track { position: absolute; z-index: 2; bottom: 0; left: 0; right: 0; height: 4px; background: rgba(var(--txt-1-rgb), .12); pointer-events: none; }
.progress-fill { height: 100%; width: 100%; transform: scaleX(0); transform-origin: left; background: rgb(var(--accent-1-rgb)); transition: transform 1000ms cubic-bezier(.1,.8,.2,1); }
.progress-fill.filled { transform: scaleX(1); }
.progress-fill.closing { transition-duration: 3000ms; }
.activate-preview { position: absolute; z-index: 3; inset: 0; border: 0; background: transparent; cursor: pointer; }
.preview-hint { position: absolute; right: 6px; bottom: 8px; padding: 2px 6px; border-radius: 8px; color: rgb(var(--txt-1-rgb)); background: rgba(var(--bg-15-rgb), .75); font-size: 10px; font-weight: 700; }
.activate-preview:focus-visible { outline: 2px solid rgb(var(--accent-1-rgb)); outline-offset: -3px; }
@media (prefers-reduced-motion: reduce) { .transition-cover, .progress-fill { transition-duration: 1ms !important; } }
</style>
