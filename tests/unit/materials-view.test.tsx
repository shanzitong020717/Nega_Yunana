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
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/materials/material_123/brief",
      );
    });
  });
});
