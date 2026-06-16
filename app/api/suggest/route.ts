import { NextResponse } from "next/server";
import { suggest, safe } from "@/lib/api";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ results: [] });
  const res = await safe(() => suggest(q));
  if (!res.ok) return NextResponse.json({ results: [] });
  return NextResponse.json({ results: res.data.slice(0, 8) });
}
