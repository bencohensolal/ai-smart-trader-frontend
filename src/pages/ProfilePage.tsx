import { FormEvent, useEffect, useState } from 'react';
import {
  UserProfile,
  getCurrentUser,
  getUserProfile,
  isUnauthorizedError,
  saveUserProfile,
} from '../api';
import { Layout } from '../components/Layout';
import { DatePickerInput } from '../components/DatePickerInput';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n/i18n';

export function ProfilePage(): JSX.Element {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [statusKind, setStatusKind] = useState<'success' | 'error'>('success');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    async function load(): Promise<void> {
      try {
        const [profilePayload, me] = await Promise.all([getUserProfile(), getCurrentUser()]);
        if (!active) {
          return;
        }
        setProfile(profilePayload.profile);
        setEmail(me.user?.email ?? '');
      } catch (error) {
        if (!active) {
          return;
        }
        if (isUnauthorizedError(error)) {
          navigate('/login', { replace: true });
          return;
        }
        setStatusKind('error');
        setStatus('Unable to load your profile.');
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [navigate]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!profile) {
      return;
    }
    try {
      setSaving(true);
      const payload = await saveUserProfile(profile);
      setProfile(payload.profile);
      setStatusKind('success');
      setStatus('Profile saved.');
    } catch (error) {
      if (isUnauthorizedError(error)) {
        navigate('/login', { replace: true });
        return;
      }
      setStatusKind('error');
      setStatus('Unable to save profile.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout title={t('page.profile.title')} subtitle={t('page.profile.subtitle')}>
      {!profile ? (
        <section className="panel">{t('settings.loading')}</section>
      ) : (
        <section className="panel">
          <form
            className="strategy-form strategy-form--stacked"
            onSubmit={(event) => void handleSubmit(event)}
          >
            <div className="form-grid">
              <label className="field">
                <span className="field-label">{t('auto.first_name')}</span>
                <input
                  value={profile.firstName}
                  onChange={(event) => {
                    setProfile({ ...profile, firstName: event.target.value });
                  }}
                />
              </label>
              <label className="field">
                <span className="field-label">{t('auto.last_name')}</span>
                <input
                  value={profile.lastName}
                  onChange={(event) => {
                    setProfile({ ...profile, lastName: event.target.value });
                  }}
                />
              </label>
              <label className="field">
                <span className="field-label">{t('auto.date_of_birth')}</span>
                <DatePickerInput
                  value={profile.birthDate}
                  onChange={(event) => {
                    setProfile({ ...profile, birthDate: event });
                  }}
                />
              </label>
              <label className="field">
                <span className="field-label">Email (Google)</span>
                <input value={email} disabled />
              </label>
              <label className="field">
                <span className="field-label">{t('auto.country')}</span>
                <input
                  value={profile.country}
                  onChange={(event) => {
                    setProfile({ ...profile, country: event.target.value });
                  }}
                />
              </label>
              <label className="field">
                <span className="field-label">{t('auto.city')}</span>
                <input
                  value={profile.city}
                  onChange={(event) => {
                    setProfile({ ...profile, city: event.target.value });
                  }}
                />
              </label>
              <label className="field">
                <span className="field-label">{t('auto.time_zone')}</span>
                <input
                  value={profile.timezone}
                  onChange={(event) => {
                    setProfile({ ...profile, timezone: event.target.value });
                  }}
                />
              </label>
              <label className="field">
                <span className="field-label">{t('auto.occupation')}</span>
                <input
                  value={profile.occupation}
                  onChange={(event) => {
                    setProfile({ ...profile, occupation: event.target.value });
                  }}
                />
              </label>
              <label className="field">
                <span className="field-label">{t('auto.investment_experience_level')}</span>
                <select
                  value={profile.investmentExperience}
                  onChange={(event) => {
                    setProfile({
                      ...profile,
                      investmentExperience: event.target
                        .value as UserProfile['investmentExperience'],
                    });
                  }}
                >
                  <option value="beginner">{t('auto.beginner')}</option>
                  <option value="intermediate">{t('auto.intermediate')}</option>
                  <option value="advanced">{t('auto.advanced')}</option>
                </select>
              </label>
            </div>

            <label className="field">
              <span className="field-label">{t('auto.bio_goals')}</span>
              <textarea
                rows={4}
                value={profile.bio}
                onChange={(event) => {
                  setProfile({ ...profile, bio: event.target.value });
                }}
              />
            </label>

            <div className="form-actions">
              <button className="button" type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save profile'}
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
