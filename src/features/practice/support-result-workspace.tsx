"use client";

import {
  AlertCircle,
  BookOpenCheck,
  ChevronDown,
  ChevronUp,
  FileText,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";

export type SupportResultTabType =
  | "suggested-answer"
  | "better-phrase"
  | "discovery-question"
  | "material-point"
  | "challenge-me";

export type SupportResultTabStatus = "loading" | "ready" | "error";

export type SupportResultTabView = {
  id: string;
  title: string;
  type: SupportResultTabType;
  status: SupportResultTabStatus;
  errorMessage?: string;
};

type SupportResultWorkspaceProps = {
  activeTabId: string | null;
  children: ReactNode;
  onCloseTab: (tabId: string) => void;
  onRetryTab: (tabId: string) => void;
  onSelectTab: (tabId: string) => void;
  tabs: SupportResultTabView[];
};

const tabIcons: Record<SupportResultTabType, LucideIcon> = {
  "suggested-answer": BookOpenCheck,
  "better-phrase": Sparkles,
  "discovery-question": Search,
  "material-point": FileText,
  "challenge-me": Target,
};

const statusLabels: Record<SupportResultTabStatus, string> = {
  loading: "生成中",
  ready: "完成",
  error: "失败",
};

export function SupportResultWorkspace({
  activeTabId,
  children,
  onCloseTab,
  onRetryTab,
  onSelectTab,
  tabs,
}: SupportResultWorkspaceProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (tabs.length === 0) {
    return null;
  }

  const activeTab =
    tabs.find((tab) => tab.id === activeTabId) ?? tabs[tabs.length - 1];
  const isActiveTabRefreshing = activeTab?.status === "loading";

  return (
    <section
      aria-label="辅助结果工作区"
      className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[var(--foreground)]">
            辅助结果工作区
          </h2>
          <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
            左右滑动标签切换分析结果。
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {activeTab ? (
            <button
              type="button"
              aria-label="刷新当前模块"
              disabled={isActiveTabRefreshing}
              onClick={() => onRetryTab(activeTab.id)}
              className={[
                "inline-flex min-h-9 items-center gap-2 rounded-md border px-3 text-xs font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]",
                activeTab.status === "error"
                  ? "border-[#f4d39a] bg-[#fff8ed] text-[#8a5a05] hover:border-[var(--warning)]"
                  : "border-[#b7d8d6] bg-[#e7f4f2] text-[var(--primary-strong)] hover:border-[var(--primary)] hover:bg-[#d9eeeb]",
                isActiveTabRefreshing ? "cursor-not-allowed opacity-70" : "",
              ].join(" ")}
            >
              <RefreshCw
                className={[
                  "h-3.5 w-3.5",
                  isActiveTabRefreshing ? "animate-spin" : "",
                ].join(" ")}
                aria-hidden="true"
              />
              刷新当前模块
            </button>
          ) : null}
          <button
            type="button"
            aria-expanded={!isCollapsed}
            aria-label={
              isCollapsed ? "展开辅助结果工作区" : "折叠辅助结果工作区"
            }
            onClick={() => setIsCollapsed((current) => !current)}
            className="inline-flex min-h-9 items-center gap-2 rounded-md border border-[var(--border)] bg-white px-3 text-xs font-medium text-[var(--foreground)] transition hover:border-[var(--primary)] hover:bg-[#f6fbfa] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
          >
            {isCollapsed ? (
              <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {isCollapsed ? "展开" : "折叠"}
          </button>
        </div>
      </div>

      {!isCollapsed ? (
        <>
          <div
            role="tablist"
            aria-label="辅助结果模块"
            className="mt-4 flex gap-2 overflow-x-auto pb-1"
          >
            {tabs.map((tab) => {
              const Icon = tabIcons[tab.type];
              const isActive = tab.id === activeTab?.id;
              const statusIcon =
                tab.status === "loading" ? (
                  <Loader2
                    className="h-3.5 w-3.5 animate-spin"
                    aria-hidden="true"
                  />
                ) : tab.status === "error" ? (
                  <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                ) : null;

              return (
                <div
                  key={tab.id}
                  className={[
                    "inline-flex shrink-0 items-center rounded-md border bg-white",
                    isActive
                      ? "border-[var(--primary)] bg-[#f6fbfa] text-[var(--primary-strong)]"
                      : "border-[var(--border)] text-[var(--foreground)]",
                  ].join(" ")}
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => onSelectTab(tab.id)}
                    className="inline-flex min-h-10 items-center gap-2 px-3 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    <span>{tab.title}</span>
                    {statusIcon}
                    <span className="sr-only">
                      {statusLabels[tab.status]}
                    </span>
                  </button>
                  <button
                    type="button"
                    aria-label={`关闭${tab.title}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      onCloseTab(tab.id);
                    }}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--muted)] transition hover:bg-[var(--surface-subtle)] hover:text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              );
            })}
          </div>

          <div
            role="tabpanel"
            aria-label={activeTab ? activeTab.title : undefined}
            className="mt-4"
          >
            {children}
          </div>
        </>
      ) : null}
    </section>
  );
}
