import BatchClient from "@/components/BatchClient";

export default function BatchPage() {
  return (
    <>
      <h1>Batch decode (CSV / XLSX)</h1>
      <p className="lead">
        Drop in a spreadsheet of material numbers — we&apos;ll add columns with the decoded
        product type, pressure, size, materials, medium, and options. Files are processed locally
        in your browser; nothing is uploaded.
      </p>
      <BatchClient />
    </>
  );
}
