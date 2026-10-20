import type { Metadata } from "next";
import { LegalPage } from "@/components/common/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that govern your use of Shirayuki.",
};

export default function TermsPage() {
  return (
    <LegalPage eyebrow="Legal" title="Terms of Service" updated="October 2026">
      <p>
        Shirayuki is a personal, non-commercial interface that helps you discover and
        play anime. By using the site you agree to these terms.
      </p>

      <h2>Use of the service</h2>
      <ul>
        <li>Shirayuki does not host, store, or upload any video files on its servers.</li>
        <li>All media is streamed from non-affiliated third-party providers.</li>
        <li>You are responsible for how you use the service and for complying with the laws of your jurisdiction.</li>
      </ul>

      <h2>No warranty</h2>
      <p>
        The service is provided &ldquo;as is&rdquo;, without warranty of any kind. Availability of
        third-party streams is outside our control and may change or fail without notice.
      </p>

      <h2>Changes</h2>
      <p>
        These terms may be updated from time to time. Continued use of the site after a
        change constitutes acceptance of the revised terms.
      </p>
    </LegalPage>
  );
}
