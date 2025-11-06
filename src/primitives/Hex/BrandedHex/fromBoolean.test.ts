import { describe, expect, it } from "vitest";
import { fromBoolean } from "./fromBoolean.js";
import { toBoolean } from "./toBoolean.js";

describe("fromBoolean", () => {
	it("converts true to 0x01", () => {
		expect(fromBoolean(true)).toBe("0x01");
	});

	it("converts false to 0x00", () => {
		expect(fromBoolean(false)).toBe("0x00");
	});

	it("round-trip conversions", () => {
		expect(toBoolean(fromBoolean(true))).toBe(true);
		expect(toBoolean(fromBoolean(false))).toBe(false);
	});

	it("creates single-byte hex", () => {
		expect(fromBoolean(true).length).toBe(4);
		expect(fromBoolean(false).length).toBe(4);
	});
});
