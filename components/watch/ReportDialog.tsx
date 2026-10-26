"use client";

/**
 * Report-a-playback-issue dialog. Submits to `POST /api/report`, which persists
 * the row (anonymous allowed) and returns a receipt id. A success message is
 * shown ONLY when the server actually stored the report — a failure surfaces the
 * server's message instead, so the UI never claims an unsubmitted report.
 */

import { useEffect, useRef, useState } from "react";
import { X, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const CATEGORIES: { value: string; label: string }[] = [
  { value: "VIDEO_WONT_PLAY", label: "Video does not play" },
  { value: "WRONG_EPISODE", label: "Wrong episode" },
  { value: "SUBTITLE_ISSUE", label: "Subtitles issue" },
  { value: "AUDIO_ISSUE", label: "Audio issue" },
  { value: "INCORRECT_METADATA", label: "Incorrect metadata" },
  { value: "OTHER", label: "Other" },
];

export interface ReportDialogProps {
  open: boolean;
  onClose: () => void;
  context: {
    animeId: string;
    episodeId: string | null;
    episodeNumber: number | null;
    server: string | null;
    audio: "sub" | "dub";
  };
}

export function ReportDialog({ open, onClose, context }: ReportDialogProps) {
  const [category, setCategory] = useState<string>("VIDEO_WONT_PLAY");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Reset transient state each time the dialog opens.
  useEffect(() => {
    if (open) {
      setResult(null);
      setBusy(false);
    }
  }, [open]);

  if (!open) return null;

  const submit = async () => {
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          animeId: context.animeId,
          episodeId: context.episodeId,
          episodeNumber: context.episodeNumber,
          category,
          message: message.trim() || null,
          server: context.server,
          category_audio: context.audio,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; submitted?: boolean };
      if (res.ok && data.submitted) {
        setResult({ ok: true, text: "Thanks — your report was submitted." });
      } else if (res.status === 503) {
        setResult({ ok: false, text: "Reporting isn't configured on this deployment." });
      } else {
        setResult({ ok: false, text: data.error ?? "Could not submit the report. Try again." });
      }
    } catch {
      setResult({ ok: false, text: "Network error. Could not submit the report." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm" role="presentation">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-title"
        className="menu-in w-full max-w-md rounded-md glass p-5 text-snow shadow-[var(--shadow-frost)] motion-reduce:animate-none"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 id="report-title" className="text-title text-snow">Report a playback issue</h2>
            <p className="text-caption mt-0.5 text-faint">
              Episode {context.episodeNumber ?? "—"} · {context.audio.toUpperCase()}
              {context.server ? ` · ${context.server}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close report dialog"
            className="grid size-7 shrink-0 place-items-center rounded-sm text-faint transition-colors hover:text-snow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-frost"
          >
            <X className="size-4" />
          </button>
        </div>

        {result?.ok ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle2 className="size-8 text-success" />
            <p className="text-body text-snow">{result.text}</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-1 rounded-[var(--radius-btn)] bg-frost px-4 py-2 text-sm font-semibold on-frost transition-transform hover:scale-[1.04] motion-reduce:transition-none"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <fieldset className="mb-4">
              <legend className="text-meta mb-1.5 font-medium text-snow">What went wrong?</legend>
              <div className="grid gap-1.5 sm:grid-cols-2">
                {CATEGORIES.map((c) => (
                  <label
                    key={c.value}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-[var(--radius-btn)] border px-3 py-2 text-body transition-colors",
                      category === c.value
                        ? "border-frost/60 bg-frost-soft text-snow"
                        : "border-line/70 bg-surface/50 text-muted hover:border-frost/40 hover:text-snow",
                    )}
                  >
                    <input
                      type="radio"
                      name="report-category"
                      value={c.value}
                      checked={category === c.value}
                      onChange={() => setCategory(c.value)}
                      className="accent-frost"
                    />
                    {c.label}
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="mb-1.5 block text-meta font-medium text-snow" htmlFor="report-message">
              Details <span className="text-faint">(optional)</span>
            </label>
            <textarea
              id="report-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={1000}
              rows={3}
              placeholder="Anything specific that helps us reproduce it…"
              className="mb-4 w-full resize-none rounded-[var(--radius-btn)] border border-line/70 bg-surface px-3 py-2 text-body text-snow placeholder:text-faint transition-colors focus-visible:border-frost/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-frost"
            />

            {result && !result.ok && (
              <p role="alert" className="mb-3 text-caption text-warning">{result.text}</p>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="press rounded-[var(--radius-btn)] border border-line/70 px-4 py-2 text-meta text-muted transition-colors hover:text-snow"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void submit()}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-[var(--radius-btn)] bg-frost px-4 py-2 text-sm font-semibold on-frost transition-transform hover:scale-[1.04] disabled:opacity-60 motion-reduce:transition-none"
              >
                {busy && <Loader2 className="size-4 animate-spin" />}
                Submit report
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
