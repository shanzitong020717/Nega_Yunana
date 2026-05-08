import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DashboardView } from "@/features/dashboard/dashboard-view";
import { ObjectionBankView } from "@/features/objection-bank/objection-bank-view";
import { PhrasebookView } from "@/features/phrasebook/phrasebook-view";
import { ProgressView } from "@/features/progress/progress-view";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe("static product views", () => {
  it("renders the dashboard learning loop sections", () => {
    render(<DashboardView />);

    expect(screen.getByText("今日推荐练习")).toBeInTheDocument();
    expect(screen.getByText("客户会议准备")).toBeInTheDocument();
    expect(screen.getByText("最近材料")).toBeInTheDocument();
    expect(screen.getByText("本周重点")).toBeInTheDocument();
    expect(screen.getByText("最近复盘")).toBeInTheDocument();
  });

  it("filters objection cards by category", () => {
    render(<ObjectionBankView />);

    fireEvent.change(screen.getByLabelText("类别"), {
      target: { value: "Privacy & Security" },
    });

    expect(screen.getByText("How is meeting data handled?")).toBeInTheDocument();
    expect(screen.queryByText("Why not just use a phone translation app?")).not.toBeInTheDocument();
  });

  it("filters phrasebook cards by tag and shows a personal empty state", () => {
    render(<PhrasebookView />);

    expect(screen.getByText("还没有收藏个人表达")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("标签"), {
      target: { value: "pilot" },
    });

    expect(screen.getByText("What does a successful pilot look like for your team?")).toBeInTheDocument();
    expect(screen.queryByText("Let me walk you through a simple scenario.")).not.toBeInTheDocument();
  });

  it("renders progress focus areas from mock weakness data", () => {
    render(<ProgressView />);

    expect(screen.getByText("只讲功能")).toBeInTheDocument();
    expect(screen.getAllByText("功能转价值练习").length).toBeGreaterThan(0);
  });
});
