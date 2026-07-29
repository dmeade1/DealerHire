import { describe, expect, it } from "vitest";
import { isIngestQueueAvailable } from "./project";

describe("ingest queue availability (G1-08)", () => {
  it("defaults available; queue-down when explicitly false", () => {
    expect(isIngestQueueAvailable(undefined)).toBe(true);
    expect(isIngestQueueAvailable("")).toBe(true);
    expect(isIngestQueueAvailable("true")).toBe(true);
    expect(isIngestQueueAvailable("false")).toBe(false);
    expect(isIngestQueueAvailable("0")).toBe(false);
  });
});
