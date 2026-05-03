import { NextResponse } from "next/server";
import { decode } from "@/decoder";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return NextResponse.json(
      { error: "Missing required query parameter 'code'." },
      { status: 400 }
    );
  }

  const decoded = decode(code);
  return NextResponse.json(decoded, {
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
