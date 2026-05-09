import { createServer, type Server } from "node:http";
import { once } from "node:events";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

const VALID_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  name: "Carte Bistro",
  image: "https://example.test/bistro.jpg",
  telephone: "+15035550100",
  servesCuisine: ["French", "Pacific Northwest"],
  address: {
    "@type": "PostalAddress",
    streetAddress: "1 Main Street",
    addressLocality: "Portland",
    addressRegion: "OR",
    postalCode: "97201",
    addressCountry: "US",
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: "https://schema.org/Monday",
      opens: "09:00",
      closes: "17:00",
    },
  ],
  hasMenu: {
    "@type": "Menu",
    name: "Dinner",
    hasMenuSection: [
      {
        "@type": "MenuSection",
        name: "Mains",
        hasMenuItem: [
          {
            "@type": "MenuItem",
            name: "Mushroom Risotto",
            offers: {
              "@type": "Offer",
              price: "18.50",
              priceCurrency: "USD",
            },
          },
        ],
      },
    ],
  },
};

const INVALID_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  name: "Incomplete Bistro",
  hasMenu: {
    "@type": "Menu",
    name: "Dinner",
    hasMenuSection: [
      {
        "@type": "MenuSection",
        hasMenuItem: [
          {
            "@type": "MenuItem",
            name: "No Price Item",
            offers: { "@type": "Offer", priceCurrency: "USD" },
          },
        ],
      },
    ],
  },
};

type RunResult = {
  exitCode: number | null;
  output: string;
};

describe("verify-rich-results script", () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    server = createServer((request, response) => {
      const payload = request.url === "/valid" ? VALID_JSON_LD : INVALID_JSON_LD;
      response.setHeader("content-type", "application/ld+json");
      response.end(JSON.stringify(payload));
    });
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Fixture server did not bind.");
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  it("exits 0 when Restaurant and Menu JSON-LD contains required rich result fields", async () => {
    const result = await runVerifier(`${baseUrl}/valid`);

    expect(result.exitCode).toBe(0);
    expect(result.output).toContain("OK:");
  });

  it("exits 1 and prints missing field paths when JSON-LD is incomplete", async () => {
    const result = await runVerifier(`${baseUrl}/invalid`);

    expect(result.exitCode).toBe(1);
    expect(result.output).toContain("address.streetAddress");
    expect(result.output).toContain("hasMenu.hasMenuSection[0].name");
    expect(result.output).toContain("offers.price");
  });
});

const runVerifier = async (url: string): Promise<RunResult> =>
  new Promise((resolve, reject) => {
    const child = spawn("pnpm", ["run", "verify:rich-results", "--url", url], {
      cwd: REPO_ROOT,
      stdio: ["ignore", "pipe", "pipe"],
    });
    const chunks: Buffer[] = [];
    child.stdout.on("data", (chunk: Buffer) => chunks.push(chunk));
    child.stderr.on("data", (chunk: Buffer) => chunks.push(chunk));
    child.on("error", reject);
    child.on("close", (exitCode) =>
      resolve({ exitCode, output: Buffer.concat(chunks).toString("utf8") }),
    );
  });
