import { formatHoursRange } from "./format.js";
import type { CarteHoursDay } from "./types.js";

const isOpenToday = (
  today?: CarteHoursDay,
): today is Required<Pick<CarteHoursDay, "opensAt" | "closesAt">> & CarteHoursDay =>
  today !== undefined &&
  today.closed !== true &&
  typeof today.opensAt === "string" &&
  typeof today.closesAt === "string";

export const todayHoursLabelFor = (today?: CarteHoursDay): string =>
  isOpenToday(today)
    ? `Open today: ${formatHoursRange(today.opensAt, today.closesAt)}`
    : "Closed today";
