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

    expect(screen.getByText("Today’s recommended drill")).toBeInTheDocument();
    expect(screen.getByText("Prepare for a customer meeting")).toBeInTheDocument();
    expect(screen.getByText("Recent materials")).toBeInTheDocument();
    expect(screen.getByText("This Week's Focus")).toBeInTheDocument();
    expect(screen.getByText("Recent review")).toBeInTheDocument();
  });

  it("filters objection cards by category", () => {
    render(<ObjectionBankView />);

    fireEvent.change(screen.getByLabelText("Category"), {
      target: { value: "Privacy & Security" },
    });

    expect(screen.getByText("How is meeting data handled?")).toBeInTheDocument();
    expect(screen.queryByText("Why not just use a phone translation app?")).not.toBeInTheDocument();
  });

  it("filters phrasebook cards by tag and shows a personal empty state", () => {
    render(<PhrasebookView />);

    expect(screen.getByText("No saved personal phrases yet")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Tag"), {
      target: { value: "pilot" },
    });

    expect(screen.getByText("What does a successful pilot look like for your team?")).toBeInTheDocument();
    expect(screen.queryByText("Let me walk you through a simple scenario.")).not.toBeInTheDocument();
  });

  it("renders progress focus areas from mock weakness data", () => {
    render(<ProgressView />);

    expect(screen.getByText("Feature-only talk")).toBeInTheDocument();
    expect(screen.getAllByText("Feature-to-value conversion drill").length).toBeGreaterThan(0);
  });
});
