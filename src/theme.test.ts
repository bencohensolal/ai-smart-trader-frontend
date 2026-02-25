import { describe, it, expect, beforeEach } from 'vitest';
import {
  applyTheme,
  applyColorMode,
  applyVisualPreferences,
  getStoredTheme,
  getStoredColorMode,
  AVAILABLE_THEMES,
} from './theme';

describe('theme', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.removeAttribute('data-color-mode');
    document.body.className = '';
    document.body.removeAttribute('data-tooltips');
  });

  describe('AVAILABLE_THEMES', () => {
    it('should export available themes', () => {
      expect(AVAILABLE_THEMES).toHaveLength(4);
      expect(AVAILABLE_THEMES.map((t) => t.id)).toEqual(['ocean', 'sunset', 'forest', 'slate']);
    });

    it('should have name and description for each theme', () => {
      AVAILABLE_THEMES.forEach((theme) => {
        expect(theme.name).toBeTruthy();
        expect(theme.description).toBeTruthy();
      });
    });
  });

  describe('applyTheme', () => {
    it('should apply ocean theme', () => {
      applyTheme('ocean');
      expect(document.documentElement.getAttribute('data-theme')).toBe('ocean');
      expect(localStorage.getItem('ai-smart-trader.theme')).toBe('ocean');
    });

    it('should apply sunset theme', () => {
      applyTheme('sunset');
      expect(document.documentElement.getAttribute('data-theme')).toBe('sunset');
      expect(localStorage.getItem('ai-smart-trader.theme')).toBe('sunset');
    });

    it('should apply forest theme', () => {
      applyTheme('forest');
      expect(document.documentElement.getAttribute('data-theme')).toBe('forest');
      expect(localStorage.getItem('ai-smart-trader.theme')).toBe('forest');
    });

    it('should apply slate theme', () => {
      applyTheme('slate');
      expect(document.documentElement.getAttribute('data-theme')).toBe('slate');
      expect(localStorage.getItem('ai-smart-trader.theme')).toBe('slate');
    });
  });

  describe('applyColorMode', () => {
    it('should apply dark mode', () => {
      applyColorMode('dark');
      expect(document.documentElement.getAttribute('data-color-mode')).toBe('dark');
      expect(localStorage.getItem('ai-smart-trader.color-mode')).toBe('dark');
    });

    it('should apply light mode', () => {
      applyColorMode('light');
      expect(document.documentElement.getAttribute('data-color-mode')).toBe('light');
      expect(localStorage.getItem('ai-smart-trader.color-mode')).toBe('light');
    });
  });

  describe('applyVisualPreferences', () => {
    it('should apply all preferences with default color mode', () => {
      applyVisualPreferences({
        theme: 'ocean',
        denseTables: true,
        showTooltips: false,
      });

      expect(document.documentElement.getAttribute('data-theme')).toBe('ocean');
      expect(document.documentElement.getAttribute('data-color-mode')).toBe('dark');
      expect(document.body.classList.contains('dense-tables')).toBe(true);
      expect(document.body.getAttribute('data-tooltips')).toBe('disabled');
    });

    it('should apply all preferences with explicit color mode', () => {
      applyVisualPreferences({
        theme: 'sunset',
        denseTables: false,
        showTooltips: true,
        colorMode: 'light',
      });

      expect(document.documentElement.getAttribute('data-theme')).toBe('sunset');
      expect(document.documentElement.getAttribute('data-color-mode')).toBe('light');
      expect(document.body.classList.contains('dense-tables')).toBe(false);
      expect(document.body.getAttribute('data-tooltips')).toBe('enabled');
    });

    it('should use stored color mode when not explicitly provided', () => {
      localStorage.setItem('ai-smart-trader.color-mode', 'light');

      applyVisualPreferences({
        theme: 'forest',
        denseTables: true,
        showTooltips: true,
      });

      expect(document.documentElement.getAttribute('data-color-mode')).toBe('light');
    });

    it('should handle dense tables toggling', () => {
      applyVisualPreferences({
        theme: 'slate',
        denseTables: true,
        showTooltips: true,
      });
      expect(document.body.classList.contains('dense-tables')).toBe(true);

      applyVisualPreferences({
        theme: 'slate',
        denseTables: false,
        showTooltips: true,
      });
      expect(document.body.classList.contains('dense-tables')).toBe(false);
    });
  });

  describe('getStoredTheme', () => {
    it('should return null when no theme is stored', () => {
      expect(getStoredTheme()).toBeNull();
    });

    it('should return ocean theme', () => {
      localStorage.setItem('ai-smart-trader.theme', 'ocean');
      expect(getStoredTheme()).toBe('ocean');
    });

    it('should return sunset theme', () => {
      localStorage.setItem('ai-smart-trader.theme', 'sunset');
      expect(getStoredTheme()).toBe('sunset');
    });

    it('should return forest theme', () => {
      localStorage.setItem('ai-smart-trader.theme', 'forest');
      expect(getStoredTheme()).toBe('forest');
    });

    it('should return slate theme', () => {
      localStorage.setItem('ai-smart-trader.theme', 'slate');
      expect(getStoredTheme()).toBe('slate');
    });

    it('should return null for invalid theme', () => {
      localStorage.setItem('ai-smart-trader.theme', 'invalid');
      expect(getStoredTheme()).toBeNull();
    });
  });

  describe('getStoredColorMode', () => {
    it('should return null when no color mode is stored', () => {
      expect(getStoredColorMode()).toBeNull();
    });

    it('should return dark mode', () => {
      localStorage.setItem('ai-smart-trader.color-mode', 'dark');
      expect(getStoredColorMode()).toBe('dark');
    });

    it('should return light mode', () => {
      localStorage.setItem('ai-smart-trader.color-mode', 'light');
      expect(getStoredColorMode()).toBe('light');
    });

    it('should return null for invalid color mode', () => {
      localStorage.setItem('ai-smart-trader.color-mode', 'invalid');
      expect(getStoredColorMode()).toBeNull();
    });
  });
});
