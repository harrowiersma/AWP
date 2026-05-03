"use client";

import { useState } from "react";
import FileDropzone from "./FileDropzone";
import BatchProgress from "./BatchProgress";
import { parseCsv, buildCsv } from "@/batch/parse-csv";
import { parseXlsx, buildXlsx } from "@/batch/parse-xlsx";
import {
  APPENDED_COLUMNS,
  detectCodeColumn,
  processRows,
} from "@/batch/pipeline";

type Stage = "idle" | "parsing" | "needs-column" | "decoding" | "ready" | "error";

export default function BatchClient() {
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [format, setFormat] = useState<"csv" | "xlsx">("csv");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [codeColumn, setCodeColumn] = useState<string>("");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  async function handleFile(file: File) {
    setError(null);
    setDownloadUrl(null);
    setFileName(file.name);
    setStage("parsing");

    const isXlsx = /\.xlsx?$/i.test(file.name);
    setFormat(isXlsx ? "xlsx" : "csv");

    try {
      const parsed = isXlsx ? await parseXlsx(file) : await parseCsv(file);
      if (parsed.headers.length === 0 || parsed.rows.length === 0) {
        setError("No rows or headers found in the file.");
        setStage("error");
        return;
      }
      setHeaders(parsed.headers);
      setRows(parsed.rows);

      const idx = detectCodeColumn(parsed.headers);
      if (idx >= 0) {
        const col = parsed.headers[idx];
        setCodeColumn(col);
        await runDecode(parsed.headers, parsed.rows, col, isXlsx);
      } else {
        setStage("needs-column");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStage("error");
    }
  }

  async function runDecode(
    hdrs: string[],
    rws: Record<string, string>[],
    col: string,
    isXlsx: boolean
  ) {
    setStage("decoding");
    setProgress({ done: 0, total: rws.length });

    // Process in chunks so the UI can render progress for very large files.
    const out: Record<string, string>[] = [];
    const CHUNK = 500;
    for (let i = 0; i < rws.length; i += CHUNK) {
      const slice = rws.slice(i, i + CHUNK);
      out.push(...processRows(slice, col));
      setProgress({ done: Math.min(i + CHUNK, rws.length), total: rws.length });
      // yield to the event loop so React can repaint
      await new Promise((r) => setTimeout(r, 0));
    }

    const newHeaders = [...hdrs.filter((h) => !APPENDED_COLUMNS.includes(h)), ...APPENDED_COLUMNS];
    const blob = isXlsx ? buildXlsx(newHeaders, out) : buildCsv(newHeaders, out);
    const url = URL.createObjectURL(blob);
    setDownloadUrl(url);
    setStage("ready");
  }

  async function pickColumn(col: string) {
    setCodeColumn(col);
    await runDecode(headers, rows, col, format === "xlsx");
  }

  const downloadName = (() => {
    if (!fileName) return `decoded.${format}`;
    const base = fileName.replace(/\.(csv|xls|xlsx)$/i, "");
    return `${base}.decoded.${format === "xlsx" ? "xlsx" : "csv"}`;
  })();

  return (
    <>
      <div className="card">
        <FileDropzone onFile={handleFile} />

        {stage === "parsing" && (
          <p style={{ marginTop: "1rem", color: "var(--muted)" }}>Parsing file…</p>
        )}

        {stage === "error" && (
          <div className="banner banner-err" style={{ marginTop: "1rem" }}>
            {error}
          </div>
        )}

        {stage === "needs-column" && (
          <div style={{ marginTop: "1rem" }}>
            <p>
              We couldn&apos;t auto-detect a material-number column. Pick the column that contains
              the speaking numbers:
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {headers.map((h) => (
                <button key={h} type="button" onClick={() => pickColumn(h)}>
                  {h}
                </button>
              ))}
            </div>
          </div>
        )}

        {stage === "decoding" && (
          <BatchProgress done={progress.done} total={progress.total} />
        )}

        {stage === "ready" && downloadUrl && (
          <div className="banner banner-ok" style={{ marginTop: "1rem" }}>
            Decoded {progress.total} rows from <code>{fileName}</code> using column{" "}
            <code>{codeColumn}</code>.
            <div style={{ marginTop: "0.6rem" }}>
              <a href={downloadUrl} download={downloadName}>
                <button type="button">Download {downloadName}</button>
              </a>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
