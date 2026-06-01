import { BookOpenText, FileUp, MessageSquareWarning } from "lucide-react";
import Link from "next/link";
import type { ComponentType } from "react";

type QuickAction = {
  href: string;
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
};

const quickActions: QuickAction[] = [
  {
    href: "/materials",
    label: "上传客户材料",
    description: "让 AI 根据材料生成准备卡和客户问题。",
    icon: FileUp,
  },
  {
    href: "/objection-bank",
    label: "练一个常见异议",
    description: "快速进入隐私、价格、竞品等高压追问。",
    icon: MessageSquareWarning,
  },
  {
    href: "/phrasebook",
    label: "复习 5 句表达",
    description: "把最近复盘沉淀的表达练到更顺口。",
    icon: BookOpenText,
  },
];

export function QuickActionStrip() {
  return (
    <section aria-label="快速入口" className="grid gap-3 md:grid-cols-3">
      {quickActions.map((action) => {
        const Icon = action.icon;

        return (
          <Link
            key={action.href}
            href={action.href}
            className="group flex min-h-24 items-start gap-3 rounded-md border border-[var(--border)] bg-[var(--surface)] p-4 transition hover:border-[var(--primary)] hover:bg-[#f6fbfa]"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[var(--surface-subtle)] text-[var(--primary)] transition group-hover:bg-[#e7f4f2]">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-[var(--foreground)]">
                {action.label}
              </span>
              <span className="mt-1 block text-sm leading-6 text-[var(--muted)]">
                {action.description}
              </span>
            </span>
          </Link>
        );
      })}
    </section>
  );
}
