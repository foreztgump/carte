import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { get } from "node:http";
import { resolve } from "node:path";

const fixtureRoot = resolve(__dirname, "fixture");
const fixturePort = 4327;
const fixtureUrl = `http://127.0.0.1:${fixturePort}`;
const serverStartupTimeoutMs = 30_000;
const serverPollIntervalMs = 250;
const blockingImpacts = new Set(["critical", "serious"]);

let server: ChildProcessWithoutNullStreams;

const canLoadFixture = (): Promise<boolean> =>
  new Promise((resolveRequest) => {
    const request = get(fixtureUrl, (response) => {
      response.resume();
      resolveRequest(response.statusCode === 200);
    });
    request.on("error", () => resolveRequest(false));
    request.setTimeout(serverPollIntervalMs, () => {
      request.destroy();
      resolveRequest(false);
    });
  });

const waitForFixture = async (): Promise<void> => {
  const deadline = Date.now() + serverStartupTimeoutMs;
  while (Date.now() < deadline) {
    if (await canLoadFixture()) {
      return;
    }
    await new Promise((resolvePoll) => setTimeout(resolvePoll, serverPollIntervalMs));
  }
  throw new Error("Timed out waiting for Astro fixture");
};

test.beforeAll(async () => {
  server = spawn(
    "pnpm",
    ["exec", "astro", "dev", "--host", "127.0.0.1", "--port", String(fixturePort)],
    { cwd: fixtureRoot, env: { ...process.env, NO_COLOR: "1" } },
  );
  await waitForFixture();
});

test.afterAll(() => {
  server.kill();
});

test("@carte/views menu components render fixture data", async ({ page }) => {
  await page.goto(fixtureUrl);

  await expect(page.getByRole("heading", { name: "Juniper Table", level: 1 })).toBeVisible();
  await expect(page.getByText("Seasonal Cal-Mediterranean plates")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Dinner", level: 2 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Charred Broccolini", level: 3 })).toBeVisible();
  await expect(page.getByText("$14.00")).toBeVisible();
  await expect(page.getByText("Contains: Tree nuts")).toBeVisible();
  await expect(page.getByText("123 Market Street")).toBeVisible();
});

test("@carte/views DietaryFilter filters by core allergen taxonomy", async ({ page }) => {
  await page.goto(fixtureUrl);

  await page.getByRole("checkbox", { name: "Hide tree nuts" }).check();

  await expect(page.getByRole("heading", { name: "Charred Broccolini", level: 3 })).toBeHidden();
  await expect(page.getByRole("heading", { name: "Citrus Salad", level: 3 })).toBeVisible();
});

test("@carte/views menu fixture has no serious or critical axe violations", async ({ page }) => {
  await page.goto(fixtureUrl);

  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  const blockingViolations = results.violations.filter((violation) =>
    violation.impact ? blockingImpacts.has(violation.impact) : false,
  );

  expect(blockingViolations).toEqual([]);
});
