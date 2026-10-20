import type { Metadata } from "next";
import { LegalPage } from "@/components/common/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Shirayuki handles information.",
};

export default function PrivacyPage() {
  return (
    <LegalPage eyebrow="Legal" title="Privacy Policy" updated="October 2026">
      <p>
        Shirayuki is built to collect as little as possible. This page explains what is
        stored and where.
      </p>

      <h2>What we store</h2>
      <ul>
        <li>Your watchlist, watch progress, and settings are stored locally in your browser only.</li>
        <li>This local data never leaves your device and is not sent to our servers.</li>
        <li>Clearing your browser storage removes it permanently.</li>
      </ul>

      <h2>Third parties</h2>
      <p>
        Video and metadata are served by non-affiliated third-party providers. Their own
        privacy practices apply to the requests your browser makes to them.
      </p>

      <h2>Contact</h2>
      <p>For privacy questions, reach out through the community links in the footer.</p>
    </LegalPage>
  );
}
