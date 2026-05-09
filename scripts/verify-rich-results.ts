#!/usr/bin/env tsx
/**
 * Local Rich Results verifier for Carte JSON-LD.
 *
 * Google's Rich Results Test at https://search.google.com/test/rich-results has
 * no supported public API. This script therefore gates CI with local schema.org
 * Restaurant + Menu structural checks and, when requested with
 * `--launch-browser`, opens the Google UI for human launch sign-off.
 *
 * Rate-limit note: do not automate or scrape Google's Rich Results Test from CI.
 * Use the browser launch path sparingly for HITL checks against live URLs.
 */
import { spawn } from "node:child_process";
import process from "node:process";

import type { Menu, Restaurant, WithContext } from "schema-dts";

const SCHEMA_CONTEXT = "https://schema.org";
const GOOGLE_RICH_RESULTS_URL = "https://search.google.com/test/rich-results";
const REQUIRED_RESTAURANT_FIELDS = [
  "name",
  "image",
  "address.streetAddress",
  "address.addressLocality",
  "address.addressRegion",
  "address.postalCode",
  "address.addressCountry",
  "telephone",
  "servesCuisine",
] as const;

type CliOptions = {
  url?: string;
  help: boolean;
  launchBrowser: boolean;
};
type JsonObject = Record<string, unknown>;
type ValidationResult = {
  checkedFields: number;
  rootType: string;
  errors: string[];
};
type SchemaRestaurant = JsonObject & Partial<WithContext<Restaurant>>;
type SchemaMenu = JsonObject & Partial<Menu>;

const options = parseArgs(process.argv.slice(2));

if (options.help) {
  printHelp();
  process.exit(0);
}

try {
  const payload = await loadPayload(options);
  const validation = validateJsonLd(payload);
  if (validation.errors.length > 0) {
    printValidationErrors(validation.errors);
    process.exit(1);
  }
  if (options.launchBrowser) launchGoogleRichResults(options.url);
  printSuccess(validation, options.url);
} catch (error) {
  console.error(`ERROR: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}

function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = { help: false, launchBrowser: false };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--") continue;
    if (arg === "--help" || arg === "-h") options.help = true;
    else if (arg === "--launch-browser") options.launchBrowser = true;
    else if (arg === "--url") options.url = readValue(args, index++);
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return options;
}

function readValue(args: string[], index: number): string {
  const value = args[index + 1];
  if (!value) throw new Error(`${args[index]} requires a value.`);
  return value;
}

function printHelp(): void {
  console.log(`Usage: pnpm verify:rich-results -- --url <jsonld-endpoint> [--launch-browser]

Fetches JSON-LD, validates schema.org Restaurant + Menu required fields, and
prints a Google Rich Results Test URL for HITL launch sign-off.

Options:
  --url <jsonld-endpoint>  Endpoint returning application/ld+json
  --launch-browser        Open Google's Rich Results Test UI for the URL
  --help                  Show this help text`);
}

async function loadPayload(options: CliOptions): Promise<unknown> {
  if (!options.url) throw new Error("Missing required --url <jsonld-endpoint>.");
  const response = await fetch(options.url);
  if (!response.ok) throw new Error(`Fetch failed for ${options.url}: ${response.status}`);
  return response.json();
}

function validateJsonLd(payload: unknown): ValidationResult {
  const root = selectRootNode(payload);
  const restaurant = asSchemaRestaurant(root);
  const errors = validateRestaurant(restaurant);
  return {
    checkedFields: REQUIRED_RESTAURANT_FIELDS.length + countMenuFields(restaurant),
    rootType: String(readPath(restaurant, "@type")),
    errors,
  };
}

function selectRootNode(payload: unknown): JsonObject {
  if (isObject(payload) && isType(payload, "Restaurant")) return payload;
  if (!isObject(payload)) throw new Error("JSON-LD payload must be an object.");
  const graph = payload["@graph"];
  if (!Array.isArray(graph)) throw new Error("JSON-LD must contain a Restaurant node.");
  const restaurant = graph.find((node) => isObject(node) && isType(node, "Restaurant"));
  if (!isObject(restaurant)) throw new Error("JSON-LD @graph must contain a Restaurant node.");
  return restaurant;
}

function asSchemaRestaurant(root: JsonObject): SchemaRestaurant {
  if (root["@context"] !== SCHEMA_CONTEXT) {
    throw new Error(`JSON-LD @context must be ${SCHEMA_CONTEXT}.`);
  }
  return root as unknown as SchemaRestaurant;
}

function validateRestaurant(restaurant: SchemaRestaurant): string[] {
  const errors: string[] = REQUIRED_RESTAURANT_FIELDS.flatMap((path) =>
    isPresent(readPath(restaurant, path)) ? [] : [path],
  );
  if (!hasOpeningHours(restaurant)) errors.push("openingHoursSpecification");
  return [...errors, ...validateMenu(readPath(restaurant, "hasMenu"), "hasMenu")];
}

function validateMenu(value: unknown, path: string): string[] {
  const menu = firstNode(value) as SchemaMenu | undefined;
  if (!isObject(menu) || !isType(menu, "Menu")) return [path];
  return [
    ...missingFields(menu, ["name"], path),
    ...validateMenuSections(menu.hasMenuSection, `${path}.hasMenuSection`),
  ];
}

function validateMenuSections(value: unknown, path: string): string[] {
  const sections = nodeArray(value);
  if (sections.length === 0) return [path];
  return sections.flatMap((section, index) => validateMenuSection(section, `${path}[${index}]`));
}

function validateMenuSection(section: JsonObject, path: string): string[] {
  return [
    ...missingFields(section, ["name"], path),
    ...validateMenuItems(section.hasMenuItem, `${path}.hasMenuItem`),
  ];
}

function validateMenuItems(value: unknown, path: string): string[] {
  const items = nodeArray(value);
  if (items.length === 0) return [path];
  return items.flatMap((item, index) => validateMenuItem(item, `${path}[${index}]`));
}

function validateMenuItem(item: JsonObject, path: string): string[] {
  const errors = missingFields(item, ["name"], path);
  const offer = firstNode(item.offers);
  if (!isObject(offer)) return [...errors, `${path}.offers`];
  return [...errors, ...missingFields(offer, ["price", "priceCurrency"], `${path}.offers`)];
}

function missingFields(node: JsonObject, fields: readonly string[], path: string): string[] {
  return fields.flatMap((field) => (isPresent(node[field]) ? [] : [`${path}.${field}`]));
}

function hasOpeningHours(restaurant: SchemaRestaurant): boolean {
  const openingHours = readPath(restaurant, "openingHours");
  const openingHoursSpecification = readPath(restaurant, "openingHoursSpecification");
  return (
    isPresent(openingHours) ||
    (Array.isArray(openingHoursSpecification) && openingHoursSpecification.length > 0)
  );
}

function countMenuFields(restaurant: SchemaRestaurant): number {
  const menu = firstNode(readPath(restaurant, "hasMenu"));
  if (!isObject(menu)) return 0;
  return (
    1 + nodeArray(menu.hasMenuSection).reduce((total, section) => total + countSection(section), 0)
  );
}

function countSection(section: JsonObject): number {
  return 1 + nodeArray(section.hasMenuItem).reduce((total, item) => total + countItem(item), 0);
}

function countItem(item: JsonObject): number {
  const offer = firstNode(item.offers);
  return 1 + (isObject(offer) ? 2 : 0);
}

function readPath(value: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((current, part) => {
    if (!isObject(current)) return undefined;
    return current[part];
  }, value);
}

function nodeArray(value: unknown): JsonObject[] {
  const values = Array.isArray(value) ? value : [value];
  return values.filter(isObject);
}

function firstNode(value: unknown): unknown {
  return Array.isArray(value) ? value[0] : value;
}

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isType(value: JsonObject, type: string): boolean {
  const rawType = value["@type"];
  return rawType === type || (Array.isArray(rawType) && rawType.includes(type));
}

function isPresent(value: unknown): boolean {
  if (Array.isArray(value)) return value.length > 0;
  return value !== undefined && value !== null && value !== "";
}

function launchGoogleRichResults(url: string | undefined): void {
  if (!url) throw new Error("--launch-browser requires --url.");
  const testUrl = richResultsTestUrl(url);
  const opener = process.platform === "darwin" ? "open" : "xdg-open";
  spawn(opener, [testUrl], { detached: true, stdio: "ignore" }).unref();
}

function richResultsTestUrl(url: string): string {
  return `${GOOGLE_RICH_RESULTS_URL}?url=${encodeURIComponent(url)}`;
}

function printValidationErrors(errors: string[]): void {
  console.error("Rich Results validation failed:");
  for (const error of errors) console.error(`- missing ${error}`);
}

function printSuccess(validation: ValidationResult, url: string | undefined): void {
  console.log(
    `OK: ${validation.rootType} at ${url ?? "input"} — ${validation.checkedFields} required fields present.`,
  );
  if (url) console.log(`Google Rich Results Test: ${richResultsTestUrl(url)}`);
}
