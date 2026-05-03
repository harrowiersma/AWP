import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — AWP Speaking Number Decoder",
  description: "Privacy policy for the AWP Speaking Number Decoder, a Xappo proof-of-concept.",
};

export default function PrivacyPage() {
  return (
    <article className="legal">
      <h1>AWP Speaking Number Decoder — Privacy Policy</h1>
      <p className="last-updated">Last updated: 2026-05-03</p>

      <p>
        XAPPO Enterprises Ltd. emphasizes data protection, stating: &ldquo;We at XAPPO
        Enterprises Ltd. know you care about your data and we take privacy of your data
        very seriously.&rdquo; By using the AWP Speaking Number Decoder, you acknowledge
        and accept these policies.
      </p>

      <h2>What does this Privacy Policy cover?</h2>
      <p>
        This policy governs data collection during use of the AWP Speaking Number
        Decoder, excluding external companies or unaffiliated parties. We do not
        knowingly collect or solicit personal information from anyone under the age of
        18.
      </p>

      <h2>Will XAPPO Enterprises Ltd. ever change this Privacy Policy?</h2>
      <p>
        Changes may occur with notification via platform notice, email, or other means.
        Users continuing to use the platform after updates implicitly consent to
        modifications.
      </p>

      <h2>Information You Provide to Us</h2>
      <p>
        The AWP Speaking Number Decoder is designed to operate <strong>entirely in your
        browser</strong> for both single-code lookups and batch CSV / XLSX file
        processing. Material numbers and uploaded files are decoded locally on your
        device and are <strong>not transmitted to our servers</strong>. The
        <code> /api/decode </code> endpoint accepts a single material code via query
        string for API integrations; such requests are not retained beyond standard
        request logs.
      </p>
      <p>
        Where any data is incidentally received (for example, error reports submitted
        by you), it is encrypted in transit and at rest, retained no longer than 30
        days, and used solely to operate, debug and improve the service. We do not
        share or sell this data, and communications focus exclusively on platform-related
        topics with unsubscribe options.
      </p>

      <h2>Information Collected Automatically</h2>
      <p>
        Standard server logs may capture IP addresses, device identifiers, cookies,
        browser type, and requested pages for the purpose of operating the service and
        detecting abuse. Cookies are identifiers enabling device recognition and usage
        tracking. Aggregate, anonymized usage data may inform feature development
        without personal identification.
      </p>

      <h2>Will XAPPO Enterprises Ltd. share any data it receives?</h2>
      <p>
        We neither rent nor sell any of the data you provide to us. Third-party access
        requires signed consent. We access incidental data only for debugging and
        improving the service. Limited sharing covers:
      </p>
      <ul>
        <li>
          <strong>Aggregated usage statistics:</strong> anonymized summaries shared
          with partners regarding service usage patterns.
        </li>
        <li>
          <strong>Protection of XAPPO and others:</strong> disclosure when legally
          required or necessary for rights or safety protection.
        </li>
      </ul>

      <h2>Compliance and Security</h2>
      <p>
        The AWP Speaking Number Decoder (by XAPPO Enterprises Ltd.) processes inputs
        client-side wherever possible. Any data that does reach our infrastructure is
        stored on servers hosted in the European Union and is fully compliant with
        all GDPR rules and regulations. Personal data handling follows GDPR
        requirements with controller / processor roles established as needed.
      </p>

      <h2>What if I have questions about this policy?</h2>
      <p>
        Inquiries should be directed to{" "}
        <a href="mailto:office@xappo.enterprises">office@xappo.enterprises</a> for
        resolution.
      </p>

      <hr />

      <h2>Your data protection highlights</h2>
      <ul>
        <li>
          <strong>Client-side processing:</strong> material numbers and uploaded files
          are decoded in your browser; nothing is uploaded.
        </li>
        <li>
          <strong>Automatic data deletion:</strong> any incidentally received data is
          removed within 30 days.
        </li>
        <li>
          <strong>GDPR compliance:</strong> full regulatory adherence.
        </li>
        <li>
          <strong>No data sales:</strong> zero commercial data trading.
        </li>
        <li>
          <strong>Encrypted storage:</strong> EU-hosted, encrypted at rest and in
          transit.
        </li>
        <li>
          <strong>Limited access:</strong> debugging and improvement purposes only.
        </li>
        <li>
          <strong>Transparent communication:</strong> clear policies with unsubscribe
          options.
        </li>
      </ul>
    </article>
  );
}
