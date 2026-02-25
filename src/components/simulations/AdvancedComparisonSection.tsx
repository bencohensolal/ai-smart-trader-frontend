import { FormEvent, ReactElement } from 'react';
import { AdvancedBacktestingComparisonResult, Strategy } from '../../api';
import { DatePickerInput } from '../DatePickerInput';
import { InfoTip } from '../InfoTip';
import { formatAmountFromEur } from '../../currency';
import { useI18n } from '../../i18n/i18n';

type AdvancedComparisonSectionProps = {
  strategies: Strategy[];
  periodStart: string;
  periodEnd: string;
  selectedStrategyIds: string[];
  useLiveAiInSimulation: boolean;
  running: boolean;
  result: AdvancedBacktestingComparisonResult | null;
  onPeriodStartChange: (value: string) => void;
  onPeriodEndChange: (value: string) => void;
  onApplyPeriodPreset: (days: number) => void;
  onToggleLiveAi: (value: boolean) => void;
  onToggleStrategy: (strategyId: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function AdvancedComparisonSection({
  strategies,
  periodStart,
  periodEnd,
  selectedStrategyIds,
  useLiveAiInSimulation,
  running,
  result,
  onPeriodStartChange,
  onPeriodEndChange,
  onApplyPeriodPreset,
  onToggleLiveAi,
  onToggleStrategy,
  onSubmit,
}: AdvancedComparisonSectionProps): ReactElement {
  const { t } = useI18n();
  return (
    <>
      <h2>Multi-strategy comparison (same period)</h2>
      <p>{t('auto.select_2_to_3_strategies_defin')}</p>
      <form className="strategy-form strategy-form--stacked" onSubmit={onSubmit}>
        <div className="form-grid">
          <label className="field">
            <span>{t('auto.period_start')}</span>
            <DatePickerInput
              value={periodStart}
              max={periodEnd || undefined}
              onChange={onPeriodStartChange}
            />
          </label>
          <label className="field">
            <span>{t('auto.period_end')}</span>
            <DatePickerInput
              value={periodEnd}
              min={periodStart || undefined}
              onChange={onPeriodEndChange}
            />
          </label>
        </div>

        <div className="date-range-presets" aria-label="A/B period presets">
          {[10, 30, 90, 180, 365].map((days) => {
            return (
              <button
                key={`ab-period-preset-${days}`}
                className="button button-secondary button-small"
                type="button"
                onClick={() => {
                  onApplyPeriodPreset(days);
                }}
              >
                {days}d
              </button>
            );
          })}
        </div>

        <div className="field checkbox-field">
          <span>
            {t('auto.use_live_ai_for_these_parallel')}
            <InfoTip
              label="Live AI (comparison)"
              text="Enables real AI calls during A/B comparison over the selected period."
            />
          </span>
          <div
            className={`toggle-btn${useLiveAiInSimulation ? ' selected' : ''}`}
            tabIndex={0}
            role="button"
            aria-pressed={useLiveAiInSimulation}
            onClick={() => onToggleLiveAi(!useLiveAiInSimulation)}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                onToggleLiveAi(!useLiveAiInSimulation);
              }
            }}
          >
            {useLiveAiInSimulation ? 'Live AI enabled' : 'Live AI disabled'}
          </div>
        </div>

        <div className="form-grid strategy-select-grid">
          {strategies.map((strategy) => {
            const checked = selectedStrategyIds.includes(strategy.id);
            const disabled = !checked && selectedStrategyIds.length >= 3;
            return (
              <div
                key={strategy.id}
                className={`strategy-select-item${checked ? ' selected' : ''}${disabled ? ' disabled' : ''}`}
                tabIndex={disabled ? -1 : 0}
                role="button"
                aria-pressed={checked}
                aria-disabled={disabled}
                onClick={() => {
                  if (!disabled) onToggleStrategy(strategy.id);
                }}
                onKeyDown={(e) => {
                  if (!disabled && (e.key === ' ' || e.key === 'Enter')) {
                    e.preventDefault();
                    onToggleStrategy(strategy.id);
                  }
                }}
              >
                <span>
                  {strategy.name} ({strategy.riskProfile})
                </span>
              </div>
            );
          })}
        </div>

        <div className="form-actions">
          <button className="button" type="submit" disabled={running}>
            {running ? 'A/B testing running...' : 'Run A/B comparison'}
          </button>
        </div>
      </form>

      {result ? (
        <>
          <section className="kpis">
            <article className="kpi">
              <span>{t('auto.best_strategy')}</span>
              <strong>{result.bestStrategyId}</strong>
            </article>
            <article className="kpi">
              <span>{t('auto.comparison_period')}</span>
              <strong>
                {result.periodStart} → {result.periodEnd}
              </strong>
            </article>
          </section>

          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>{t('auto.rank')}</th>
                  <th>{t('auto.strategy')}</th>
                  <th>{t('auto.return')}</th>
                  <th>{t('auto.net_profit')}</th>
                  <th>{t('auto.final_value')}</th>
                  <th>{t('auto.win_rate')}</th>
                  <th>{t('auto.operations')}</th>
                  <th>{t('auto.vs_best_return')}</th>
                </tr>
              </thead>
              <tbody>
                {result.ranking.map((row) => {
                  return (
                    <tr key={`ab-ranking-${row.strategyId}`}>
                      <td>#{row.rank}</td>
                      <td>{row.strategyName}</td>
                      <td>{row.returnPct.toFixed(2)}%</td>
                      <td>{formatAmountFromEur(row.netProfitEur)}</td>
                      <td>{formatAmountFromEur(row.finalValueEur)}</td>
                      <td>{row.winRatePct.toFixed(2)}%</td>
                      <td>{row.operationsCount}</td>
                      <td>{row.deltaVsBestReturnPct.toFixed(2)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </>
  );
}
