<template>
  <router-view />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue';

let preloadTimer: ReturnType<typeof setTimeout> | undefined;
let idleTask: number | undefined;
onMounted(() => {
  // Warm the renderer after the initial UI has painted, without loading models or creating a scene.
  preloadTimer = setTimeout(() => {
    const preload = () => {
      void import('src/components/avatar/AvatarScene.vue').catch((error: unknown) => {
        console.error('Character renderer preload failed', error);
      });
    };
    if ('requestIdleCallback' in window) idleTask = window.requestIdleCallback(preload, { timeout: 5000 });
    else preload();
  }, 1500);
});
onBeforeUnmount(() => {
  clearTimeout(preloadTimer);
  if (idleTask !== undefined) window.cancelIdleCallback(idleTask);
});
</script>
