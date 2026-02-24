import { UserTheme } from './api';

export type ColorMode = 'dark' | 'light';

const THEME_STORAGE_KEY = 'ai-smart-trader.theme';
const COLOR_MODE_STORAGE_KEY = 'ai-smart-trader.color-mode';

export const AVAILABLE_THEMES: Array<{
  id: UserTheme;
  name: string;
  description: string;
}> = [
  {
    id: 'ocean',
    name: 'Ocean',
    description: 'Deep blue palette with mint accents.',
  },
  {
    id: 'sunset',
    name: 'Sunset',
    description: 'Warm atmosphere with high contrast.',
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Green palette inspired by calmer markets.',
  },
  {
    id: 'slate',
    name: 'Slate',
    description: 'Neutral, understated theme for long sessions.',
  },
];

export function applyTheme(theme: UserTheme): void {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

export function applyColorMode(mode: ColorMode): void {
  document.documentElement.setAttribute('data-color-mode', mode);
  localStorage.setItem(COLOR_MODE_STORAGE_KEY, mode);
}

export function applyVisualPreferences(input: {
  theme: UserTheme;
  denseTables: boolean;
  showTooltips: boolean;
  colorMode?: ColorMode;
}): void {
  applyTheme(input.theme);
  applyColorMode(input.colorMode ?? getStoredColorMode() ?? 'dark');
  document.body.classList.toggle('dense-tables', input.denseTables);
  document.body.setAttribute('data-tooltips', input.showTooltips ? 'enabled' : 'disabled');
}

export function getStoredTheme(): UserTheme | null {
  const raw = localStorage.getItem(THEME_STORAGE_KEY);
  if (raw === 'ocean' || raw === 'sunset' || raw === 'forest' || raw === 'slate') {
    return raw;
  }
  return null;
}

export function getStoredColorMode(): ColorMode | null {
  const raw = localStorage.getItem(COLOR_MODE_STORAGE_KEY);
  if (raw === 'dark' || raw === 'light') {
    return raw;
  }
  return null;
}
