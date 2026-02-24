type InfoTipProps = {
  label: string;
  text: string;
};

export function InfoTip({ label, text }: InfoTipProps): JSX.Element {
  return (
    <span
      className="info-tip"
      role="img"
      aria-label={label + ': ' + text}
      title={text}
    >
      ?
    </span>
  );
}
