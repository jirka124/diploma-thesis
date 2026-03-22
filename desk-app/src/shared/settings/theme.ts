export const THEME_MODES = ['dark', 'light'] as const;
export type ThemeMode = (typeof THEME_MODES)[number];

export const THEME_ACCENTS = ['pink', 'blue', 'green', 'amber'] as const;
export type Accent = (typeof THEME_ACCENTS)[number];

export type ThemeState = {
  mode: ThemeMode;
  accent: Accent;
};

export const THEME_DEFAULT_STATE: ThemeState = {
  mode: 'dark',
  accent: 'pink',
};

export function isThemeMode(value: unknown): value is ThemeMode {
  return typeof value === 'string' && THEME_MODES.includes(value as ThemeMode);
}

export function isAccent(value: unknown): value is Accent {
  return typeof value === 'string' && THEME_ACCENTS.includes(value as Accent);
}

export function coerceThemeState(value: unknown): ThemeState {
  const raw = (value ?? {}) as Partial<ThemeState>;

  return {
    mode: isThemeMode(raw.mode) ? raw.mode : THEME_DEFAULT_STATE.mode,
    accent: isAccent(raw.accent) ? raw.accent : THEME_DEFAULT_STATE.accent,
  };
}
