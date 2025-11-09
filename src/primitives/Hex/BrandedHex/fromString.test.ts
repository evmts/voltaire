import { describe, expect, it } from "vitest";
import type { BrandedHex } from "./BrandedHex.js";
import { fromString } from "./fromString.js";
import { toBytes } from "./toBytes.js";

describe("fromString", () => {
	it("converts empty string", () => {
		expect(fromString("")).toBe("0x");
	});

	it("converts single character", () => {
		const hex = fromString("a");
		expect(hex).toBe("0x61");
	});

	it("converts ASCII string", () => {
		expect(fromString("hello")).toBe("0x68656c6c6f");
		expect(fromString("Hello World!")).toBe("0x48656c6c6f20576f726c6421");
	});

	it("converts special characters", () => {
		expect(fromString("@")).toBe("0x40");
		expect(fromString("123")).toBe("0x313233");
		expect(fromString("!@#$%")).toBe("0x2140232425");
	});

	it("converts Unicode characters", () => {
		const hex = fromString("🚀") as BrandedHex;
		const bytes = toBytes(hex);
		expect(bytes.length).toBeGreaterThan(1);
	});

	it("converts newlines and tabs", () => {
		expect(fromString("\n")).toBe("0x0a");
		expect(fromString("\t")).toBe("0x09");
		expect(fromString("\r\n")).toBe("0x0d0a");
	});

	it("round-trip conversion", () => {
		const original = "Hello, World! 123";
		const hex = fromString(original) as BrandedHex;
		const bytes = toBytes(hex);
		const decoded = new TextDecoder().decode(bytes);
		expect(decoded).toBe(original);
	});

	it("handles long strings", () => {
		const long = "a".repeat(1000);
		const hex = fromString(long);
		expect(hex.length).toBe(2 + 1000 * 2);
	});
});
