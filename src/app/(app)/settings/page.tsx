import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { AiDiagnosticsPanel } from "@/features/settings/ai-diagnostics-panel";
import { PrivacySettings } from "@/features/settings/privacy-settings";
import { requireAuthContext } from "@/lib/auth/require-user";
import {
  listAiCallDiagnosticsAsync,
  summarizeAiCallDiagnostics,
} from "@/lib/ai/diagnostics";

export default async function SettingsPage() {
  const authContext = await requireAuthContext();
  const aiDiagnostics = await listAiCallDiagnosticsAsync({
    limit: 20,
    userId: authContext.profileId,
  });

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
        <AiDiagnosticsPanel
          diagnostics={aiDiagnostics}
          summary={summarizeAiCallDiagnostics(aiDiagnostics)}
        />
        <PrivacySettings />
      </div>
    </>
  );
}
