import type { DecodedNumber, FieldResult } from "@/decoder";

const FIELD_ORDER: Array<keyof DecodedNumber["fields"]> = [
  "productType",
  "connectionType",
  "pressure",
  "size",
  "screwMaterial",
  "bodyMaterial",
  "medium",
  "handwheelCap",
  "connectionDetails",
  "suffix",
];

function Row({ field }: { field: FieldResult }) {
  return (
    <tr>
      <td>{field.position}</td>
      <td>
        <div>{field.fieldEn}</div>
        <div style={{ color: "var(--muted)", fontSize: "0.85rem" }}>{field.fieldDe}</div>
      </td>
      <td>
        <span className="code-cell">{field.rawCode || "—"}</span>
      </td>
      <td>
        {field.found ? (
          <>
            <div>{field.valueEn}</div>
            {field.valueDe && field.valueDe !== field.valueEn && (
              <div style={{ color: "var(--muted)", fontSize: "0.85rem" }}>{field.valueDe}</div>
            )}
          </>
        ) : (
          <span className="unknown">unknown</span>
        )}
      </td>
    </tr>
  );
}

export default function DecodeResult({ result }: { result: DecodedNumber }) {
  return (
    <section className="card">
      {result.errors.length > 0 ? (
        <div className="banner banner-err">
          <strong>Could not decode.</strong>
          <ul style={{ margin: "0.25rem 0 0 1.25rem" }}>
            {result.errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      ) : result.valid ? (
        <div className="banner banner-ok">
          Successfully decoded all positions.
        </div>
      ) : (
        <div className="banner banner-warn">
          Decoded with warnings — some positions are unknown or context-dependent.
        </div>
      )}

      {result.normalized && (
        <p>
          Normalised: <span className="normalized">{result.normalized}</span>
        </p>
      )}

      {result.errors.length === 0 && (
        <table className="result-table">
          <thead>
            <tr>
              <th>Pos</th>
              <th>Field</th>
              <th>Code</th>
              <th>Meaning</th>
            </tr>
          </thead>
          <tbody>
            {FIELD_ORDER.map((key) => (
              <Row key={key} field={result.fields[key]} />
            ))}
          </tbody>
        </table>
      )}

      {result.warnings.length > 0 && (
        <>
          <h2>Warnings</h2>
          <ul>
            {result.warnings.map((w, i) => (
              <li key={i} style={{ color: "var(--warn)" }}>
                {w}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
