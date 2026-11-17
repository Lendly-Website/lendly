import { describe, expect, it } from "vitest";
import { formatDistance, formatRange, rupees } from "./format";

describe("web formatting utilities", () => {
  it("formats distances in metres and kilometres", () => {
    expect(formatDistance(80)).toBe("80 m");
    expect(formatDistance(1500)).toBe("1.5 km");
  });

  it("formats inclusive borrowing ranges", () => {
    expect(formatRange("2026-01-01T00:00:00.000Z", "2026-01-03T00:00:00.000Z")).toContain("1 Jan");
    expect(formatRange("2026-01-01T00:00:00.000Z", "2026-01-03T00:00:00.000Z")).toContain("3 Jan");
  });

  it("formats Indian rupee values", () => {
    expect(rupees(1800)).toBe("₹1,800");
  });
});
