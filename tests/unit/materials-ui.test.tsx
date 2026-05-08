import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  MaterialUpload,
  validateMaterialFile,
} from "@/features/materials/material-upload";
import { MaterialList } from "@/features/materials/material-list";

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
            createdAt: new Date().toISOString(),
          },
        ]}
        onDeleteMaterial={onDeleteMaterial}
      />,
    );

    expect(screen.getByText("保密")).toBeInTheDocument();
    expect(screen.getByText("已就绪")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "删除材料 Customer deck" }));
    expect(onDeleteMaterial).toHaveBeenCalledWith("material_123");
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
