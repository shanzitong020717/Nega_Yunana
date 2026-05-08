"use client";

import {
  BarChart3,
  BookOpenText,
  ClipboardList,
  FileText,
  LayoutDashboard,
  MessageSquareWarning,
  Mic2,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";

type NavHref =
  | "/dashboard"
  | "/materials"
  | "/practice"
  | "/objection-bank"
  | "/phrasebook"
  | "/progress"
  | "/settings";

type NavItem = {
  href: NavHref;
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
};

const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "首页",
    description: "今日重点",
    icon: LayoutDashboard,
  },
  {
    href: "/materials",
    label: "材料",
    description: "资料与简报",
    icon: FileText,
  },
  {
    href: "/practice",
    label: "练习",
    description: "会议模拟",
    icon: Mic2,
  },
  {
    href: "/objection-bank",
    label: "异议库",
    description: "高压问题",
    icon: MessageSquareWarning,
  },
  {
    href: "/phrasebook",
    label: "表达库",
    description: "Rokid 话术",
    icon: BookOpenText,
  },
  {
    href: "/progress",
    label: "进步",
    description: "弱项追踪",
    icon: BarChart3,
  },
  {
    href: "/settings",
    label: "设置",
    description: "隐私与模型",
    icon: Settings,
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="border-b border-[var(--border)] bg-[var(--surface)] md:sticky md:top-0 md:h-dvh md:border-b-0 md:border-r">
      <div className="flex h-full flex-col gap-5 p-4">
        <Link
          href="/dashboard"
          className="rounded-md border border-[var(--border)] bg-[var(--surface-subtle)] p-4 transition hover:border-[var(--primary)]"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[var(--primary)] text-white">
              <ClipboardList className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">
                Rokid Coach
              </p>
              <p className="text-xs text-[var(--muted)]">海外会议口语</p>
            </div>
          </div>
        </Link>

        <nav aria-label="主导航" className="flex gap-2 overflow-x-auto pb-1 md:flex-col md:overflow-visible">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={[
                  "flex min-w-48 items-center gap-3 rounded-md border px-3 py-3 transition md:min-w-0",
                  isActive
                    ? "border-[var(--primary)] bg-[#e7f4f2] text-[var(--primary-strong)]"
                    : "border-transparent text-[var(--muted)] hover:border-[var(--border)] hover:bg-[var(--surface-subtle)] hover:text-[var(--foreground)]",
                ].join(" ")}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{item.label}</span>
                  <span className="block text-xs">{item.description}</span>
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
