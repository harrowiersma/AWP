import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "EULA — AWP Speaking Number Decoder",
  description:
    "End User License Agreement for the AWP Speaking Number Decoder, a Xappo proof-of-concept for GEA AWP.",
};

export default function EulaPage() {
  return (
    <article className="legal">
      <h1>AWP Speaking Number Decoder — End User License Agreement</h1>
      <p className="last-updated">Last updated: 2026-05-03</p>

      <p>
        This is a placeholder for the AWP Speaking Number Decoder End User License
        Agreement. The complete EULA content will be provided by XAPPO Enterprises
        Ltd.&apos;s legal team.
      </p>
      <p>
        The AWP Speaking Number Decoder is a proof-of-concept (V1.2 AWP PoC) and is
        intended for use by authorised GEA AWP personnel and project stakeholders.
        Access, use, and distribution are subject to the final EULA terms once
        published.
      </p>

      <h2>Summary terms (non-binding)</h2>
      <ul>
        <li>
          <strong>Permitted use:</strong> decoding GEA AWP speaking numbers for
          internal engineering, sales, and documentation workflows.
        </li>
        <li>
          <strong>Prohibited use:</strong> reverse-engineering, redistribution of the
          underlying lookup data, or use in unauthorised commercial offerings.
        </li>
        <li>
          <strong>No warranty:</strong> the service is provided &ldquo;as is&rdquo;; the
          decoded specifications are derived from published GEA AWP catalog data and
          should be confirmed against the authoritative AWP source for any
          safety-critical or contractual decision.
        </li>
        <li>
          <strong>Data:</strong> see the{" "}
          <a href="/privacy">Privacy Policy</a> for how data is handled.
        </li>
        <li>
          <strong>Contact:</strong>{" "}
          <a href="mailto:office@xappo.enterprises">office@xappo.enterprises</a> for
          licensing questions.
        </li>
      </ul>

      <p>
        Until the final EULA is published, use of the AWP Speaking Number Decoder
        constitutes acceptance of the terms summarised above.
      </p>
    </article>
  );
}
