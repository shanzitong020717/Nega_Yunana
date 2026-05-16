import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AppSidebar } from "@/components/app-sidebar";
import { DashboardView } from "@/features/dashboard/dashboard-view";
import { ObjectionBankView } from "@/features/objection-bank/objection-bank-view";
import { PhrasebookView } from "@/features/phrasebook/phrasebook-view";
import { ProgressView } from "@/features/progress/progress-view";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe("static product views", () => {
  it("renders the redesigned primary navigation", () => {
    render(<AppSidebar />);

    const primaryNav = screen.getByRole("navigation", { name: "主导航" });
    const primaryLinks = within(primaryNav).getAllByRole("link");

    expect(primaryLinks.map((link) => link.textContent)).toEqual([
      "今日练习今天该练什么",
      "客户材料材料与准备卡",
      "表达库每日复习",
      "复盘练习总结",
    ]);
    expect(within(primaryNav).queryByText("进步")).not.toBeInTheDocument();
    expect(within(primaryNav).queryByText("异议库")).not.toBeInTheDocument();
  });

  it("renders the redesigned today practice dashboard", () => {
    render(<DashboardView />);

    expect(
      screen.getByRole("heading", { name: "今日练习" }),
    ).toBeInTheDocument();
    expect(screen.getByText("今日建议你练")).toBeInTheDocument();
    expect(screen.getByText("技术负责人 · 隐私与部署异议")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /开始今日练习/ })).toHaveAttribute(
      "href",
      "/practice",
    );
    expect(screen.getAllByRole("link", { name: /开始今日练习/ })).toHaveLength(1);
    expect(screen.getByRole("link", { name: /上传客户材料/ })).toHaveAttribute(
      "href",
      "/materials",
    );
    expect(screen.getByRole("link", { name: /练一个常见异议/ })).toHaveAttribute(
      "href",
      "/objection-bank",
    );
    expect(screen.getByRole("link", { name: /复习 5 句表达/ })).toHaveAttribute(
      "href",
      "/phrasebook",
    );
    expect(screen.getByText("最近材料")).toBeInTheDocument();
    expect(screen.getByText("本周重点")).toBeInTheDocument();
    expect(screen.getByText("最近复盘")).toBeInTheDocument();
    expect(screen.queryByText("会议训练工作台")).not.toBeInTheDocument();
  });

  it("filters objection cards by category", () => {
    render(<ObjectionBankView />);

    fireEvent.change(screen.getByLabelText("类别"), {
      target: { value: "Privacy & Security" },
    });

    expect(screen.getByText("How is meeting data handled?")).toBeInTheDocument();
    expect(screen.queryByText("Why not just use a phone translation app?")).not.toBeInTheDocument();
  });

  it("renders the phrasebook as a daily practice tool", () => {
    render(<PhrasebookView />);

    expect(screen.getByRole("heading", { name: "表达库" })).toBeInTheDocument();

    const dailyPractice = screen.getByRole("region", { name: "今天建议复习" });
    expect(within(dailyPractice).getAllByRole("article")).toHaveLength(5);
    expect(within(dailyPractice).getAllByRole("button", { name: "练这句" })).toHaveLength(5);

    [
      "产品应用场景",
      "产品优点与缺点",
      "竞品差异与替代方案对比",
      "产品详细参数",
    ].forEach((category) => {
      expect(screen.getByRole("option", { name: category })).toBeInTheDocument();
    });

    [
      "最近复盘保存",
      "Rokid 高频产品表达",
      "异议回答表达",
      "我的个人表达",
      "材料专属表达",
    ].forEach((section) => {
      expect(screen.getByRole("heading", { name: section })).toBeInTheDocument();
    });
  });

  it("keeps phrasebook filters available without taking over the page", () => {
    render(<PhrasebookView />);

    fireEvent.change(screen.getByLabelText("标签"), {
      target: { value: "pilot" },
    });

    const phraseSearch = screen.getByRole("region", { name: "全部表达检索" });
    expect(
      within(phraseSearch).getByText(
        "What does a successful pilot look like for your team?",
      ),
    ).toBeInTheDocument();
    expect(
      within(phraseSearch).queryByText("Let me walk you through a simple scenario."),
    ).not.toBeInTheDocument();
  });

  it("renders progress focus areas from mock weakness data", () => {
    render(<ProgressView />);

    expect(screen.getByText("复盘")).toBeInTheDocument();
    expect(screen.queryByText("进步")).not.toBeInTheDocument();
    expect(screen.getByText("只讲功能")).toBeInTheDocument();
    expect(screen.getAllByText("功能转价值练习").length).toBeGreaterThan(0);
  });
});
