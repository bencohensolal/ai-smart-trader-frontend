import { Layout } from '../components/Layout';
import { useI18n } from '../i18n/i18n';

export function HelpPage(): JSX.Element {
  const { t } = useI18n();
  return (
    <Layout title={t('page.help.title')} subtitle={t('page.help.subtitle')}>
      <section className="panel">
        <h2>{t('help.goal.title')}</h2>
        <p>{t('help.goal.body')}</p>
      </section>

      <section className="panel">
        <h2>{t('help.how.title')}</h2>
        <ul className="cards-list">
          <li>
            <h3>{t('help.how.1.title')}</h3>
            <p>{t('help.how.1.body')}</p>
          </li>
          <li>
            <h3>{t('help.how.2.title')}</h3>
            <p>{t('help.how.2.body')}</p>
          </li>
          <li>
            <h3>{t('help.how.3.title')}</h3>
            <p>{t('help.how.3.body')}</p>
          </li>
          <li>
            <h3>{t('help.how.4.title')}</h3>
            <p>{t('help.how.4.body')}</p>
          </li>
        </ul>
      </section>

      <section className="panel">
        <h2>{t('help.modes.title')}</h2>
        <ul className="cards-list">
          <li>
            <h3>{t('help.modes.1.title')}</h3>
            <p>{t('help.modes.1.body')}</p>
          </li>
          <li>
            <h3>{t('help.modes.2.title')}</h3>
            <p>{t('help.modes.2.body')}</p>
          </li>
          <li>
            <h3>{t('help.modes.3.title')}</h3>
            <p>{t('help.modes.3.body')}</p>
          </li>
          <li>
            <h3>{t('help.modes.4.title')}</h3>
            <p>{t('help.modes.4.body')}</p>
          </li>
        </ul>
      </section>

      <section className="panel">
        <h2>{t('help.best.title')}</h2>
        <ul className="cards-list">
          <li>
            <h3>{t('help.best.1.title')}</h3>
            <p>{t('help.best.1.body')}</p>
          </li>
          <li>
            <h3>{t('help.best.2.title')}</h3>
            <p>{t('help.best.2.body')}</p>
          </li>
          <li>
            <h3>{t('help.best.3.title')}</h3>
            <p>{t('help.best.3.body')}</p>
          </li>
        </ul>
      </section>
    </Layout>
  );
}
