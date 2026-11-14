<template>
  <div class="card character-section">
    <div class="card-title">
      <div class="c1">Your characters</div>
      <div class="c2">Choose a character for your exercise breaks</div>
    </div>
    <div class="character-grid">
      <div
        v-for="character in ownedCharacters"
        :key="character.id"
        class="character-card"
        :class="{ selected: selected === character.id }"
      >
        <div class="character-stage">
          <DeskVitalsAvatar :character="character.id" preview portrait trigger="hover" class="character-preview" />
        </div>
        <div class="character-details">
          <div class="character-name">{{ character.name }}</div>
          <div class="character-state">
            {{ selected === character.id ? 'Your current character' : 'Available character' }}
          </div>
        </div>
        <q-btn
          no-caps
          unelevated
          class="character-select"
          :class="{ 'is-selected': selected === character.id }"
          :icon="selected === character.id ? 'check_circle' : 'add_circle_outline'"
          :label="selected === character.id ? 'Selected' : 'Select'"
          :aria-pressed="selected === character.id"
          @click="selectAvatar(character.id)"
        />
      </div>
    </div>
    <div class="character-shop-row">
      <q-btn
        flat
        no-caps
        class="character-shop"
        icon="shopping_bag"
        icon-right="arrow_forward"
        label="Get more characters"
        :to="{ name: 'shop' }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import DeskVitalsAvatar from 'src/components/avatar/DeskVitalsAvatar.vue';
import { useAvatarSettings } from 'src/composables/settings/avatar';

const { ownedCharacters, selected, selectAvatar } = useAvatarSettings();
</script>

<style scoped>
.card {
  border-radius: 22px;
  border: 1px solid rgba(var(--txt-1-rgb), 0.06);
  background: rgba(var(--txt-1-rgb), 0.02);
  padding: 12px;
  box-shadow:
    inset 0 1px 0 rgba(var(--txt-1-rgb), 0.04),
    inset 0 -18px 30px rgba(var(--bg-0-rgb), 0.3);
}
.card-title {
  margin-bottom: 10px;
}
.c1 {
  font-weight: 950;
  font-size: 14px;
  color: rgba(var(--txt-1-rgb), 0.88);
}
.c2 {
  margin-top: 4px;
  font-size: 12px;
  font-weight: 800;
  color: rgba(var(--txt-1-rgb), 0.58);
}
.character-section {
  margin-top: 12px;
}
.character-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  max-width: 492px;
  gap: 12px;
  margin: 14px 0 10px;
}
.character-card {
  min-width: 0;
  padding: 10px;
  border: 1px solid rgba(var(--txt-1-rgb), 0.08);
  border-radius: 18px;
  display: grid;
  gap: 12px;
  background: rgba(var(--bg-0-rgb), 0.18);
  transition:
    border-color 0.2s,
    background 0.2s;
}
.character-card.selected {
  border-color: rgba(var(--accent-1-rgb), 0.45);
  background: linear-gradient(180deg, rgba(var(--accent-1-rgb), 0.08), rgba(var(--bg-0-rgb), 0.18));
}
.character-stage {
  overflow: hidden;
  border-radius: 14px;
  border: 1px solid rgba(var(--txt-1-rgb), 0.06);
  background:
    radial-gradient(ellipse at 50% 70%, rgba(var(--accent-1-rgb), 0.12), transparent 65%),
    rgba(var(--bg-0-rgb), 0.16);
}
.character-preview {
  height: 210px;
}
.character-details {
  padding: 0 4px;
}
.character-name {
  font-size: 14px;
  font-weight: 950;
  color: rgba(var(--txt-1-rgb), 0.88);
}
.character-state {
  margin-top: 3px;
  font-size: 12px;
  font-weight: 800;
  color: rgba(var(--txt-1-rgb), 0.58);
}
.character-select {
  min-height: 38px;
  border: 1px solid rgba(var(--txt-1-rgb), 0.1);
  border-radius: 12px;
  background: rgba(var(--txt-1-rgb), 0.04);
  color: rgba(var(--txt-1-rgb), 0.82);
  font-weight: 900;
}
.character-select.is-selected {
  border-color: rgba(var(--accent-1-rgb), 0.3);
  background: rgba(var(--accent-1-rgb), 0.12);
  color: rgb(var(--accent-1-rgb));
}
.character-shop-row {
  display: flex;
  justify-content: center;
  max-width: 492px;
}
.character-shop {
  min-height: 38px;
  margin: 2px 0 0;
  padding: 0 12px;
  border: 1px solid rgba(var(--txt-1-rgb), 0.08);
  border-radius: 12px;
  background: rgba(var(--bg-0-rgb), 0.18);
  color: rgba(var(--accent-1-rgb), 0.95);
  font-weight: 900;
}
.character-shop :deep(.q-btn__content) {
  gap: 8px;
}
@media (max-width: 600px) {
  .character-preview {
    height: 180px;
  }
}
</style>
