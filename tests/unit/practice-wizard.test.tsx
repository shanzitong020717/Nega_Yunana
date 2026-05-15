import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PracticeWizard } from "@/features/practice/practice-wizard";

const pushMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

describe("PracticeWizard", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    pushMock.mockClear();
  });

  it("shows the five practice goals in the first step", () => {
    render(<PracticeWizard />);

    expect(screen.getByRole("heading", { name: "这次想练什么？" })).toBeInTheDocument();
    ["客户问答", "演示讲解", "异议处理", "方案会议", "60 秒快速表达"].forEach(
      (goal) => {
        expect(screen.getByRole("button", { name: new RegExp(goal) })).toBeInTheDocument();
      },
    );
  });

  it("shows customer roles and selectable voice packs in the second step", () => {
    render(<PracticeWizard />);

    fireEvent.click(screen.getByRole("button", { name: "下一步" }));

    expect(screen.getByRole("heading", { name: "让 AI 扮演谁？" })).toBeInTheDocument();
    ["企业买家", "技术负责人", "采购经理", "渠道合作伙伴", "高管决策者"].forEach(
      (persona) => {
        expect(screen.getByRole("button", { name: new RegExp(`^${persona}`) })).toBeInTheDocument();
      },
    );
    ["Ava 友好买家", "Serena 企业决策者", "Ethan 技术负责人", "Marcus 高管客户", "Vivian 挑剔采购", "Noah 渠道伙伴"].forEach(
      (voicePack) => {
        expect(screen.getByRole("button", { name: new RegExp(voicePack) })).toBeInTheDocument();
      },
    );

    fireEvent.click(screen.getByRole("button", { name: /Vivian 挑剔采购/ }));
    expect(screen.getByText("犀利干练，追问强")).toBeInTheDocument();
  });

  it("shows material choices and product-focused tags in the third step", () => {
    render(<PracticeWizard />);

    fireEvent.click(screen.getByRole("button", { name: "下一步" }));
    fireEvent.click(screen.getByRole("button", { name: "下一步" }));

    expect(screen.getByRole("heading", { name: "要使用什么材料或记忆？" })).toBeInTheDocument();
    ["最近客户材料", "不使用材料", "使用系统记忆"].forEach((materialChoice) => {
      expect(screen.getByRole("button", { name: new RegExp(materialChoice) })).toBeInTheDocument();
    });
    ["应用场景说明", "优缺点对比", "竞品差异", "产品参数解释"].forEach((focusTag) => {
      expect(screen.getByRole("button", { name: new RegExp(focusTag) })).toBeInTheDocument();
    });
  });

  it("creates a session payload with goal, persona, voice pack, focus tags, and material", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          practiceSession: {
            id: "session_123",
            goalId: "customer_qa",
            personaId: "technical_lead",
            voicePackId: "vivian-critical-procurement",
            materialId: "recent_material",
            status: "created",
          },
        }),
        { status: 201 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<PracticeWizard />);

    fireEvent.click(screen.getByRole("button", { name: "下一步" }));
    fireEvent.click(screen.getByRole("button", { name: /^技术负责人/ }));
    fireEvent.click(screen.getByRole("button", { name: /Vivian 挑剔采购/ }));
    fireEvent.click(screen.getByRole("button", { name: "下一步" }));
    fireEvent.click(screen.getByRole("button", { name: /应用场景说明/ }));
    fireEvent.click(screen.getByRole("button", { name: /产品参数解释/ }));
    fireEvent.click(screen.getByRole("button", { name: /开始练习/ }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/practice-sessions",
        expect.objectContaining({
          method: "POST",
        }),
      );
    });

    const [, requestInit] = fetchMock.mock.calls[0];
    expect(JSON.parse(String(requestInit.body))).toMatchObject({
      scenarioPackId: "rokid-overseas-sales",
      goalId: "customer_qa",
      personaId: "technical_lead",
      voicePackId: "vivian-critical-procurement",
      materialId: "recent_material",
      focusTags: expect.arrayContaining(["应用场景说明", "产品参数解释"]),
    });
    expect(pushMock).toHaveBeenCalledWith("/practice/session_123");
  });
});
