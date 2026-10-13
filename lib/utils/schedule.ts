/**
 * Canonical weekday order for the release calendar — starts Saturday and runs
 * through Friday. Sits in a module WITHOUT `"use client"` so both the server
 * rendered pages (`/schedule`, home) and the client `ScheduleCalendar` can
 * import it directly; a value imported from a `"use client"` module into a
 * server component is an opaque client reference, not a usable array.
 */
export const WEEK_ORDER = [
  "Saturday",
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
] as const;
