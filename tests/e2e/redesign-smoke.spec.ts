import { expect, test, type Page } from "playwright/test";

const mockMaterialBrief = {
  keyMessage: "Rokid helps multilingual customer meetings run smoothly.",
  productPoints: ["Real-time translated captions"],
  customerValue: ["Reduce communication friction"],
  likelyQuestions: ["How accurate is translation?"],
  applicationScenarios: ["Overseas customer meetings"],
  pros: ["Hands-free captions"],
  cons: ["Needs IT review"],
  competitorDifferences: ["More meeting-focused than phone apps"],
  productParameters: ["Pilot users, meeting environments, and language pairs"],
  memoryStatus: "session_only",
  likelyObjections: ["How is meeting data handled?"],
  riskyClaims: ["Do not invent accuracy percentages."],
  usefulPhrases: ["May I first understand your use case?"],
  glossary: [],
  outline: ["Open with discovery."],
};

async function expectNoHorizontalScroll(page: Page) {
  const hasHorizontalScroll = await page.evaluate(() => {
    const documentElement = document.documentElement;
    const body = document.body;

    return (
      documentElement.scrollWidth > documentElement.clientWidth + 1 ||
      body.scrollWidth > body.clientWidth + 1
    );
  });

  expect(hasHorizontalScroll).toBe(false);
}

test.describe("redesign smoke coverage", () => {
  test("dashboard keeps the daily practice CTA singular and visible", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    await expect(
      page.getByRole("heading", { name: "今日练习", exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /快速训练/ })).toHaveCount(1);
    await expect(page.getByText("今日建议你练")).toBeVisible();
  });

  test("practice wizard exposes three steps and selectable voice packs", async ({
    page,
  }) => {
    await page.goto("/practice");

    await expect(page.getByText("第 1 步 / 共 3 步")).toBeVisible();
    await expect(page.getByRole("heading", { name: "这次想练什么？" })).toBeVisible();
    await expect(page.getByRole("button", { name: /客户问答/ })).toBeVisible();

    await page.getByRole("button", { name: "下一步", exact: true }).click();

    await expect(page.getByText("第 2 步 / 共 3 步")).toBeVisible();
    await expect(page.getByRole("heading", { name: "让 AI 扮演谁？" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "AI Studio 音色" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Kore 坚定专业/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(page.getByRole("button", { name: /Leda 年轻自然/ })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  test("practice session starts mock realtime and expands the transcript module", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "mediaDevices", {
        configurable: true,
        value: {
          getUserMedia: async () => new MediaStream(),
        },
      });
    });
    await page.route("**/api/realtime/session", async (route) => {
      await route.fulfill({
        contentType: "application/json",
        status: 201,
        body: JSON.stringify({
          transport: "webrtc",
          clientSecret: "mock_realtime_client_secret_e2e",
          sessionId: "rt_session_e2e",
          expiresAt: new Date(Date.now() + 600_000).toISOString(),
          model: "gemini-3.1-flash-live-preview",
          instructionsPreview: "Mock realtime instructions",
        }),
      });
    });

    await page.goto("/practice/session_123");

    await expect(page.getByText("材料导航")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "打开提示面板" })).toBeVisible();
    await expect(page.getByRole("button", { name: "换个更自然表达" })).toHaveCount(0);

    await page.getByRole("button", { name: "打开提示面板" }).click();
    await expect(page.getByRole("complementary", { name: "提示" })).toBeVisible();
    await expect(page.getByRole("button", { name: "换个更自然表达" })).toBeVisible();
    await page.getByRole("button", { name: "关闭提示面板" }).click();
    await expect(page.getByRole("button", { name: "换个更自然表达" })).toHaveCount(0);

    await page.getByRole("button", { name: "开始" }).click();

    await expect(page.getByRole("heading", { name: "对话中" })).toBeVisible();

    const transcriptButton = page.getByRole("button", { name: /实时字幕/ });
    await expect(transcriptButton).toHaveAttribute("aria-expanded", "false");
    await transcriptButton.focus();
    await page.keyboard.press("Enter");

    await expect(page.getByRole("heading", { name: "完整字幕" })).toBeVisible();
    await expect(
      page.getByText("What business problem are you trying to solve with smart glasses?"),
    ).toHaveCount(0);
    await expect(page.getByText("你想用智能眼镜解决什么业务问题？")).toHaveCount(0);

    await page.getByRole("button", { name: "打开提示面板" }).click();
    const transcriptBox = await page.locator("#complete-transcript-panel").boundingBox();
    const supportBox = await page.locator("#smart-support-panel").boundingBox();
    expect(transcriptBox).not.toBeNull();
    expect(supportBox).not.toBeNull();

    if (transcriptBox && supportBox) {
      const overlapX = Math.max(
        0,
        Math.min(transcriptBox.x + transcriptBox.width, supportBox.x + supportBox.width) -
          Math.max(transcriptBox.x, supportBox.x),
      );
      const overlapY = Math.max(
        0,
        Math.min(transcriptBox.y + transcriptBox.height, supportBox.y + supportBox.height) -
          Math.max(transcriptBox.y, supportBox.y),
      );

      expect(overlapX * overlapY).toBe(0);
    }
    await page.getByRole("button", { name: "关闭提示面板" }).click();

    const collapseButton = page.getByRole("button", { name: /折叠/ });
    await expect(collapseButton).toHaveAttribute("aria-expanded", "true");
    await collapseButton.click();
    await expect(page.getByRole("heading", { name: "完整字幕" })).toHaveCount(0);
  });

  test("materials exposes the start-practice CTA after a brief is generated", async ({
    page,
  }) => {
    await page.route("**/api/materials", async (route, request) => {
      if (request.method() !== "POST") {
        await route.fallback();
        return;
      }

      await route.fulfill({
        contentType: "application/json",
        status: 201,
        body: JSON.stringify({
          material: {
            id: "material_e2e",
            name: "Rokid demo notes",
            originalFileName: "rokid-demo.txt",
            fileType: "text/plain",
            processingStatus: "ready",
            memoryStatus: "session_only",
            confidentialMode: true,
            createdAt: new Date().toISOString(),
          },
        }),
      });
    });
    await page.route("**/api/materials/material_e2e/brief", async (route) => {
      await route.fulfill({
        contentType: "application/json",
        status: 200,
        body: JSON.stringify({
          status: "ready",
          brief: mockMaterialBrief,
        }),
      });
    });

    await page.goto("/materials");
    await expect(page.getByRole("heading", { name: "客户材料库" })).toBeVisible();

    await page.setInputFiles("#material-file", {
      name: "rokid-demo.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("Rokid supports real-time translated captions."),
    });
    await page.getByLabel("材料名称").fill("Rokid demo notes");
    await page.getByRole("button", { name: /上传材料/ }).click();

    await expect(page.getByRole("button", { name: /用这份材料开始练习/ })).toBeVisible();
  });

  test("phrasebook and progress retain the redesigned primary modules", async ({
    page,
  }) => {
    await page.goto("/phrasebook");
    await expect(page.getByRole("region", { name: "今天建议复习" })).toBeVisible();

    await page.goto("/progress");
    await expect(page.getByRole("heading", { name: "复盘与弱项追踪" })).toBeVisible();
    await expect(page.getByRole("link", { name: "我的记忆" })).toBeVisible();
  });

  for (const viewport of [
    { name: "desktop", width: 1440, height: 1000 },
    { name: "tablet", width: 768, height: 1000 },
    { name: "mobile", width: 390, height: 900 },
  ]) {
    test(`core pages avoid horizontal body scroll on ${viewport.name}`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);

      for (const pathname of [
        "/dashboard",
        "/practice",
        "/practice/session_123",
        "/materials",
        "/phrasebook",
        "/progress",
        "/memory",
      ]) {
        await page.goto(pathname);
        await expectNoHorizontalScroll(page);
      }
    });
  }
});
