import { test } from "@playwright/test";

import { launchFixture, verifyAiWriteWithUndo } from "./flow";

const flow = {
  actor: "host@example.test",
  after: "Reservations blocked on 2026-05-14 for private event",
  before: "Reservations open on 2026-05-14",
  flow: "block-date",
  label: "block reservation date",
  timestamp: "2026-05-09T20:02:00.000Z",
};

test("block reservation date AI flow confirms diff, audits mutation, mints undoToken, and reverts", async ({
  page,
}) => {
  await launchFixture(page, flow);
  await verifyAiWriteWithUndo(page, flow);
});
