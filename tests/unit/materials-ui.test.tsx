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

    expect(screen.getByLabelText("Material file")).toBeInTheDocument();
    expect(screen.getByLabelText("Material name")).toBeInTheDocument();
    expect(screen.getByLabelText("Customer type")).toBeInTheDocument();
    expect(screen.getByLabelText("Customer industry")).toBeInTheDocument();
    expect(screen.getByLabelText("Meeting goal")).toBeInTheDocument();
    expect(screen.getByLabelText("Confidential mode")).toBeChecked();
    expect(screen.getByLabelText("Notes")).toBeInTheDocument();
    expect(
      screen.getByText("Privacy warning before upload"),
    ).toBeInTheDocument();
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

    expect(screen.getByText("Confidential")).toBeInTheDocument();
    expect(screen.getByText("ready")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Delete material Customer deck" }));
    expect(onDeleteMaterial).toHaveBeenCalledWith("material_123");
  });

  it("shows a client-side error for unsupported file types", () => {
    render(<MaterialUpload onUploaded={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("Material file"), {
      target: {
        files: [
          new File(["video"], "demo.mp4", {
            type: "video/mp4",
          }),
        ],
      },
    });

    expect(
      screen.getByText("Unsupported file type. Upload PDF, PPTX, DOCX, TXT, or Markdown."),
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
      message: "File is too large. Keep uploads under 25 MB.",
    });
  });
});
