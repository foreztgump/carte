import { describe, expect, it } from "vitest";

import { todayHoursLabelFor } from "./hours.js";
import type { CarteHoursDay } from "./types.js";

const open: CarteHoursDay = { day: "monday", opensAt: "09:00", closesAt: "21:00" };
const closed: CarteHoursDay = { day: "monday", closed: true };

describe("todayHoursLabelFor", () => {
  it("renders the open range when the restaurant is open today", () => {
    expect(todayHoursLabelFor(open)).toMatch(/^Open today: /);
    expect(todayHoursLabelFor(open)).not.toContain("Closed");
  });

  it("renders 'Closed today' when explicitly closed (no 'Open today:' prefix)", () => {
    expect(todayHoursLabelFor(closed)).toBe("Closed today");
  });

  it("renders 'Closed today' when no hours are recorded for today", () => {
    expect(todayHoursLabelFor(undefined)).toBe("Closed today");
  });

  it("renders 'Closed today' when only one of opensAt/closesAt is set", () => {
    expect(todayHoursLabelFor({ day: "monday", opensAt: "09:00" })).toBe("Closed today");
    expect(todayHoursLabelFor({ day: "monday", closesAt: "21:00" })).toBe("Closed today");
  });
});
