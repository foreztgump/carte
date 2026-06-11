#!/usr/bin/env tsx
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import ts from "typescript";

const SCAN_ROOTS = [
  "packages/core/src",
  "packages/reservations/src",
  "packages/orders-backend/src",
] as const;
const WARN_THRESHOLD_RATIO = 0.8;
const TABLE_HEADER = "| route | est-CPU-ms | subrequest-count | budget-margin |";
const TABLE_SEPARATOR = "|---|---:|---:|---|";

type CostTable = {
  caps: { cpuMs: number; subrequests: number };
  statementCpuMs: number;
  operations: Record<string, { subrequests: number; cpuMs: number }>;
};
type CliOptions = { root: string; help: boolean };
type HandlerReport = {
  route: string;
  cpuMs: number;
  subrequests: number;
  cpuMsCap: number;
  subrequestCap: number;
  status: "PASS" | "WARN" | "FAIL";
};
type Analysis = { cpuMs: number; subrequests: number };
type ReportInput = {
  project: Project;
  sourceFile: ts.SourceFile;
  routeName: string;
  analysis: Analysis;
};
type NamedExpression = ts.Expression | ts.FunctionDeclaration;
type Project = {
  root: string;
  costTable: CostTable;
  sourceFiles: ts.SourceFile[];
  named: Map<string, NamedExpression>;
};

const options = parseArgs(process.argv.slice(2));
if (options.help) {
  printHelp();
  process.exit(0);
}

try {
  const project = await loadProject(options.root);
  const reports = auditProject(project);
  printReports(reports);
  process.exit(reports.some((report) => report.status === "FAIL") ? 1 : 0);
} catch (error) {
  console.error(`ERROR: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}

function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = { root: process.cwd(), help: false };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--help" || arg === "-h") options.help = true;
    else if (arg === "--root") options.root = path.resolve(readArgValue(args, index++));
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return options;
}

function readArgValue(args: string[], index: number): string {
  const value = args[index + 1];
  if (!value) throw new Error(`${args[index]} requires a value.`);
  return value;
}

function printHelp(): void {
  console.log(`Usage: pnpm tsx scripts/audit-sandbox-budget.ts [--root <repo-root>]

Walks sandboxed Carte plugin route handlers with the TypeScript Compiler API,
estimates ctx.fetch / ctx.kv.* / ctx.content.* usage, and fails when a handler
exceeds 10 subrequests or 50ms estimated CPU.`);
}

async function loadProject(root: string): Promise<Project> {
  const costTable = await readCostTable(root);
  const files = (
    await Promise.all(SCAN_ROOTS.map((scanRoot) => listTypeScriptFiles(root, scanRoot)))
  )
    .flat()
    .sort();
  const sourceFiles = await Promise.all(files.map(readSourceFile));
  return { root, costTable, sourceFiles, named: collectNamedExpressions(sourceFiles) };
}

async function readCostTable(root: string): Promise<CostTable> {
  const tablePath = path.join("scripts", "sandbox-cost-table.json");
  const raw = await readFileWithFallback(
    path.join(root, tablePath),
    path.join(process.cwd(), tablePath),
  );
  return JSON.parse(raw) as CostTable;
}

async function readFileWithFallback(primary: string, fallback: string): Promise<string> {
  try {
    return await readFile(primary, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    return readFile(fallback, "utf8");
  }
}

async function listTypeScriptFiles(root: string, scanRoot: string): Promise<string[]> {
  const absoluteRoot = path.join(root, scanRoot);
  const entries = await safeReadDirectory(absoluteRoot);
  const nested = await Promise.all(
    entries.map(async (entry) => listEntryFiles(root, path.join(scanRoot, entry.name), entry)),
  );
  return nested.flat();
}

async function safeReadDirectory(directory: string) {
  try {
    return await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

async function listEntryFiles(
  root: string,
  relativePath: string,
  entry: { isDirectory(): boolean },
) {
  if (entry.isDirectory()) return listTypeScriptFiles(root, relativePath);
  return relativePath.endsWith(".ts") && !relativePath.endsWith(".test.ts")
    ? [path.join(root, relativePath)]
    : [];
}

async function readSourceFile(filePath: string): Promise<ts.SourceFile> {
  const source = await readFile(filePath, "utf8");
  return ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
}

function collectNamedExpressions(sourceFiles: ts.SourceFile[]): Map<string, NamedExpression> {
  const named = new Map<string, NamedExpression>();
  for (const sourceFile of sourceFiles) visitNamedDeclarations(sourceFile, named);
  return named;
}

function visitNamedDeclarations(node: ts.Node, named: Map<string, NamedExpression>): void {
  if (ts.isFunctionDeclaration(node) && node.name) named.set(node.name.text, node);
  if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
    named.set(node.name.text, node.initializer);
  }
  ts.forEachChild(node, (child) => visitNamedDeclarations(child, named));
}

function auditProject(project: Project): HandlerReport[] {
  const reports = project.sourceFiles.flatMap((sourceFile) => routeReports(project, sourceFile));
  return reports.sort((left, right) => left.route.localeCompare(right.route));
}

function routeReports(project: Project, sourceFile: ts.SourceFile): HandlerReport[] {
  const reports: HandlerReport[] = [];
  const visit = (node: ts.Node): void => {
    if (isRoutesObjectDeclaration(node) && node.initializer) {
      reports.push(
        ...reportsForRoutesObject(project, sourceFile, unwrapObjectLiteral(node.initializer)),
      );
    }
    if (isRoutesProperty(node)) {
      reports.push(
        ...reportsForRoutesObject(project, sourceFile, unwrapObjectLiteral(node.initializer)),
      );
    }
    if (isHooksProperty(node)) {
      reports.push(
        ...reportsForHooksObject(project, sourceFile, unwrapObjectLiteral(node.initializer)),
      );
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return reports;
}

function isRoutesObjectDeclaration(node: ts.Node): node is ts.VariableDeclaration {
  return (
    ts.isVariableDeclaration(node) &&
    ts.isIdentifier(node.name) &&
    node.name.text === "routes" &&
    Boolean(node.initializer && unwrapObjectLiteral(node.initializer))
  );
}

function isRoutesProperty(node: ts.Node): node is ts.PropertyAssignment {
  return (
    ts.isPropertyAssignment(node) &&
    propertyName(node.name) === "routes" &&
    Boolean(unwrapObjectLiteral(node.initializer))
  );
}

function isHooksProperty(node: ts.Node): node is ts.PropertyAssignment {
  return (
    ts.isPropertyAssignment(node) &&
    propertyName(node.name) === "hooks" &&
    Boolean(unwrapObjectLiteral(node.initializer))
  );
}

function reportsForRoutesObject(
  project: Project,
  sourceFile: ts.SourceFile,
  routesObject: ts.ObjectLiteralExpression,
): HandlerReport[] {
  return routesObject.properties.flatMap((property) =>
    ts.isPropertyAssignment(property) ? reportForRouteProperty(project, sourceFile, property) : [],
  );
}

function reportsForHooksObject(
  project: Project,
  sourceFile: ts.SourceFile,
  hooksObject: ts.ObjectLiteralExpression,
): HandlerReport[] {
  return hooksObject.properties.flatMap((property) =>
    ts.isPropertyAssignment(property) ? reportForHookProperty(project, sourceFile, property) : [],
  );
}

function reportForRouteProperty(
  project: Project,
  sourceFile: ts.SourceFile,
  property: ts.PropertyAssignment,
): HandlerReport[] {
  const routeName = propertyName(property.name);
  if (!routeName) return [];
  const handler = handlerExpression(project, property.initializer);
  const analysis = handler
    ? analyzeExpression(project, handler, new Set())
    : { cpuMs: 0, subrequests: 0 };
  return [toReport({ project, sourceFile, routeName, analysis })];
}

function reportForHookProperty(
  project: Project,
  sourceFile: ts.SourceFile,
  property: ts.PropertyAssignment,
): HandlerReport[] {
  const hookName = propertyName(property.name);
  if (!hookName) return [];
  const handler = handlerExpression(project, property.initializer) ?? property.initializer;
  const analysis = analyzeExpression(project, handler, new Set());
  return [toReport({ project, sourceFile, routeName: `hooks/${hookName}`, analysis })];
}

function handlerExpression(project: Project, expression: ts.Expression): ts.Expression | undefined {
  const unwrapped = unwrapExpression(expression);
  if (ts.isObjectLiteralExpression(unwrapped))
    return objectPropertyExpression(unwrapped, "handler");
  if (ts.isCallExpression(unwrapped)) return handlerFromRouteFactory(project, unwrapped);
  return undefined;
}

function handlerFromRouteFactory(
  project: Project,
  call: ts.CallExpression,
): ts.Expression | undefined {
  const factory = calledExpression(project, call.expression);
  const returned = factory ? returnedExpression(factory) : undefined;
  const unwrapped = returned ? unwrapExpression(returned) : undefined;
  return unwrapped && ts.isObjectLiteralExpression(unwrapped)
    ? objectPropertyExpression(unwrapped, "handler")
    : undefined;
}

function unwrapObjectLiteral(expression: ts.Expression): ts.ObjectLiteralExpression {
  const unwrapped = unwrapExpression(expression);
  if (!ts.isObjectLiteralExpression(unwrapped)) throw new Error("Expected object literal.");
  return unwrapped;
}

function unwrapExpression(expression: ts.Expression): ts.Expression {
  if (ts.isSatisfiesExpression(expression) || ts.isAsExpression(expression)) {
    return unwrapExpression(expression.expression);
  }
  if (ts.isParenthesizedExpression(expression)) return unwrapExpression(expression.expression);
  return expression;
}

function analyzeExpression(
  project: Project,
  expression: NamedExpression,
  stack: Set<string>,
): Analysis {
  if (ts.isIdentifier(expression)) return analyzeNamed(project, expression.text, stack);
  if (ts.isFunctionDeclaration(expression)) return analyzeFunction(project, expression, stack);
  if (ts.isArrowFunction(expression) || ts.isFunctionExpression(expression)) {
    return analyzeFunction(project, expression, stack);
  }
  if (ts.isCallExpression(expression)) {
    return analyzeExpression(project, expression.expression, stack);
  }
  return { cpuMs: 0, subrequests: 0 };
}

function analyzeNamed(project: Project, name: string, stack: Set<string>): Analysis {
  if (stack.has(name)) return { cpuMs: 0, subrequests: 0 };
  const expression = project.named.get(name);
  if (!expression) return { cpuMs: 0, subrequests: 0 };
  const nextStack = new Set(stack).add(name);
  return analyzeExpression(project, expression, nextStack);
}

function analyzeFunction(
  project: Project,
  fn: ts.FunctionLikeDeclaration,
  stack: Set<string>,
): Analysis {
  const body = fn.body;
  if (!body) return { cpuMs: 0, subrequests: 0 };
  const base = { cpuMs: countStatements(body) * project.costTable.statementCpuMs, subrequests: 0 };
  return addAnalysis(base, analyzeCallsInNode(project, body, stack));
}

function analyzeCallsInNode(project: Project, node: ts.Node, stack: Set<string>): Analysis {
  let total: Analysis = { cpuMs: 0, subrequests: 0 };
  const visit = (child: ts.Node): void => {
    if (ts.isCallExpression(child)) total = addAnalysis(total, analyzeCall(project, child, stack));
    ts.forEachChild(child, visit);
  };
  visit(node);
  return total;
}

function analyzeCall(project: Project, call: ts.CallExpression, stack: Set<string>): Analysis {
  const operation = operationName(call);
  const operationCost = operation ? project.costTable.operations[operation] : undefined;
  const direct = operationCost ?? { cpuMs: 0, subrequests: 0 };
  const calleeName = calledName(call.expression);
  const nested = calleeName
    ? analyzeNamed(project, calleeName, stack)
    : { cpuMs: 0, subrequests: 0 };
  return addAnalysis(direct, nested);
}

function operationName(call: ts.CallExpression): string | undefined {
  if (ts.isIdentifier(call.expression) && call.expression.text === "fetch") return "ctx.fetch";
  if (!ts.isPropertyAccessExpression(call.expression)) return undefined;
  const method = call.expression.name.text;
  const receiver = call.expression.expression.getText();
  if (method === "fetch") return "ctx.fetch";
  if (method === "set" && isKvReceiver(receiver)) return "ctx.kv.put";
  if (["get", "put", "atomicDecrement"].includes(method) && isKvReceiver(receiver)) {
    return `ctx.kv.${method}`;
  }
  if (["list", "get", "update", "create"].includes(method) && isContentReceiver(receiver)) {
    return `ctx.content.${method}`;
  }
  return undefined;
}

function isKvReceiver(receiver: string): boolean {
  return receiver.includes(".kv") || receiver === "kv" || receiver.startsWith("kvStore(");
}

function isContentReceiver(receiver: string): boolean {
  return (
    receiver.includes(".content") ||
    receiver === "content" ||
    receiver.startsWith("contentStore(") ||
    receiver.startsWith("eventContentStore(")
  );
}

function calledExpression(
  project: Project,
  expression: ts.Expression,
): NamedExpression | undefined {
  const name = calledName(expression);
  return name ? project.named.get(name) : undefined;
}

function calledName(expression: ts.Expression): string | undefined {
  if (ts.isIdentifier(expression)) return expression.text;
  if (ts.isPropertyAccessExpression(expression)) return expression.name.text;
  return undefined;
}

function returnedExpression(expression: NamedExpression): ts.Expression | undefined {
  if (ts.isArrowFunction(expression) && !ts.isBlock(expression.body)) return expression.body;
  const body =
    ts.isFunctionDeclaration(expression) || ts.isArrowFunction(expression)
      ? expression.body
      : undefined;
  if (!body || !ts.isBlock(body)) return undefined;
  return body.statements.find(ts.isReturnStatement)?.expression;
}

function objectPropertyExpression(
  objectLiteral: ts.ObjectLiteralExpression,
  name: string,
): ts.Expression | undefined {
  const property = objectLiteral.properties.find(
    (entry): entry is ts.PropertyAssignment =>
      ts.isPropertyAssignment(entry) && propertyName(entry.name) === name,
  );
  return property?.initializer;
}

function propertyName(name: ts.PropertyName): string | undefined {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name))
    return name.text;
  return undefined;
}

function countStatements(node: ts.Node): number {
  let count = 0;
  const visit = (child: ts.Node): void => {
    if (ts.isStatement(child)) count += 1;
    ts.forEachChild(child, visit);
  };
  visit(node);
  return count;
}

function addAnalysis(left: Analysis, right: Analysis): Analysis {
  return { cpuMs: left.cpuMs + right.cpuMs, subrequests: left.subrequests + right.subrequests };
}

function toReport(input: ReportInput): HandlerReport {
  const { project, sourceFile, routeName, analysis } = input;
  const status = reportStatus(project.costTable, analysis);
  return {
    route: routeId(project.root, sourceFile.fileName, routeName),
    status,
    cpuMsCap: project.costTable.caps.cpuMs,
    subrequestCap: project.costTable.caps.subrequests,
    ...analysis,
  };
}

function reportStatus(costTable: CostTable, analysis: Analysis): HandlerReport["status"] {
  if (analysis.subrequests > costTable.caps.subrequests || analysis.cpuMs > costTable.caps.cpuMs) {
    return "FAIL";
  }
  if (
    analysis.subrequests >= costTable.caps.subrequests * WARN_THRESHOLD_RATIO ||
    analysis.cpuMs >= costTable.caps.cpuMs * WARN_THRESHOLD_RATIO
  ) {
    return "WARN";
  }
  return "PASS";
}

function routeId(root: string, fileName: string, routeName: string): string {
  const relative = path
    .relative(root, fileName)
    .replace(/\\/g, "/")
    .replace(/\/index\.ts$/, "");
  const base = relative.replace(/\/routes\.ts$/, "").replace(/\.ts$/, "");
  return `${base}/${routeName}`;
}

function printReports(reports: HandlerReport[]): void {
  console.log(TABLE_HEADER);
  console.log(TABLE_SEPARATOR);
  for (const report of reports) {
    console.log(
      `| ${report.route} | ${report.cpuMs.toFixed(2)} | ${report.subrequests} | ${budgetMargin(report)} |`,
    );
  }
}

function budgetMargin(report: HandlerReport): string {
  const subrequestMargin = report.subrequestCap - report.subrequests;
  const cpuMargin = report.cpuMsCap - report.cpuMs;
  return `${report.status} (${subrequestMargin} subreq, ${cpuMargin.toFixed(2)}ms CPU)`;
}
