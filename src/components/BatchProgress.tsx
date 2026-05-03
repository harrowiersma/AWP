type Props = {
  done: number;
  total: number;
  message?: string;
};

export default function BatchProgress({ done, total, message }: Props) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div className="progress">
      <div className="progress-bar">
        <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <div style={{ fontSize: "0.85rem", color: "var(--muted)", marginTop: "0.4rem" }}>
        {message ?? `${done} of ${total} rows decoded (${pct}%)`}
      </div>
    </div>
  );
}
