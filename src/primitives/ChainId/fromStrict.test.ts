import { describe, expect, it, vi } from "vitest";
import { ValidationError } from "../errors/ValidationError.js";
import * as ChainId from "./index.js";

describe("fromStrict", () => {
	it("returns chain ID for known chains without warning", () => {
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

		const mainnet = ChainId.fromStrict(1);
		expect(mainnet).toBe(1);
		expect(warnSpy).not.toHaveBeenCalled();

		warnSpy.mockRestore();
	});

	it("warns for unknown chains in warn mode (default)", () => {
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

		const unknown = ChainId.fromStrict(999999);
		expect(unknown).toBe(999999);
		expect(warnSpy).toHaveBeenCalledWith(
			expect.stringContaining("Unknown chain ID: 999999"),
		);

		warnSpy.mockRestore();
	});

	it("warns for unknown chains in explicit warn mode", () => {
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

		const unknown = ChainId.fromStrict(12345, { mode: "warn" });
		expect(unknown).toBe(12345);
		expect(warnSpy).toHaveBeenCalledWith(
			expect.stringContaining("Unknown chain ID: 12345"),
		);

		warnSpy.mockRestore();
	});

	it("throws for unknown chains in throw mode", () => {
		expect(() => ChainId.fromStrict(999999, { mode: "throw" })).toThrow(
			ValidationError,
		);
		expect(() => ChainId.fromStrict(999999, { mode: "throw" })).toThrow(
			"Unknown chain ID: 999999",
		);
	});

	it("does not throw for known chains in throw mode", () => {
		expect(() => ChainId.fromStrict(1, { mode: "throw" })).not.toThrow();
		expect(() =>
			ChainId.fromStrict(ChainId.POLYGON, { mode: "throw" }),
		).not.toThrow();
	});

	it("still validates format (rejects negative)", () => {
		expect(() => ChainId.fromStrict(-1)).toThrow();
	});

	it("still validates format (rejects non-integer)", () => {
		expect(() => ChainId.fromStrict(1.5)).toThrow();
	});
});
