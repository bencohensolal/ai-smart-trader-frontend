import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { UserAiUsage, getLoginStatus, getUserAiUsage, getUserSettings } from '../api';
import { useI18n } from '../i18n/i18n';
import { formatAmountFromEur } from '../currency';

export function UserMenu(): JSX.Element {
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const [displayName, setDisplayName] = useState(t('userMenu.defaultUser'));
  const [aiUsage, setAiUsage] = useState<UserAiUsage | null>(null);
  const [dailyCostBudgetEur, setDailyCostBudgetEur] = useState<number | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const location = useLocation();
  const loadStatus = useCallback(async (): Promise<void> => {
    try {
      const [status, usagePayload, settingsPayload] = await Promise.all([
        getLoginStatus(),
        getUserAiUsage(),
        getUserSettings(),
      ]);
      if (status.user?.displayName?.trim()) {
        setDisplayName(status.user.displayName.trim());
      }
      setAiUsage(usagePayload.usage);
      const budget = settingsPayload.settings.aiAdvisor.maxCostEurPerDay;
      setDailyCostBudgetEur(Number.isFinite(budget) && budget > 0 ? budget : null);
    } catch {
      setDisplayName(t('userMenu.defaultUser'));
      setAiUsage(null);
      setDailyCostBudgetEur(null);
    }
  }, [t]);

  useEffect(() => {
    setDisplayName((current) => {
      if (!current.trim() || current === 'Utilisateur' || current === 'User') {
        return t('userMenu.defaultUser');
      }
      return current;
    });
  }, [t]);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    if (!open) {
      return;
    }
    void loadStatus();
  }, [loadStatus, open]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent): void {
      if (!open) {
        return;
      }
      const root = rootRef.current;
      if (!root) {
        return;
      }
      if (event.target instanceof Node && root.contains(event.target)) {
        return;
      }
      setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
    };
  }, [open]);

  const initials = useMemo(() => {
    const parts = displayName
      .split(' ')
      .map((part) => part.trim())
      .filter(Boolean);
    if (parts.length === 0) {
      return 'U';
    }
    if (parts.length === 1) {
      return parts[0].slice(0, 1).toUpperCase();
    }
    return (parts[0].slice(0, 1) + parts[1].slice(0, 1)).toUpperCase();
  }, [displayName]);

  const formattedUsage = useMemo(() => {
    if (!aiUsage || aiUsage.totalCalls <= 0) {
      return null;
    }
    const numberFormatter = new Intl.NumberFormat(locale);
    return {
      callsText: t('userMenu.aiUsage.calls', {
        total: numberFormatter.format(aiUsage.totalCalls),
        success: numberFormatter.format(aiUsage.successfulCalls),
        failed: numberFormatter.format(aiUsage.failedCalls),
      }),
      tokensText: t('userMenu.aiUsage.tokens', {
        tokens: numberFormatter.format(aiUsage.totalTokens),
      }),
      costText: t('userMenu.aiUsage.cost', {
        cost: formatAmountFromEur(aiUsage.estimatedCostEur, {
          locale,
          minimumFractionDigits: 2,
          maximumFractionDigits: 6,
        }),
      }),
      latencyText: t('userMenu.aiUsage.latency', {
        durationMs: numberFormatter.format(aiUsage.averageDurationMs),
      }),
      modelText: aiUsage.lastModel
        ? t('userMenu.aiUsage.model', {
            model: aiUsage.lastModel,
          })
        : '',
    };
  }, [aiUsage, locale, t]);

  const dailyBudgetUsage = useMemo(() => {
    if (!dailyCostBudgetEur || dailyCostBudgetEur <= 0) {
      return null;
    }
    const used = Math.max(0, aiUsage?.estimatedCostEur ?? 0);
    const pct = Math.min(100, (used / dailyCostBudgetEur) * 100);
    return {
      pct,
      label: t('userMenu.aiUsage.dailyBudget', {
        used: formatAmountFromEur(used, {
          locale,
          minimumFractionDigits: 2,
          maximumFractionDigits: 6,
        }),
        budget: formatAmountFromEur(dailyCostBudgetEur, {
          locale,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
        pct: new Intl.NumberFormat(locale, {
          maximumFractionDigits: 1,
        }).format(pct),
      }),
    };
  }, [aiUsage, dailyCostBudgetEur, locale, t]);

  return (
    <div className="user-menu" ref={rootRef}>
      <button
        className="user-menu-trigger"
        type="button"
        onClick={() => {
          setOpen((current) => !current);
        }}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="user-avatar" aria-hidden="true">
          {initials}
        </span>
        <span className="user-name">{displayName}</span>
      </button>

      {open ? (
        <div className="user-menu-popover" role="menu">
          <section className="user-menu-usage" aria-label={t('userMenu.aiUsage.title')}>
            <strong>{t('userMenu.aiUsage.title')}</strong>
            {formattedUsage ? (
              <>
                <span>{formattedUsage.callsText}</span>
                <span>{formattedUsage.tokensText}</span>
                <span>{formattedUsage.costText}</span>
                <span>{formattedUsage.latencyText}</span>
                {formattedUsage.modelText ? <span>{formattedUsage.modelText}</span> : null}
              </>
            ) : (
              <span>{t('userMenu.aiUsage.none')}</span>
            )}
            {dailyBudgetUsage ? (
              <div
                className="user-menu-usage-progress"
                aria-label={t('userMenu.aiUsage.dailyBudgetTitle')}
              >
                <span>{dailyBudgetUsage.label}</span>
                <div className="user-menu-usage-progress-track" aria-hidden>
                  <div
                    className="user-menu-usage-progress-fill"
                    style={{ width: `${dailyBudgetUsage.pct}%` }}
                  />
                </div>
              </div>
            ) : null}
            <Link to="/ai-usage" role="menuitem">
              {t('userMenu.aiUsage.openDetails')}
            </Link>
          </section>
          <Link to="/profile" role="menuitem">
            {t('userMenu.profile')}
          </Link>
          <Link to="/settings" role="menuitem">
            {t('userMenu.settings')}
          </Link>
          <Link to="/help" role="menuitem">
            {t('userMenu.help')}
          </Link>
          <a href="/auth/logout" role="menuitem">
            {t('userMenu.logout')}
          </a>
        </div>
      ) : null}
    </div>
  );
}
