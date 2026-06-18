import { NextResponse } from "next/server";
import { getSchedule, safe } from "@/lib/api";

/** Per-day airing schedule for the home "Estimated Schedule" panel. The first
 *  (current) day is server-rendered; the client hits this route for other days
 *  when a tab is selected. Underlying provider fetch is cached (revalidate 600). */
export async function GET(request: Request) {
  const date = new URL(request.url).searchParams.get("date")?.trim();
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ items: [] }, { status: 400 });
  }
  const res = await safe(() => getSchedule(date));
  if (!res.ok) return NextResponse.json({ items: [] });
  return NextResponse.json({ items: res.data });
}
