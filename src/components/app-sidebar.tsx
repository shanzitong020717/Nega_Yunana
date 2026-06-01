"use client";

import {
  BarChart3,
  BookOpenText,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
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

  async function handleLogout() {
    await fetch("/api/auth/logout", {
      method: "POST",
    });
    window.location.href = "/login";
  }

  return (
    <aside className="min-w-0 border-b border-[var(--border)] bg-[var(--surface)] lg:sticky lg:top-0 lg:h-dvh lg:border-b-0 lg:border-r">
      <div className="flex h-full min-w-0 flex-col gap-5 p-4">
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

        <nav
          aria-label="主导航"
          className="grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-4 lg:flex lg:flex-col"
        >
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
                  "flex min-w-0 items-center gap-3 rounded-md border px-3 py-3 transition",
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

        <nav aria-label="辅助导航" className="mt-auto flex min-w-0 gap-2 lg:flex-col">
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
          <button
            type="button"
            onClick={handleLogout}
            className="flex min-h-11 items-center gap-3 rounded-md border border-transparent px-3 py-3 text-left text-sm text-[var(--muted)] transition hover:border-[var(--border)] hover:bg-[var(--surface-subtle)] hover:text-[var(--foreground)]"
          >
            <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="font-medium">退出登录</span>
          </button>
        </nav>
      </div>
    </aside>
  );
}
