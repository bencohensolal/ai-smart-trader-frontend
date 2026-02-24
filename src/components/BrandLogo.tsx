import { Link } from 'react-router-dom';

type BrandLogoProps = {
  subtitle?: string;
  compact?: boolean;
};

export function BrandLogo({
  subtitle,
  compact = false,
}: BrandLogoProps): JSX.Element {
  return (
    <Link className="brand-logo-link" to="/" aria-label="AI Smart Trader">
      <span className="brand-logo-mark" aria-hidden="true">
        <img src="/brand/ai-smart-trader-icon.svg" alt="" />
      </span>
      <span className="brand-logo-text">
        <strong>AI Smart Trader</strong>
        {!compact && subtitle ? <span>{subtitle}</span> : null}
      </span>
    </Link>
  );
}
