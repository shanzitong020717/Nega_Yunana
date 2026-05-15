"use client";

import {
  BarChart3,
  BookOpenText,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";

import { defaultScenarioPack } from "@/data/scenario-packs";

type NavItem = {
  href: string;
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
};

const iconByHref: Record<string, ComponentType<{ className?: string }>> = {
  "/dashboard": LayoutDashboard,
  "/materials": FileText,
  "/phrasebook": BookOpenText,
  "/progress": BarChart3,
  "/settings": Settings,
};

const primaryNavItems: NavItem[] = defaultScenarioPack.navigation.primary.map(
  (item) => ({
    ...item,
    description: item.href === "/progress" ? "练习总结" : item.description,
    icon: iconByHref[item.href] ?? LayoutDashboard,
  }),
);

const auxiliaryNavItems: NavItem[] = defaultScenarioPack.navigation.auxiliary
  .filter((item) => item.href === "/settings")
  .map((item) => ({
    ...item,
    icon: iconByHref[item.href] ?? Settings,
  }));

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
          {primaryNavItems.map((item) => {
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

        <nav aria-label="辅助导航" className="mt-auto flex gap-2 md:flex-col">
          {auxiliaryNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={[
                  "flex min-h-11 items-center gap-3 rounded-md border px-3 py-3 text-sm transition",
                  isActive
                    ? "border-[var(--primary)] bg-[#e7f4f2] text-[var(--primary-strong)]"
                    : "border-transparent text-[var(--muted)] hover:border-[var(--border)] hover:bg-[var(--surface-subtle)] hover:text-[var(--foreground)]",
                ].join(" ")}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
