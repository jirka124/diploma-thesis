import { computed, readonly, ref } from 'vue';
import robotUrl from 'src/assets/avatars/deskvitals-robot.glb';
import foxUrl from 'src/assets/avatars/deskvitals-fox.glb';

export const avatars = [
  {
    id: 'robot',
    name: 'Robot',
    desc: 'Your friendly desk companion',
    price: 0,
    model: robotUrl,
    features: [{ icon: 'view_in_ar', text: '3D character' }],
  },
  {
    id: 'fox',
    name: 'Fox',
    desc: 'A playful companion for your breaks',
    price: 120,
    model: foxUrl,
    features: [{ icon: 'view_in_ar', text: '3D character' }],
  },
] as const;
export type AvatarId = (typeof avatars)[number]['id'];
const key = 'deskvitals.characters.v1';
const owned = ref<AvatarId[]>(['robot']);
const selected = ref<AvatarId>('robot');
const coins = ref(420);
function restore(raw: string | null) {
  try {
    const state = JSON.parse(raw || '{}');
    owned.value = avatars
      .filter((a) => a.id === 'robot' || (Array.isArray(state.owned) && state.owned.includes(a.id)))
      .map((a) => a.id);
    selected.value = owned.value.includes(state.selected) ? state.selected : 'robot';
    coins.value = Number.isSafeInteger(state.coins) && state.coins >= 0 ? state.coins : 420;
  } catch {
    /* Keep defaults if storage is invalid. */
  }
}
try {
  restore(localStorage.getItem(key));
} catch {
  /* Storage may be unavailable. */
}
window.addEventListener('storage', (event) => {
  if (event.key === key) restore(event.newValue);
});
function save() {
  try {
    localStorage.setItem(
      key,
      JSON.stringify({ owned: owned.value, selected: selected.value, coins: coins.value }),
    );
  } catch (error) {
    console.error('Character settings could not be saved', error);
  }
}
export function useAvatarSettings() {
  const ownedAvatars = computed(() => new Set(owned.value));
  function isAvatarOwned(id: AvatarId) {
    return owned.value.includes(id);
  }
  return {
    avatars,
    coins,
    ownedAvatars,
    selected: readonly(selected),
    ownedCharacters: computed(() => avatars.filter((a) => isAvatarOwned(a.id))),
    isAvatarOwned,
    selectAvatar(this: void, id: AvatarId) {
      if (isAvatarOwned(id)) {
        selected.value = id;
        save();
      }
    },
    buyAvatar(this: void, id: AvatarId) {
      const item = avatars.find((a) => a.id === id);
      if (!item || isAvatarOwned(id) || coins.value < item.price) return;
      coins.value -= item.price;
      owned.value = [...owned.value, id];
      save();
    },
    save,
  };
}
