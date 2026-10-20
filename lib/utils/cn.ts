import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * The `.text-<role>` classes (see `app/globals.css`) are font-size utilities:
 * each bundles family + size + line-height + tracking (+ weight). tailwind-merge
 * can't infer that from the bare name, so it classified `text-title`, `text-meta`
 * … as a text *colour* and silently deleted the role whenever a colour was
 * merged after it — `cn("text-title", "text-snow")` returned `"text-snow"`. That
 * quietly disabled the whole role system on every call site that also set a
 * colour (nav links, CTA buttons, the watch page, the palette).
 *
 * Declaring the roles as font sizes makes the merge honest: a role survives a
 * colour, and a real size utility still replaces another role, which is the
 * correct precedence (`cn("text-title", "text-[1.125rem]")` keeps only the
 * explicit size).
 */
const TYPE_ROLES = [
  "hero",
  "display",
  "page",
  "section",
  "title",
  "body",
  "desc",
  "meta",
  "caption",
  "btn",
  "label",
  "eyebrow",
];

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: TYPE_ROLES }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
