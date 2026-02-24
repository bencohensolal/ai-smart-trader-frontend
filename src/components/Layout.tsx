import { NavLink, useLocation } from 'react-router-dom';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { getCurrentUser, getUserSettings } from '../api';
import { normalizeLanguage, useI18n } from '../i18n/i18n';
import {
  applyColorMode,
  applyTheme,
  applyVisualPreferences,
  getStoredColorMode,
  getStoredTheme,
} from '../theme';
import { BrandLogo } from './BrandLogo';
import { UserMenu } from './UserMenu';

type LayoutProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

type RealtimeNotification = {
  id: string;
  type:
    | 'strategy_created'
    | 'strategy_updated'
    | 'strategy_deleted'
    | 'strategies_reset'
    | 'ai_recommendation';
  title: string;
  message: string;
  createdAt: string;
};

export function Layout({
  title,
  subtitle,
  children,
}: LayoutProps): JSX.Element {
  const { t, setLocale } = useI18n();
  const location = useLocation();
  const [realtimeNotifications, setRealtimeNotifications] = useState<
    RealtimeNotification[]
  >([]);

  const realtimeServerUrl = useMemo(() => {
    if (typeof window === 'undefined') {
      return 'http://127.0.0.1:3000';
    }

    if (window.location.port === '5173') {
      return `${window.location.protocol}//${window.location.hostname}:3000`;
    }

    return window.location.origin;
  }, []);

  const handleNavClick = (event: React.MouseEvent<HTMLAnchorElement>): void => {
    const anchor = event.currentTarget;
    const destination = anchor.getAttribute('href');
    if (!destination) {
      return;
    }
    if (destination === location.pathname) {
      event.preventDefault();
      window.location.assign(destination);
    }
  };

  useEffect(() => {
    const stored = getStoredTheme();
    if (stored) {
      applyTheme(stored);
    }

    const storedColorMode = getStoredColorMode();
    if (storedColorMode) {
      applyColorMode(storedColorMode);
    }
  }, []);

  useEffect(() => {
    let active = true;
    async function loadThemeFromSettings(): Promise<void> {
      try {
        const payload = await getUserSettings();
        if (!active) {
          return;
        }
        applyVisualPreferences(payload.settings);
        setLocale(normalizeLanguage(payload.settings.language));
      } catch {
        // Keep local fallback theme when API is unavailable.
      }
    }
    void loadThemeFromSettings();
    return () => {
      active = false;
    };
  }, [setLocale]);

  useEffect(() => {
    let mounted = true;
    const timers: number[] = [];

    async function connect(): Promise<() => void> {
      const currentUser = await getCurrentUser().catch(() => ({
        authenticated: false,
      }));

      const ownerId =
        currentUser.authenticated && currentUser.user?.email
          ? currentUser.user.email
          : 'auth-disabled';

      const socket = io(realtimeServerUrl, {
        path: '/socket.io',
        withCredentials: true,
        transports: ['websocket'],
        auth: {
          ownerId,
        },
      });

      socket.on('notification', (notification: RealtimeNotification) => {
        if (!mounted) {
          return;
        }

        setRealtimeNotifications((current) =>
          [notification, ...current].slice(0, 4),
        );
        const timer = window.setTimeout(() => {
          setRealtimeNotifications((current) =>
            current.filter((item) => item.id !== notification.id),
          );
        }, 10000);
        timers.push(timer);
      });

      return () => {
        socket.disconnect();
      };
    }

    let cleanup: (() => void) | null = null;
    void connect().then((disconnect) => {
      cleanup = disconnect;
    });

    return () => {
      mounted = false;
      for (const timer of timers) {
        window.clearTimeout(timer);
      }
      if (cleanup) {
        cleanup();
      }
    };
  }, [realtimeServerUrl]);

  return (
    <div className="shell">
      {realtimeNotifications.length > 0 ? (
        <div className="realtime-notifications" aria-live="polite">
          {realtimeNotifications.map((notification) => (
            <article key={notification.id} className="realtime-notification">
              <strong>{notification.title}</strong>
              <span>{notification.message}</span>
            </article>
          ))}
        </div>
      ) : null}

      <header className="topbar">
        <div className="brand">
          <BrandLogo subtitle={t('layout.brand.tagline')} />
        </div>
        <nav className="menu">
          <NavLink to="/" onClick={handleNavClick}>
            {t('layout.nav.dashboard')}
          </NavLink>
          <NavLink to="/strategies" onClick={handleNavClick}>
            {t('layout.nav.strategies')}
          </NavLink>
          <NavLink to="/insights" onClick={handleNavClick}>
            {t('layout.nav.insights')}
          </NavLink>
          <NavLink to="/simulations" onClick={handleNavClick}>
            {t('layout.nav.simulations')}
          </NavLink>
        </nav>
        <UserMenu />
      </header>

      <section className="hero">
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </section>

      {children}
    </div>
  );
}
