import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PrepCardForm } from "@/features/practice/prep-card-form";
import { PrepCardView } from "@/features/practice/prep-card-view";
import { PracticeSetup } from "@/features/practice/practice-setup";

const pushMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

const prepCard = {
  id: "prep_123",
  materialId: "material_123",
  customerType: "Enterprise buyer",
  industry: "Healthcare",
  countryOrRegion: "Singapore",
  meetingGoal: "Qualify a pilot",
  knownConcerns: ["privacy"],
  trainingFocus: ["business value"],
  customerContext: "Enterprise buyer in Singapore.",
  keyTalkingPoints: ["Connect translation to business value."],
  discoveryQuestions: ["What does a successful pilot look like?"],
  likelyObjections: ["How is meeting data handled?"],
  openingScript: "Before we jump into the product, may I first understand your use case?",
  mustUsePhrases: ["The key value is reducing communication friction in real time."],
  doNotOverpromise: ["Do not invent accuracy percentages."],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe("prep card views", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    pushMock.mockClear();
  });

  it("renders the prep card form fields and submits to the API", async () => {
    const onCreated = vi.fn();
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ prepCard }), {
        status: 201,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<PrepCardForm onCreated={onCreated} />);

    expect(screen.getByLabelText("材料 ID")).toBeInTheDocument();
    expect(screen.getByLabelText("客户类型")).toBeInTheDocument();
    expect(screen.getByLabelText("行业")).toBeInTheDocument();
    expect(screen.getByLabelText("国家或地区")).toBeInTheDocument();
    expect(screen.getByLabelText("会议目标")).toBeInTheDocument();
    expect(screen.getByLabelText("已知顾虑")).toBeInTheDocument();
    expect(screen.getByLabelText("训练重点")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("客户类型"), {
      target: { value: "Enterprise buyer" },
    });
    fireEvent.change(screen.getByLabelText("会议目标"), {
      target: { value: "Qualify a pilot" },
    });
    fireEvent.change(screen.getByLabelText("已知顾虑"), {
      target: { value: "privacy\ntranslation accuracy" },
    });
    fireEvent.click(screen.getByRole("button", { name: /生成准备卡/ }));

    await waitFor(() => {
      expect(onCreated).toHaveBeenCalledWith(prepCard);
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/prep-cards",
      expect.objectContaining({
        method: "POST",
      }),
    );
  });

  it("renders all prep card learning sections", () => {
    render(<PrepCardView prepCard={prepCard} />);

    expect(screen.getByText("客户背景")).toBeInTheDocument();
    expect(screen.getByText("会议目标")).toBeInTheDocument();
    expect(screen.getByText("关键话术点")).toBeInTheDocument();
    expect(screen.getByText("探索式问题")).toBeInTheDocument();
    expect(screen.getByText("可能异议")).toBeInTheDocument();
    expect(screen.getByText("开场脚本")).toBeInTheDocument();
    expect(screen.getByText("必用表达")).toBeInTheDocument();
    expect(screen.getByText("避免过度承诺")).toBeInTheDocument();
  });

  it("creates a practice session and navigates to the room", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          practiceSession: {
            id: "session_123",
            goalId: "customer_qa",
            personaId: "technical_lead",
            voicePackId: "kore-firm",
            status: "created",
          },
        }),
        { status: 201 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<PracticeSetup prepCards={[prepCard]} />);

    expect(screen.getByRole("heading", { name: "这次想练什么？" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /客户问答/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "下一步" }));
    expect(screen.getByRole("heading", { name: "让 AI 扮演谁？" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^技术负责人/ }));

    fireEvent.click(screen.getByRole("button", { name: "下一步" }));
    expect(screen.getByRole("heading", { name: "要使用什么材料或记忆？" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /产品参数解释/ }));
    fireEvent.click(screen.getByRole("button", { name: /开始练习/ }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/practice/session_123");
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/practice-sessions",
      expect.objectContaining({
        method: "POST",
      }),
    );
    const [, requestInit] = fetchMock.mock.calls[0];
    expect(JSON.parse(String(requestInit.body))).toMatchObject({
      goalId: "customer_qa",
      personaId: "technical_lead",
      voicePackId: "kore-firm",
      materialId: "material_123",
      focusTags: expect.arrayContaining(["产品参数解释"]),
    });
  });
});
