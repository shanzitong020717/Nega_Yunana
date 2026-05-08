import { expect, test } from "playwright/test";

test.describe("product smoke flows", () => {
  test("dashboard loads", async ({ page }) => {
    await page.goto("/dashboard");

    await expect(page.getByRole("heading", { name: "Meeting training workspace" })).toBeVisible();
    await expect(page.getByText("Today’s recommended drill")).toBeVisible();
  });

  test("materials page opens", async ({ page }) => {
    await page.goto("/materials");

    await expect(page.getByRole("heading", { name: "Customer material library" })).toBeVisible();
    await expect(page.getByText("Privacy warning before upload")).toBeVisible();
    await expect(page.getByLabel("Confidential mode")).toBeChecked();
  });

  test("practice setup opens", async ({ page }) => {
    await page.goto("/practice");

    await expect(page.getByRole("heading", { name: "Meeting simulator setup" })).toBeVisible();
    await expect(page.getByLabel("Mode")).toBeVisible();
    await expect(page.getByRole("button", { name: "Start practice" })).toBeVisible();
  });

  test("objection bank filters", async ({ page }) => {
    await page.goto("/objection-bank");

    await expect(page.getByRole("heading", { name: "Rokid sales objection practice" })).toBeVisible();
    await page.getByLabel("Category").selectOption("Privacy & Security");

    await expect(page.locator("article").filter({ hasText: "How is meeting data handled?" })).toBeVisible();
    await expect(page.locator("article").filter({ hasText: "Why not just use a phone translation app?" })).toHaveCount(0);
  });

  test("phrasebook filters", async ({ page }) => {
    await page.goto("/phrasebook");

    await expect(page.getByRole("heading", { name: "Rokid product expression library" })).toBeVisible();
    await page.getByLabel("Tag").selectOption("pilot");

    await expect(page.locator("article").filter({ hasText: "What does a successful pilot look like for your team?" })).toBeVisible();
    await expect(page.locator("article").filter({ hasText: "Let me walk you through a simple scenario." })).toHaveCount(0);
  });
});
