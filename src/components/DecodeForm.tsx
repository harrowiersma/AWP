"use client";

import { useState, type FormEvent } from "react";
import { decode } from "@/decoder";
import type { DecodedNumber } from "@/decoder";
import DecodeResult from "./DecodeResult";

const EXAMPLES = [
  "24020C14A5A30100",
  "26G00C15A5A30000",
  "45828D10A5A10000",
  "26300C19A5A38800",
  "26300C19A5A30000RM",
  "02560D10A5A30000",
  "01884.15.5/00R11",
  "44201.10.5/xx001",
];

export default function DecodeForm() {
  const [value, setValue] = useState("");
  const [result, setResult] = useState<DecodedNumber | null>(null);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setResult(decode(value));
  }

  function pickExample(code: string) {
    setValue(code);
    setResult(decode(code));
  }

  return (
    <>
      <form className="card" onSubmit={onSubmit}>
        <label htmlFor="code-input" style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>
          Speaking number
        </label>
        <div className="field-row">
          <input
            id="code-input"
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="e.g. 24020C14A5A30100"
            spellCheck={false}
            autoComplete="off"
          />
          <button type="submit">Decode</button>
        </div>
        <div className="examples">
          <span style={{ color: "var(--muted)", fontSize: "0.85rem", alignSelf: "center" }}>
            Try:
          </span>
          {EXAMPLES.map((c) => (
            <button key={c} type="button" onClick={() => pickExample(c)}>
              {c}
            </button>
          ))}
        </div>
      </form>

      {result && <DecodeResult result={result} />}
    </>
  );
}
