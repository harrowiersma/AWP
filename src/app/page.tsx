import DecodeForm from "@/components/DecodeForm";

export default function Page() {
  return (
    <>
      <h1>Decode a GEA AWP speaking number</h1>
      <p className="lead">
        Paste a 16-character ENS material code below to see what each position encodes —
        product family, end connections, pressure rating, size, materials, medium, and options.
      </p>
      <DecodeForm />
    </>
  );
}
