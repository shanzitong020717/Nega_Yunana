import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PracticeView } from "@/features/practice/practice-view";
import { PracticeWizard } from "@/features/practice/practice-wizard";
import { readPracticeSessionSelection } from "@/lib/practice/practice-session-selection";

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
    window.sessionStorage.clear();
  });

  it("shows ten configured practice scenarios in the first step", () => {
    render(<PracticeWizard />);

    expect(screen.getByRole("heading", { name: "这次想练什么？" })).toBeInTheDocument();
    [
      "客户问答",
      "产品演示讲解",
      "应用场景说明",
      "优缺点对比",
      "竞品差异说明",
      "产品参数解释",
      "隐私安全沟通",
      "部署与集成沟通",
      "方案会议推进",
      "60 秒快速表达",
    ].forEach((goal) => {
      expect(screen.getByRole("button", { name: new RegExp(goal) })).toBeInTheDocument();
    });
  });

  it("shows customer roles and selectable voice packs in the second step", () => {
    render(<PracticeWizard />);

    fireEvent.click(screen.getByRole("button", { name: /产品参数解释/ }));
    fireEvent.click(screen.getByRole("button", { name: "下一步" }));

    expect(screen.getByRole("heading", { name: "让 AI 扮演谁？" })).toBeInTheDocument();
    ["企业买家", "技术负责人", "采购经理", "渠道合作伙伴", "高管决策者"].forEach(
      (persona) => {
        expect(screen.getByRole("button", { name: new RegExp(`^${persona}`) })).toBeInTheDocument();
      },
    );
    ["Kore 坚定专业", "Zephyr 明亮友好", "Puck 轻快外向", "Charon 清晰信息型", "Fenrir 高能追问", "Leda 年轻自然"].forEach(
      (voicePack) => {
        expect(screen.getByRole("button", { name: new RegExp(voicePack) })).toBeInTheDocument();
      },
    );

    expect(screen.getByRole("button", { name: /Charon 清晰信息型/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    fireEvent.click(screen.getByRole("button", { name: /Leda 年轻自然/ }));
    expect(screen.getByText("Gemini voice_name: Leda")).toBeInTheDocument();
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

  it("preselects the daily recommendation while walking through every step", () => {
    render(
      <PracticeWizard
        initialSelection={{
          goalId: "competitive_differences",
          personaId: "procurement_manager",
          voicePackId: "fenrir-excitable",
          materialMode: "memory_context",
        }}
      />,
    );

    expect(screen.getByRole("heading", { name: "这次想练什么？" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /竞品差异说明/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    fireEvent.click(screen.getByRole("button", { name: "下一步" }));
    expect(screen.getByRole("heading", { name: "让 AI 扮演谁？" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^采购经理/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: /Fenrir 高能追问/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    fireEvent.click(screen.getByRole("button", { name: "下一步" }));
    expect(screen.getByRole("heading", { name: "要使用什么材料或记忆？" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /使用系统记忆/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: /竞品差异/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("keeps the quick practice recommendation on the first step when opened from the dashboard", () => {
    render(
      <PracticeView
        searchParams={{
          source: "today-recommendation",
          goalId: "application_scenarios",
          personaId: "enterprise_buyer",
          voicePackId: "kore-firm",
          materialMode: "memory_context",
        }}
      />,
    );

    expect(screen.getByRole("heading", { name: "这次想练什么？" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /应用场景说明/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("creates a session payload with goal, persona, voice pack, focus tags, and material", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          practiceSession: {
            id: "session_123",
            goalId: "product_parameters",
            personaId: "technical_lead",
            voicePackId: "leda-youthful",
            materialMode: "memory_context",
            resolvedContext: {
              persona: {
                id: "technical_lead",
                label: "技术负责人",
              },
              voicePack: {
                id: "leda-youthful",
                providerVoiceName: "Leda",
              },
              memorySnippets: [
                "Feature-first answering pattern: The learner often starts with functions.",
              ],
            },
            status: "created",
          },
        }),
        { status: 201 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<PracticeWizard />);

    fireEvent.click(screen.getByRole("button", { name: /产品参数解释/ }));
    fireEvent.click(screen.getByRole("button", { name: "下一步" }));
    fireEvent.click(screen.getByRole("button", { name: /^技术负责人/ }));
    fireEvent.click(screen.getByRole("button", { name: /Leda 年轻自然/ }));
    fireEvent.click(screen.getByRole("button", { name: "下一步" }));
    fireEvent.click(screen.getByRole("button", { name: /使用系统记忆/ }));
    fireEvent.click(screen.getByRole("button", { name: /应用场景说明/ }));
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
      goalId: "product_parameters",
      mode: "customer_qa",
      personaId: "technical_lead",
      voicePackId: "leda-youthful",
      materialMode: "memory_context",
      focusTags: expect.arrayContaining(["产品参数解释"]),
    });
    expect(JSON.parse(String(requestInit.body))).not.toHaveProperty(
      "materialId",
      "memory_context",
    );
    expect(pushMock).toHaveBeenCalledWith("/practice/session_123");
    expect(readPracticeSessionSelection("session_123")).toMatchObject({
      id: "session_123",
      personaId: "technical_lead",
      voicePackId: "leda-youthful",
      materialMode: "memory_context",
      resolvedContext: expect.objectContaining({
        voicePack: expect.objectContaining({
          providerVoiceName: "Leda",
        }),
      }),
    });
  });
});
