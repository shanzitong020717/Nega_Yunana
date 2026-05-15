import { expect, test } from "playwright/test";

test.describe("product smoke flows", () => {
  test("dashboard loads", async ({ page }) => {
    await page.goto("/dashboard");

    await expect(page.getByRole("heading", { name: "今日练习" })).toBeVisible();
    await expect(page.getByText("今日建议你练")).toBeVisible();
    await expect(page.getByRole("link", { name: /开始今日练习/ })).toBeVisible();
  });

  test("materials page opens", async ({ page }) => {
    await page.goto("/materials");

    await expect(page.getByRole("heading", { name: "客户材料库" })).toBeVisible();
    await expect(page.getByText("上传前隐私提醒")).toBeVisible();
    await expect(page.getByLabel("保密模式")).toBeChecked();
  });

  test("practice setup opens", async ({ page }) => {
    await page.goto("/practice");

    await expect(page.getByRole("heading", { name: "创建一次练习" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "这次想练什么？" })).toBeVisible();
    await expect(page.getByRole("button", { name: /客户问答/ })).toBeVisible();
    await expect(page.getByRole("button", { name: "下一步", exact: true })).toBeVisible();
  });

  test("objection bank filters", async ({ page }) => {
    await page.goto("/objection-bank");

    await expect(page.getByRole("heading", { name: "Rokid 销售异议练习" })).toBeVisible();
    await page.getByLabel("类别").selectOption("Privacy & Security");

    await expect(page.locator("article").filter({ hasText: "How is meeting data handled?" })).toBeVisible();
    await expect(page.locator("article").filter({ hasText: "Why not just use a phone translation app?" })).toHaveCount(0);
  });

  test("phrasebook filters", async ({ page }) => {
    await page.goto("/phrasebook");

    await expect(page.getByRole("heading", { name: "Rokid 产品表达库" })).toBeVisible();
    await page.getByLabel("标签").selectOption("pilot");

    await expect(page.locator("article").filter({ hasText: "What does a successful pilot look like for your team?" })).toBeVisible();
    await expect(page.locator("article").filter({ hasText: "Let me walk you through a simple scenario." })).toHaveCount(0);
  });

  test("review hub opens", async ({ page }) => {
    await page.goto("/progress");

    await expect(page.getByRole("heading", { name: "复盘与弱项追踪" })).toBeVisible();
    await expect(page.getByText("我的记忆")).toBeVisible();
  });
});
