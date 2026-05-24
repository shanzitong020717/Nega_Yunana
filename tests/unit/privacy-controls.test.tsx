import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ReviewView } from "@/features/reviews/review-view";
import { PrivacySettings } from "@/features/settings/privacy-settings";
import type { PracticeReviewPayload } from "@/lib/validation/reviews";

const review: PracticeReviewPayload = {
  meetingOutcome: {
    summary: "The customer understood the value.",
    customerReaction: "Interested.",
    nextStep: "Book a pilot discussion.",
  },
  scores: {
    clarity: { score: 4, rationale: "Clear." },
    businessConfidence: { score: 4, rationale: "Confident." },
    discoverySkill: { score: 3, rationale: "Some discovery." },
    productPositioning: { score: 4, rationale: "Good positioning." },
    objectionHandling: { score: 3, rationale: "Safe answer." },
    englishNaturalness: { score: 3, rationale: "Understandable." },
  },
  topImprovements: ["Ask one more discovery question."],
  bestMoments: ["Kept the answer safe."],
  sentenceReviews: [],
  sentenceUpgrades: [],
  materialCoverage: {
    covered: ["Real-time translated captions"],
    missed: [],
    unclear: [],
  },
  phrasebookSuggestions: [],
  weaknessUpdates: [],
  memoryCandidates: [],
  nextSessionRecommendation: {
    focus: "privacy",
    drill: "Technical buyer Q&A.",
    prompt: "Explain data handling safely.",
  },
};

describe("privacy deletion controls", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("deletes records from the settings privacy panel", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ deleted: true }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<PrivacySettings />);

    fireEvent.change(screen.getByLabelText("材料 ID"), {
      target: { value: "material_123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "删除材料" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/materials/material_123",
        expect.objectContaining({ method: "DELETE" }),
      );
    });
    expect(await screen.findByText("材料已删除。")).toBeInTheDocument();
  });

  it("deletes the current review from the review page controls", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ deleted: true, reviewDeleted: true }), {
        status: 200,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<ReviewView reviewId="review_123" sessionId="session_123" review={review} />);

    fireEvent.click(screen.getByRole("button", { name: "删除本次复盘" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/practice-sessions/session_123/review",
        expect.objectContaining({ method: "DELETE" }),
      );
    });
    expect(await screen.findByText("复盘已删除。")).toBeInTheDocument();
  });
});
