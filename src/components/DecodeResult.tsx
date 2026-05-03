"use client";

import { useState } from "react";
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

function detectSubsystem(result: DecodedNumber): string | null {
  const family = result.fields.productType.extra?.family as string | undefined;
  if (family === "DGL") return "DGL — Pressure gas line";
  if (family === "BS-Kit") return "BS-Kit — Burst-disc assembly";
  if (family === "HRS" || family === "HRSN") return "HRS — Hand regulating valve";
  if (family === "FlangeKit") return "Flange kit (WV-SV combination)";
  return null;
}

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
  const [copied, setCopied] = useState<"url" | "json" | null>(null);
  const subsystem = detectSubsystem(result);

  function copyUrl() {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/api/decode?code=${encodeURIComponent(
      result.normalized || result.input
    )}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied("url");
      setTimeout(() => setCopied(null), 1500);
    });
  }

  function downloadJson() {
    const blob = new Blob([JSON.stringify(result, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(result.normalized || "decode").slice(0, 20)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

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

      {subsystem && (
        <p style={{ marginTop: "-0.5rem", marginBottom: "0.75rem" }}>
          <span className="subsystem-tag">{subsystem}</span>
        </p>
      )}

      {result.normalized && (
        <div className="normalized-row">
          <div>
            Normalised: <span className="normalized">{result.normalized}</span>
          </div>
          <div className="action-buttons">
            <button type="button" className="ghost" onClick={copyUrl}>
              {copied === "url" ? "Copied ✓" : "Copy API URL"}
            </button>
            <button type="button" className="ghost" onClick={downloadJson}>
              Download JSON
            </button>
          </div>
        </div>
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
