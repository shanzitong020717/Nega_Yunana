import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  MaterialUpload,
  validateMaterialFile,
} from "@/features/materials/material-upload";
import { MaterialList } from "@/features/materials/material-list";
import { MaterialBriefView } from "@/features/materials/material-brief-view";

describe("MaterialUpload", () => {
  it("renders the required upload fields and privacy warning", () => {
    render(<MaterialUpload onUploaded={vi.fn()} />);

    expect(screen.getByLabelText("材料文件")).toBeInTheDocument();
    expect(screen.getByLabelText("材料名称")).toBeInTheDocument();
    expect(screen.getByLabelText("客户类型")).toBeInTheDocument();
    expect(screen.getByLabelText("客户行业")).toBeInTheDocument();
    expect(screen.getByLabelText("会议目标")).toBeInTheDocument();
    expect(screen.getByLabelText("保密模式")).toBeChecked();
    expect(screen.getByLabelText("备注")).toBeInTheDocument();
    expect(screen.getByText("上传前隐私提醒")).toBeInTheDocument();
    expect(
      screen.getByText("Confidential by default"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("默认开启保密模式"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("PDF, PPTX, DOCX, TXT, Markdown"),
    ).toBeInTheDocument();
  });

  it("shows confidential status for customer materials", () => {
    const onDeleteMaterial = vi.fn();
    const onMemoryStatusChange = vi.fn();
    render(
      <MaterialList
        materials={[
          {
            id: "material_123",
            name: "Customer deck",
            originalFileName: "customer-deck.pdf",
            fileType: "PDF",
            processingStatus: "ready",
            confidentialMode: true,
            memoryStatus: "confidential",
            createdAt: new Date().toISOString(),
          },
        ]}
        onDeleteMaterial={onDeleteMaterial}
        onMemoryStatusChange={onMemoryStatusChange}
      />,
    );

    expect(screen.getAllByText("保密材料").length).toBeGreaterThan(0);
    expect(screen.getByText("已就绪")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Customer deck 记忆状态"), {
      target: { value: "available_for_future" },
    });
    expect(onMemoryStatusChange).toHaveBeenCalledWith(
      "material_123",
      "available_for_future",
    );
    fireEvent.click(screen.getByRole("button", { name: "删除材料 Customer deck" }));
    expect(onDeleteMaterial).toHaveBeenCalledWith("material_123");
  });

  it("renders material prep sections and actions", () => {
    render(
      <MaterialBriefView
        selectedMaterialId="material_123"
        brief={{
          keyMessage: "Rokid helps multilingual meetings move faster.",
          productPoints: ["Real-time translated captions"],
          customerValue: ["Reduce communication friction"],
          likelyQuestions: ["How accurate is it?"],
          applicationScenarios: ["Overseas customer demo"],
          pros: ["Hands-free experience"],
          cons: ["Needs IT review"],
          competitorDifferences: ["More meeting-focused than phone apps"],
          productParameters: ["Define pilot users and language pairs"],
          memoryStatus: "available_for_future",
          likelyObjections: ["We already use phone apps."],
          riskyClaims: ["Do not invent accuracy numbers."],
          usefulPhrases: ["May I first understand your use case?"],
          glossary: [],
          outline: ["Open with discovery."],
        }}
        status="ready"
        onCreatePrepCard={vi.fn()}
        onStartPractice={vi.fn()}
      />,
    );

    [
      "材料摘要",
      "客户可能追问",
      "产品应用场景",
      "产品优点",
      "适配边界",
      "竞品差异",
      "产品参数",
      "可用于后续练习",
    ].forEach((text) => {
      expect(screen.getByText(text)).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "生成会议准备卡" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "用这份材料开始练习" })).toBeInTheDocument();
  });

  it("shows a client-side error for unsupported file types", () => {
    render(<MaterialUpload onUploaded={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("材料文件"), {
      target: {
        files: [
          new File(["video"], "demo.mp4", {
            type: "video/mp4",
          }),
        ],
      },
    });

    expect(
      screen.getByText("不支持该文件类型。请上传 PDF、PPTX、DOCX、TXT 或 Markdown。"),
    ).toBeInTheDocument();
  });

  it("validates material file size before upload", () => {
    expect(
      validateMaterialFile({
        name: "large-deck.pdf",
        size: 26 * 1024 * 1024,
        type: "application/pdf",
      }),
    ).toEqual({
      ok: false,
      message: "文件过大。请将上传文件控制在 25 MB 以内。",
    });
  });
});
