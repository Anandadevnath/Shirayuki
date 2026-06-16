import Link from "next/link";
import { Snowflake } from "lucide-react";

export default function NotFound() {
  return (
    <div className="grid place-items-center gap-4 py-24 text-center">
      <Snowflake className="size-10 text-frost" />
      <h2 className="text-3xl font-bold">Lost in the snow</h2>
      <p className="max-w-sm text-sm text-muted">
        This page drifted away. Let’s get you back to the catalogue.
      </p>
      <Link
        href="/"
        className="mt-1 rounded-sm bg-frost px-5 py-2.5 text-sm font-semibold text-base transition-transform hover:scale-[1.03]"
      >
        Back home
      </Link>
    </div>
  );
}
