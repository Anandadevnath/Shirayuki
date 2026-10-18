import type { Metadata } from "next";
import { LegalPage } from "@/components/common/LegalPage";

export const metadata: Metadata = {
  title: "DMCA",
  description: "Copyright and takedown information for Shirayuki.",
};

export default function DmcaPage() {
  return (
    <LegalPage eyebrow="Legal" title="DMCA" updated="October 2026">
      <p>
        Shirayuki does not host any content. It is a discovery interface that links to
        material hosted by non-affiliated third parties.
      </p>

      <h2>Filing a notice</h2>
      <ul>
        <li>If you believe content reachable through Shirayuki infringes your copyright, contact the hosting provider directly.</li>
        <li>Because we do not store files, we cannot remove material we do not host.</li>
        <li>We will remove any link that points to infringing material when notified appropriately.</li>
      </ul>

      <h2>Counter-notice</h2>
      <p>
        If a link was removed in error, you may submit a counter-notice through the
        community links in the footer.
      </p>
    </LegalPage>
  );
}
