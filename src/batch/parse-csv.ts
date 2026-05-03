import Papa from "papaparse";

export type ParsedTable = {
  headers: string[];
  rows: Record<string, string>[];
};

export async function parseCsv(file: File): Promise<ParsedTable> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      transform: (v) => (typeof v === "string" ? v : String(v ?? "")),
      complete: (result) => {
        const headers = (result.meta.fields ?? []).map(String);
        const rows = (result.data ?? []) as Record<string, string>[];
        resolve({ headers, rows });
      },
      error: (err) => reject(err),
    });
  });
}

export function buildCsv(headers: string[], rows: Record<string, string>[]): Blob {
  const csv = Papa.unparse({ fields: headers, data: rows });
  return new Blob([csv], { type: "text/csv;charset=utf-8;" });
}
