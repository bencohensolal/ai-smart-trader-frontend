import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserSettings, getUserSettings, isUnauthorizedError, saveUserSettings } from '../api';
import { normalizeLanguage, useI18n } from '../i18n/i18n';
import { Layout } from '../components/Layout';
import {
  AVAILABLE_THEMES,
  ColorMode,
  applyColorMode,
  applyTheme,
  applyVisualPreferences,
  getStoredColorMode,
} from '../theme';
import { DisplayCurrency, applyDisplayCurrency, getStoredDisplayCurrency } from '../currency';

export function SettingsPage(): JSX.Element {
  const { t, setLocale } = useI18n();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [status, setStatus] = useState('');
  const [statusKind, setStatusKind] = useState<'success' | 'error'>('success');
  const [saving, setSaving] = useState(false);
  const [colorMode, setColorMode] = useState<ColorMode>(getStoredColorMode() ?? 'dark');
  const [displayCurrency, setDisplayCurrency] = useState<DisplayCurrency>(
    getStoredDisplayCurrency(),
  );

  useEffect(() => {
    let active = true;
    async function load(): Promise<void> {
      try {
        const payload = await getUserSettings();
        if (!active) {
          return;
        }
        setSettings(payload.settings);
        applyVisualPreferences(payload.settings);
        setLocale(normalizeLanguage(payload.settings.language));
        setColorMode(getStoredColorMode() ?? 'dark');
        setDisplayCurrency(getStoredDisplayCurrency());
      } catch (error) {
        if (!active) {
          return;
        }
        if (isUnauthorizedError(error)) {
          navigate('/login', { replace: true });
          return;
        }
        setStatusKind('error');
        setStatus(t('settings.loadError'));
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [navigate, setLocale]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!settings) {
      return;
    }
    try {
      setSaving(true);
      const payload = await saveUserSettings({
        theme: settings.theme,
        language: settings.language,
        defaultLandingPage: settings.defaultLandingPage,
        showTooltips: settings.showTooltips,
        denseTables: settings.denseTables,
      });
      setSettings(payload.settings);
      applyVisualPreferences(payload.settings);
      setLocale(normalizeLanguage(payload.settings.language));
      setStatusKind('success');
      setStatus(t('settings.saved'));
    } catch (error) {
      if (isUnauthorizedError(error)) {
        navigate('/login', { replace: true });
        return;
      }
      setStatusKind('error');
      setStatus(t('settings.saveError'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout title={t('settings.title')} subtitle={t('settings.subtitle')}>
      {!settings ? (
        <section className="panel">{t('settings.loading')}</section>
      ) : (
        <section className="panel">
          <form
            className="strategy-form strategy-form--stacked"
            onSubmit={(event) => void handleSubmit(event)}
          >
            <div className="form-grid">
              <label className="field">
                <span className="field-label">{t('settings.colorTheme')}</span>
                <select
                  value={settings.theme}
                  onChange={(event) => {
                    const nextTheme = event.target.value as UserSettings['theme'];
                    setSettings({
                      ...settings,
                      theme: nextTheme,
                    });
                    applyTheme(nextTheme);
                  }}
                >
                  {AVAILABLE_THEMES.map((theme) => {
                    return (
                      <option key={theme.id} value={theme.id}>
                        {theme.name} - {theme.description}
                      </option>
                    );
                  })}
                </select>
              </label>

              <label className="field">
                <span className="field-label">{t('settings.language')}</span>
                <select
                  value={settings.language}
                  onChange={(event) => {
                    const nextLanguage = normalizeLanguage(event.target.value);
                    setSettings({
                      ...settings,
                      language: nextLanguage,
                    });
                    setLocale(nextLanguage);
                  }}
                >
                  <option value="fr">{t('settings.language.fr')}</option>
                  <option value="en">{t('settings.language.en')}</option>
                </select>
              </label>

              <label className="field">
                <span className="field-label">{t('settings.colorMode')}</span>
                <select
                  value={colorMode}
                  onChange={(event) => {
                    const nextColorMode = event.target.value as ColorMode;
                    setColorMode(nextColorMode);
                    applyColorMode(nextColorMode);
                  }}
                >
                  <option value="dark">{t('settings.colorMode.dark')}</option>
                  <option value="light">{t('settings.colorMode.light')}</option>
                </select>
              </label>

              <label className="field">
                <span className="field-label">{t('settings.displayCurrency')}</span>
                <select
                  value={displayCurrency}
                  onChange={(event) => {
                    const nextCurrency = event.target.value as DisplayCurrency;
                    setDisplayCurrency(nextCurrency);
                    applyDisplayCurrency(nextCurrency);
                  }}
                >
                  <option value="EUR">{t('settings.displayCurrency.eur')}</option>
                  <option value="USD">{t('settings.displayCurrency.usd')}</option>
                  <option value="GBP">{t('settings.displayCurrency.gbp')}</option>
                  <option value="CHF">{t('settings.displayCurrency.chf')}</option>
                </select>
              </label>

              <label className="field">
                <span className="field-label">{t('settings.defaultLandingPage')}</span>
                <select
                  value={settings.defaultLandingPage}
                  onChange={(event) => {
                    setSettings({
                      ...settings,
                      defaultLandingPage: event.target.value as UserSettings['defaultLandingPage'],
                    });
                  }}
                >
                  <option value="dashboard">{t('settings.landing.dashboard')}</option>
                  <option value="simulations">{t('settings.landing.simulations')}</option>
                  <option value="strategies">{t('settings.landing.strategies')}</option>
                  <option value="insights">{t('settings.landing.insights')}</option>
                </select>
              </label>
            </div>

            <div className="form-toggle-row">
              <div
                className={`toggle-btn${settings.showTooltips ? ' selected' : ''}`}
                tabIndex={0}
                role="button"
                aria-pressed={settings.showTooltips}
                onClick={() =>
                  setSettings({
                    ...settings,
                    showTooltips: !settings.showTooltips,
                  })
                }
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    setSettings({
                      ...settings,
                      showTooltips: !settings.showTooltips,
                    });
                  }
                }}
              >
                {t('settings.tooltips')}
              </div>
              <div
                className={`toggle-btn${settings.denseTables ? ' selected' : ''}`}
                tabIndex={0}
                role="button"
                aria-pressed={settings.denseTables}
                onClick={() =>
                  setSettings({
                    ...settings,
                    denseTables: !settings.denseTables,
                  })
                }
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    setSettings({
                      ...settings,
                      denseTables: !settings.denseTables,
                    });
                  }
                }}
              >
                {t('settings.denseTables')}
              </div>
            </div>

            <div className="form-actions">
              <button className="button" type="submit" disabled={saving}>
                {saving ? t('settings.saving') : t('settings.save')}
              </button>
            </div>
          </form>
        </section>
      )}

      {status ? (
        <section
          className={`panel status ${statusKind === 'error' ? 'status-error' : 'status-success'}`}
        >
          {status}
        </section>
      ) : null}
    </Layout>
  );
}
