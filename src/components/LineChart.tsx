type LineChartPoint = {
  label: string;
  value: number;
};

type LineChartProps = {
  title: string;
  subtitle?: string;
  points: LineChartPoint[];
  stroke?: string;
  valueFormatter?: (value: number) => string;
};

export function LineChart({
  title,
  subtitle,
  points,
  stroke = '#00c389',
  valueFormatter = (value) => value.toFixed(2),
}: LineChartProps): JSX.Element {
  const width = 640;
  const height = 220;
  const padding = 22;

  if (points.length === 0) {
    return (
      <article className="panel chart-panel">
        <h3>{title}</h3>
        {subtitle ? <p>{subtitle}</p> : null}
        <p>No data available.</p>
      </article>
    );
  }

  const minValue = Math.min(...points.map((point) => point.value));
  const maxValue = Math.max(...points.map((point) => point.value));
  const range = Math.max(1, maxValue - minValue);
  const xStep = points.length > 1 ? (width - padding * 2) / (points.length - 1) : 0;

  const coordinates = points.map((point, index) => {
    const x = padding + xStep * index;
    const normalized = (point.value - minValue) / range;
    const y = height - padding - normalized * (height - padding * 2);
    return { x, y };
  });
  const polyline = coordinates
    .map((coordinate) => `${coordinate.x.toFixed(2)},${coordinate.y.toFixed(2)}`)
    .join(' ');

  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];
  const delta = Number((lastPoint.value - firstPoint.value).toFixed(2));
  const deltaPrefix = delta > 0 ? '+' : '';

  return (
    <article className="panel chart-panel">
      <div className="chart-head">
        <div>
          <h3>{title}</h3>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        <div className="chart-stats">
          <strong>{valueFormatter(lastPoint.value)}</strong>
          <span>
            {deltaPrefix}
            {valueFormatter(delta)}
          </span>
        </div>
      </div>
      <svg className="line-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title}>
        <polyline
          fill="none"
          stroke={stroke}
          strokeWidth="2.5"
          points={polyline}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
      <div className="chart-foot">
        <span>{firstPoint.label}</span>
        <span>{lastPoint.label}</span>
      </div>
      <div className="chart-range">
        <span>Min: {valueFormatter(minValue)}</span>
        <span>Max: {valueFormatter(maxValue)}</span>
      </div>
    </article>
  );
}
