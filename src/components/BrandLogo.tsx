import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/i18n';

type BrandLogoProps = {
  subtitle?: string;
  compact?: boolean;
};

export function BrandLogo({ subtitle, compact = false }: BrandLogoProps): JSX.Element {
  const { t } = useI18n();
  return (
    <Link className="brand-logo-link" to="/" aria-label="AI Smart Trader">
      <span className="brand-logo-mark" aria-hidden="true">
        <img src="/brand/ai-smart-trader-icon.svg" alt="" />
      </span>
      <span className="brand-logo-text">
        <strong>{t('auto.ai_smart_trader')}</strong>
        {!compact && subtitle ? <span>{subtitle}</span> : null}
      </span>
    </Link>
  );
}
