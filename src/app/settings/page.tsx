import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { PrivacySettings } from "@/features/settings/privacy-settings";

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        eyebrow="设置"
        title="训练与隐私设置"
        description="Configure correction style, subtitle preference, data retention, and server-side AI settings."
      />
      <div className="grid gap-4">
        <section className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-5">
          <StatusPill tone="success">隐私优先</StatusPill>
          <h2 className="mt-4 text-lg font-semibold">默认行为</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Confidential mode should be enabled by default, and OpenAI API keys must only be used from server-side route handlers.
          </p>
        </section>
        <PrivacySettings />
      </div>
    </>
  );
}
