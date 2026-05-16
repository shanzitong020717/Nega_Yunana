import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MaterialsView } from "@/features/materials/materials-view";

describe("MaterialsView", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fetches and displays a Material Brief after upload", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            materialId: "material_123",
            status: "processing",
            material: {
              id: "material_123",
              name: "Customer notes",
              originalFileName: "customer-notes.txt",
              fileType: "TXT",
              processingStatus: "processing",
              confidentialMode: true,
              createdAt: new Date().toISOString(),
            },
          }),
          { status: 201 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            materialId: "material_123",
            status: "ready",
            brief: {
              keyMessage: "Generated key message",
              productPoints: ["Real-time translated captions"],
              customerValue: ["Reduce communication friction"],
              likelyQuestions: ["How accurate is translation?"],
              applicationScenarios: ["International sales demos"],
              pros: ["Hands-free captions"],
              cons: ["Requires IT review"],
              competitorDifferences: ["Keeps the seller visually engaged compared with phone apps"],
              productParameters: ["Pilot language pairs and meeting environments should be defined"],
              memoryStatus: "session_only",
              likelyObjections: ["We already use phone apps."],
              riskyClaims: ["Do not invent accuracy numbers."],
              usefulPhrases: ["May I first understand your use case?"],
              glossary: [],
              outline: ["Open with discovery."],
            },
          }),
          { status: 200 },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    render(<MaterialsView />);

    fireEvent.change(screen.getByLabelText("材料文件"), {
      target: {
        files: [
          new File(["Customer notes"], "customer-notes.txt", {
            type: "text/plain",
          }),
        ],
      },
    });
    fireEvent.change(screen.getByLabelText("材料名称"), {
      target: { value: "Customer notes" },
    });
    fireEvent.click(screen.getByRole("button", { name: /上传材料/ }));

    expect(await screen.findByText("Generated key message")).toBeInTheDocument();
    expect(screen.getByText("客户可能追问")).toBeInTheDocument();
    expect(screen.getByText("产品应用场景")).toBeInTheDocument();
    expect(screen.getByText("产品优点")).toBeInTheDocument();
    expect(screen.getByText("适配边界")).toBeInTheDocument();
    expect(screen.getByText("竞品差异")).toBeInTheDocument();
    expect(screen.getByText("产品参数")).toBeInTheDocument();
    expect(screen.getAllByText("仅本次使用").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "生成会议准备卡" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "用这份材料开始练习" })).toBeInTheDocument();
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/materials/material_123/brief",
      );
    });
  });
});
