import { test } from "@playwright/test";

import { launchFixture, verifyAiWriteWithUndo } from "./flow";

const flow = {
  actor: "host@example.test",
  after: "Reservation rsv_1001 moved to 2026-05-14 20:00",
  before: "Reservation rsv_1001 booked for 2026-05-14 19:00",
  flow: "move-reservation",
  label: "move reservation",
  timestamp: "2026-05-09T20:03:00.000Z",
};

test("move reservation AI flow confirms diff, audits mutation, mints undoToken, and reverts", async ({
  page,
}) => {
  await launchFixture(page, flow);
  await verifyAiWriteWithUndo(page, flow);
});
