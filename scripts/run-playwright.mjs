import { spawn } from "node:child_process";

/* global console, process */

const PLAYWRIGHT_COMMAND = "playwright";
const PNPM_COMMAND = "pnpm";
const TEST_COMMAND = "test";
const FAILURE_EXIT_CODE = 1;

const forwardedArgs = process.argv.slice(2).filter((arg, index) => !(index === 0 && arg === "--"));
const child = spawn(PNPM_COMMAND, ["exec", PLAYWRIGHT_COMMAND, TEST_COMMAND, ...forwardedArgs], {
  stdio: "inherit",
});

child.on("exit", (code) => {
  process.exit(code ?? FAILURE_EXIT_CODE);
});

child.on("error", (error) => {
  console.error(error);
  process.exit(FAILURE_EXIT_CODE);
});
