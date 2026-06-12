import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
  "packages/core",
  "packages/reservations",
  "packages/orders-backend",
  "packages/orders-admin",
  "packages/views",
  "packages/ai",
  "scripts",
  "harness",
  "harness/plugins/probe",
]);
