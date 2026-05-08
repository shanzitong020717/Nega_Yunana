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

    expect(screen.getByLabelText("Material ID")).toBeInTheDocument();
    expect(screen.getByLabelText("Customer type")).toBeInTheDocument();
    expect(screen.getByLabelText("Industry")).toBeInTheDocument();
    expect(screen.getByLabelText("Country or region")).toBeInTheDocument();
    expect(screen.getByLabelText("Meeting goal")).toBeInTheDocument();
    expect(screen.getByLabelText("Known concerns")).toBeInTheDocument();
    expect(screen.getByLabelText("Training focus")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Customer type"), {
      target: { value: "Enterprise buyer" },
    });
    fireEvent.change(screen.getByLabelText("Meeting goal"), {
      target: { value: "Qualify a pilot" },
    });
    fireEvent.change(screen.getByLabelText("Known concerns"), {
      target: { value: "privacy\ntranslation accuracy" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Generate prep card/i }));

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

    expect(screen.getByText("Customer Context")).toBeInTheDocument();
    expect(screen.getByText("Meeting Goal")).toBeInTheDocument();
    expect(screen.getByText("Key Talking Points")).toBeInTheDocument();
    expect(screen.getByText("Discovery Questions")).toBeInTheDocument();
    expect(screen.getByText("Likely Objections")).toBeInTheDocument();
    expect(screen.getByText("Opening Script")).toBeInTheDocument();
    expect(screen.getByText("Must-Use Phrases")).toBeInTheDocument();
    expect(screen.getByText("Do Not Overpromise")).toBeInTheDocument();
  });

  it("creates a practice session and navigates to the room", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          practiceSession: {
            id: "session_123",
            mode: "customer_qa",
            personaId: "technical_lead",
            status: "created",
          },
        }),
        { status: 201 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<PracticeSetup prepCards={[prepCard]} />);

    expect(screen.getByLabelText("Mode")).toBeInTheDocument();
    expect(screen.getByLabelText("Persona")).toBeInTheDocument();
    expect(screen.getByLabelText("Material ID")).toBeInTheDocument();
    expect(screen.getByLabelText("Prep Card")).toBeInTheDocument();
    expect(screen.getByLabelText("Difficulty")).toBeInTheDocument();
    expect(screen.getByLabelText("Training focus")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Persona"), {
      target: { value: "technical_lead" },
    });
    fireEvent.change(screen.getByLabelText("Training focus"), {
      target: { value: "business value\nprivacy objection" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Start practice/i }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/practice/session_123");
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/practice-sessions",
      expect.objectContaining({
        method: "POST",
      }),
    );
  });
});
