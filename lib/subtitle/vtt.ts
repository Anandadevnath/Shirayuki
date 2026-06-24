// Minimal VTT parser. Produces a flat list of cues with start/end seconds
// and a plain-text payload (VTT tags stripped, line breaks preserved).
// No deps; ~1KB. Handles the common subset used by anime fansubs: timing
// lines, optional cue identifiers, and inline `<i>`/`<b>`/`<c>`/`<v>` tags.

export interface VttCue {
  start: number;
  end: number;
  text: string;
}

const TIMING = /^(\d{1,2}:)?\d{1,2}:\d{2}\.\d{3}\s+-->\s+(\d{1,2}:)?\d{1,2}:\d{2}\.\d{3}/;

function toSeconds(stamp: string): number {
  // stamp = HH:MM:SS.mmm or MM:SS.mmm
  const parts = stamp.split(":");
  const seconds = parseFloat(parts[parts.length - 1]!);
  const minutes = parseInt(parts[parts.length - 2]!, 10);
  const hours = parts.length === 3 ? parseInt(parts[0]!, 10) : 0;
  return hours * 3600 + minutes * 60 + seconds;
}

function stripTags(s: string): string {
  // Strip VTT inline tags but keep their text content. <c.classname>text</c>
  // becomes `text`; <00:00:01.000> (timestamp tags) become empty.
  return s
    .replace(/<\/?[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

export function parseVtt(src: string): VttCue[] {
  const cues: VttCue[] = [];
  // Normalize line endings, drop BOM
  const raw = src.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  const blocks = raw.split(/\n\n+/);

  for (const block of blocks) {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) continue;

    // Find the timing line (skip optional cue id on first line)
    let timingIdx = lines.findIndex((l) => TIMING.test(l));
    if (timingIdx === -1) continue;
    const timingLine = lines[timingIdx]!;
    const m = timingLine.match(
      /((?:\d{1,2}:)?\d{1,2}:\d{2}\.\d{3})\s+-->\s+((?:\d{1,2}:)?\d{1,2}:\d{2}\.\d{3})/,
    );
    if (!m) continue;
    const start = toSeconds(m[1]!);
    const end = toSeconds(m[2]!);

    const textLines = lines.slice(timingIdx + 1);
    if (!textLines.length) continue;
    const text = stripTags(textLines.join("\n"));

    cues.push({ start, end, text });
  }

  cues.sort((a, b) => a.start - b.start);
  return cues;
}

/** Find the active cue for the given playhead. Binary search. */
export function findCue(cues: VttCue[], time: number): VttCue | null {
  if (!cues.length) return null;
  let lo = 0;
  let hi = cues.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const c = cues[mid]!;
    if (time < c.start) hi = mid - 1;
    else if (time >= c.end) lo = mid + 1;
    else return c;
  }
  return null;
}
