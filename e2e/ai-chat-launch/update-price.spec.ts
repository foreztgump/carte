import { test } from "@playwright/test";

import { launchFixture, verifyAiWriteWithUndo } from "./flow";

const flow = {
  actor: "manager@example.test",
  after: "Citrus Salad price $14.00",
  before: "Citrus Salad price $12.00",
  flow: "update-price",
  label: "update price",
  timestamp: "2026-05-09T20:01:00.000Z",
};

test("update price AI flow confirms diff, audits mutation, mints undoToken, and reverts", async ({
  page,
}) => {
  await launchFixture(page, flow);
  await verifyAiWriteWithUndo(page, flow);
});
