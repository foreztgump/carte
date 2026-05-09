import { expect, type Page } from "@playwright/test";

export interface AiLaunchFlow {
  readonly actor: string;
  readonly after: string;
  readonly before: string;
  readonly flow: string;
  readonly label: string;
  readonly timestamp: string;
}

export const launchFixture = async (page: Page, flow: AiLaunchFlow): Promise<void> => {
  const fixtureUrl = new URL("./fixture/index.html", import.meta.url);
  fixtureUrl.searchParams.set("flow", flow.flow);
  await page.goto(fixtureUrl.toString());
};

export const verifyAiWriteWithUndo = async (page: Page, flow: AiLaunchFlow): Promise<void> => {
  await expect(page.getByTestId("content-value")).toHaveText(flow.before);

  await page.getByRole("button", { name: `Ask AI to ${flow.label}` }).click();
  await expect(page.getByRole("dialog", { name: "AI confirms the diff" })).toBeVisible();
  await expect(page.getByTestId("diff-before")).toHaveText(flow.before);
  await expect(page.getByTestId("diff-after")).toHaveText(flow.after);

  await page.getByRole("button", { name: "Accept AI change" }).click();
  await expect(page.getByTestId("content-value")).toHaveText(flow.after);

  const auditLog = page.getByTestId("audit-log-entry");
  await expect(auditLog.getByTestId("audit-actor")).toHaveText(flow.actor);
  await expect(auditLog.getByTestId("audit-timestamp")).toHaveText(flow.timestamp);
  await expect(auditLog.getByTestId("audit-before")).toHaveText(flow.before);
  await expect(auditLog.getByTestId("audit-after")).toHaveText(flow.after);

  const undoToken = page.getByTestId("undo-token");
  await expect(undoToken).toContainText("undoToken:");
  await expect(page.getByTestId("undo-token-ttl")).toHaveText("600 seconds");

  await page.getByRole("button", { name: "Redeem undo token within 10 minutes" }).click();
  await expect(page.getByTestId("content-value")).toHaveText(flow.before);
  await expect(page.getByTestId("undo-status")).toHaveText("Mutation reverted");
};
