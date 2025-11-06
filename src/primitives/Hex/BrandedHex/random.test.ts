import { describe, expect, it } from "vitest";
import { random } from "./random.js";
import { isHex } from "./isHex.js";
import { size } from "./size.js";

describe("random", () => {
	it("generates random hex of specified size", () => {
		const hex = random(4);
		expect(hex.startsWith("0x")).toBe(true);
		expect(size(hex)).toBe(4);
		expect(isHex(hex)).toBe(true);
	});

	it("generates different values each time", () => {
		const hex1 = random(32);
		const hex2 = random(32);
		const hex3 = random(32);
		expect(hex1).not.toBe(hex2);
		expect(hex2).not.toBe(hex3);
		expect(hex1).not.toBe(hex3);
	});

	it("generates valid hex for all sizes", () => {
		for (const s of [1, 2, 4, 8, 16, 20, 32, 64, 128]) {
			const hex = random(s);
			expect(isHex(hex)).toBe(true);
			expect(size(hex)).toBe(s);
		}
	});

	it("generates zero-size hex", () => {
		const hex = random(0);
		expect(hex).toBe("0x");
		expect(size(hex)).toBe(0);
	});

	it("generates single byte", () => {
		const hex = random(1);
		expect(size(hex)).toBe(1);
		expect(hex.length).toBe(4);
		expect(isHex(hex)).toBe(true);
	});

	it("generates address-sized random hex (20 bytes)", () => {
		const hex = random(20);
		expect(size(hex)).toBe(20);
		expect(hex.length).toBe(2 + 20 * 2);
	});

	it("generates hash-sized random hex (32 bytes)", () => {
		const hex = random(32);
		expect(size(hex)).toBe(32);
		expect(hex.length).toBe(2 + 32 * 2);
	});

	it("generates large random hex", () => {
		const hex = random(1000);
		expect(size(hex)).toBe(1000);
		expect(isHex(hex)).toBe(true);
	});

	it("uses lowercase hex characters", () => {
		const hex = random(32);
		expect(hex).toBe(hex.toLowerCase());
	});

	it("generates full range of bytes", () => {
		const hexes = Array.from({ length: 100 }, () => random(32));
		const allSame = hexes.every((h) => h === hexes[0]);
		expect(allSame).toBe(false);
	});
});
