import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getLoginStatus } from '../api';
import { BrandLogo } from '../components/BrandLogo';

type LoginStatus = {
  authDisabled: boolean;
  googleSsoConfigured: boolean;
  authenticated: boolean;
  user?: { email: string; displayName: string };
};

export function LoginPage(): JSX.Element {
  const [status, setStatus] = useState<LoginStatus | null>(null);

  useEffect(() => {
    let active = true;
    async function load(): Promise<void> {
      const data = await getLoginStatus();
      if (active) {
        setStatus(data);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  if (!status) {
    return <div className="login-shell">Loading...</div>;
  }

  if (status.authenticated) {
    return (
      <div className="login-shell">
        <article className="login-card">
          <div className="login-brand">
            <BrandLogo compact />
          </div>
          <h1>Session active</h1>
          <p>
            Signed in as {status.user?.displayName ?? 'User'} (
            {status.user?.email ?? '-'})
          </p>
          <Link className="button" to="/">
            Open dashboard
          </Link>
        </article>
      </div>
    );
  }

  return (
    <div className="login-shell">
      <article className="login-card">
        <div className="login-brand">
          <BrandLogo compact />
        </div>
        <h1>Sign-in required</h1>
        <p>
          {status.authDisabled
            ? 'AUTH_DISABLE=true is active. The app is accessible without SSO.'
            : status.googleSsoConfigured
              ? 'Sign in with your Google account to access the dashboard.'
              : 'Google SSO is not configured. Check GOOGLE_OAUTH_* environment variables.'}
        </p>
        {status.authDisabled ? (
          <Link className="button" to="/">
            Access dashboard
          </Link>
        ) : status.googleSsoConfigured ? (
          <a className="button" href="/auth/google">
            Sign in with Google
          </a>
        ) : null}
      </article>
    </div>
  );
}
