import { NextRequest } from "next/server";
import { playbackReportSchema } from "@/backend/schemas";
import { getOptionalUser } from "@/backend/services/session";
import { checkRateLimit, clientKey, type RateLimitConfig } from "@/lib/api/rate-limit";
import { errorResponse, fail, ok, requireDb, getDb } from "@/backend/services/http";

export const runtime = "nodejs";

/** Per-IP report limit. Reporting is unauthenticated by design, so this is the
 *  only guard against a loop/bot inserting unbounded rows. */
const REPORT_LIMIT: RateLimitConfig = { limit: 15, windowSeconds: 3600 };

/**
 * POST /api/report — submit a playback issue.
 *
 * Reporting is NOT account-gated: an anonymous visitor can report a broken
 * episode. When a session exists the report is attributed to the user;
 * otherwise it is stored with a null userId. Only a receipt id is returned —
 * the row is never echoed back. A success response is sent ONLY after the row
 * is persisted, so the UI never claims success without a real submission.
 */
export async function POST(req: NextRequest) {
  const guard = requireDb();
  if (guard) return guard;

  // Per-IP limit — an unauthenticated writer must not be able to flood the table.
  const rl = await checkRateLimit(clientKey(req, "report"), REPORT_LIMIT);
  if (!rl.allowed) {
    return fail(429, "Too many reports. Try again later.", { retryAfterSeconds: rl.retryAfterSeconds });
  }

  const user = await getOptionalUser();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail(400, "Invalid JSON body.");
  }
  const parsed = playbackReportSchema.safeParse(body);
  if (!parsed.success) return fail(422, parsed.error.issues[0]?.message ?? "Invalid report.");

  try {
    const row = await getDb().playbackReport.create({
      data: {
        userId: user?.id ?? null,
        animeId: parsed.data.animeId,
        episodeId: parsed.data.episodeId ?? null,
        episodeNumber: parsed.data.episodeNumber ?? null,
        category: parsed.data.category,
        message: parsed.data.message?.trim() || null,
        server: parsed.data.server ?? null,
        audio: parsed.data.category_audio ?? null,
      },
      select: { id: true },
    });
    return ok({ submitted: true, id: row.id }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
