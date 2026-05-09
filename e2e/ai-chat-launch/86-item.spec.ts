import { test } from "@playwright/test";

import { launchFixture, verifyAiWriteWithUndo } from "./flow";

const flow = {
  actor: "chef@example.test",
  after: "Charred Broccolini unavailable until 2026-05-10T06:00:00-07:00",
  before: "Charred Broccolini available",
  flow: "86-item",
  label: "86 menu item",
  timestamp: "2026-05-09T20:00:00.000Z",
};

test("86 menu item AI flow confirms diff, audits mutation, mints undoToken, and reverts", async ({
  page,
}) => {
  await launchFixture(page, flow);
  await verifyAiWriteWithUndo(page, flow);
});
