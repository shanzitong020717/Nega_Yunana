import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ObjectionBankView } from "@/features/objection-bank/objection-bank-view";

const pushMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

describe("ObjectionBankView practice launch", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    pushMock.mockClear();
  });

  it("creates an objection challenge session and navigates to the practice room", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          practiceSession: {
            id: "session_objection_123",
            mode: "objection_challenge",
            personaId: "skeptical_executive",
            difficulty: "normal",
            trainingFocus: ["objection_handling"],
            sourceObjectionId: "product-value-phone-app",
          },
        }),
        { status: 201 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<ObjectionBankView />);

    fireEvent.click(screen.getAllByRole("button", { name: "开始练习" })[0]);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/practice-sessions",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("product-value-phone-app"),
        }),
      );
      expect(pushMock).toHaveBeenCalledWith("/practice/session_objection_123");
    });
  });
});
