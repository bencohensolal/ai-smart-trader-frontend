import { Navigate, Route, Routes } from 'react-router-dom';
import { Suspense, lazy, useEffect, useState } from 'react';
import { getUserSettings, isUnauthorizedError } from './api';

const DashboardPage = lazy(async () => {
  const module = await import('./pages/DashboardPage');
  return { default: module.DashboardPage };
});
const InsightsPage = lazy(async () => {
  const module = await import('./pages/InsightsPage');
  return { default: module.InsightsPage };
});
const MovementPage = lazy(async () => {
  const module = await import('./pages/MovementPage');
  return { default: module.MovementPage };
});
const StrategiesV2Page = lazy(async () => {
  const module = await import('./pages/StrategiesV2Page');
  return { default: module.StrategiesV2Page };
});
const LoginPage = lazy(async () => {
  const module = await import('./pages/LoginPage');
  return { default: module.LoginPage };
});
const SimulationsPage = lazy(async () => {
  const module = await import('./pages/SimulationsPage');
  return { default: module.SimulationsPage };
});
const SimulationReportPage = lazy(async () => {
  const module = await import('./pages/SimulationReportPage');
  return { default: module.SimulationReportPage };
});
const SimulationOperationPage = lazy(async () => {
  const module = await import('./pages/SimulationOperationPage');
  return { default: module.SimulationOperationPage };
});
const ProfilePage = lazy(async () => {
  const module = await import('./pages/ProfilePage');
  return { default: module.ProfilePage };
});
const SettingsPage = lazy(async () => {
  const module = await import('./pages/SettingsPage');
  return { default: module.SettingsPage };
});
const HelpPage = lazy(async () => {
  const module = await import('./pages/HelpPage');
  return { default: module.HelpPage };
});
const AiUsagePage = lazy(async () => {
  const module = await import('./pages/AiUsagePage');
  return { default: module.AiUsagePage };
});

export function App(): JSX.Element {
  return (
    <Suspense fallback={<main className="app-shell">Loading...</main>}>
      <Routes>
        <Route path="/" element={<HomeRoute />} />
        <Route path="/strategies" element={<StrategiesV2Page />} />
        <Route path="/insights" element={<InsightsPage />} />
        <Route path="/simulations" element={<SimulationsPage />} />
        <Route path="/simulations/:simulationId" element={<SimulationReportPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/prompts" element={<Navigate to="/ai-usage" replace />} />
        <Route path="/ai-usage" element={<AiUsagePage />} />
        <Route
          path="/simulations/:simulationId/operations/:operationId"
          element={<SimulationOperationPage />}
        />
        <Route path="/movements/:movementId" element={<MovementPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

function HomeRoute(): JSX.Element {
  const [landing, setLanding] = useState<
    'dashboard' | 'simulations' | 'strategies' | 'insights' | 'loading'
  >('loading');

  useEffect(() => {
    let active = true;
    async function loadLanding(): Promise<void> {
      try {
        const payload = await getUserSettings();
        if (!active) {
          return;
        }
        setLanding(payload.settings.defaultLandingPage);
      } catch (error) {
        if (!active) {
          return;
        }
        if (isUnauthorizedError(error)) {
          setLanding('dashboard');
          return;
        }
        setLanding('dashboard');
      }
    }
    void loadLanding();
    return () => {
      active = false;
    };
  }, []);

  if (landing === 'loading') {
    return <DashboardPage />;
  }
  if (landing === 'dashboard') {
    return <DashboardPage />;
  }
  return <Navigate to={'/' + landing} replace />;
}
