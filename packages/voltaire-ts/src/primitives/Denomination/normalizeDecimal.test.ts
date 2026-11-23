import { describe, expect, it } from "vitest";
import { Ether as EtherRoot } from "./Ether.js";
import { Ether as EtherIndex } from "./ether-index.js";
import { Gwei as GweiRoot } from "./Gwei.js";
import { Gwei as GweiIndex } from "./gwei-index.js";
import { normalizeDecimal } from "./normalizeDecimal.js";
import { Wei as WeiIndex } from "./wei-index.js";

describe("Ether decimal validation", () => {
	it.each([
		"0x10",
		Infinity,
		-Infinity,
		NaN,
		"Infinity",
		"-Infinity",
		"NaN",
		"",
		" ",
		"12abc",
		"1.2.3",
	])("rejects %j as an Ether amount", (value) => {
		expect(() => EtherRoot.from(value)).toThrow("Invalid Ether value");
	});

	it("accepts scientific notation strings exactly", () => {
		expect(EtherRoot.from("1e-9")).toBe("0.000000001");
	});

	it("validates decimal input when converting Ether to Gwei", () => {
		expect(() =>
			GweiRoot.fromEther("0x10" as ReturnType<typeof EtherRoot.from>),
		).toThrow("Invalid Ether value");
	});

	it("requires whole Gwei amounts", () => {
		expect(() => GweiRoot.from(" ")).toThrow("Invalid Uint256 string");
		expect(() => GweiRoot.from("1e3")).toThrow("Invalid Uint256 string");
		expect(GweiRoot.from("0x10")).toBe(16n);
	});
});

describe("normalizeDecimal", () => {
	it("expands negative exponents exactly", () => {
		expect(normalizeDecimal(1e-9)).toBe("0.000000001");
		expect(normalizeDecimal(1e-18)).toBe("0.000000000000000001");
		expect(normalizeDecimal(1.5e-7)).toBe("0.00000015");
		expect(normalizeDecimal("2.50E-3")).toBe("0.0025");
	});

	it("expands positive exponents exactly", () => {
		expect(normalizeDecimal(1e21)).toBe("1000000000000000000000");
		expect(normalizeDecimal("1.5e3")).toBe("1500");
		expect(normalizeDecimal("1.5E+1")).toBe("15");
		expect(normalizeDecimal("12.345e1")).toBe("123.45");
		expect(normalizeDecimal(".5e1")).toBe("5");
		expect(normalizeDecimal("5.e0")).toBe("5");
	});

	it("keeps signs and zero", () => {
		expect(normalizeDecimal("-1e-9")).toBe("-0.000000001");
		expect(normalizeDecimal("+1e2")).toBe("100");
		expect(normalizeDecimal("0e5")).toBe("0");
		expect(normalizeDecimal("-0e5")).toBe("0");
	});

	it("returns non-exponent strings trimmed and unchanged", () => {
		expect(normalizeDecimal(" 1.50 ")).toBe("1.50");
		expect(normalizeDecimal("0001")).toBe("0001");
		expect(normalizeDecimal(1.5)).toBe("1.5");
	});

	it("rejects empty mantissas and huge exponents", () => {
		expect(() => normalizeDecimal("e5")).toThrow("Invalid decimal value");
		expect(() => normalizeDecimal(".e5")).toThrow("Invalid decimal value");
		expect(() => normalizeDecimal("1e1001")).toThrow("exponent out of range");
		expect(() => normalizeDecimal("1e-1001")).toThrow("exponent out of range");
		expect(normalizeDecimal("1e-1000")).toBe(`0.${"0".repeat(999)}1`);
	});
});

describe("Ether scientific notation (regression: SyntaxError from BigInt)", () => {
	it("Ether.js: from(1e-9) -> toWei = 1 gwei", () => {
		const ether = EtherRoot.from(1e-9);
		expect(ether).toBe("0.000000001");
		expect(EtherRoot.toWei(ether)).toBe(1_000_000_000n);
		expect(EtherRoot.toGwei(ether)).toBe(1n);
		expect(EtherRoot.toU256(ether)).toBe(1_000_000_000n);
	});

	it("Ether.js: from(1e-18), from(1e21), and string exponents", () => {
		expect(EtherRoot.toWei(EtherRoot.from(1e-18))).toBe(1n);
		expect(EtherRoot.toWei(EtherRoot.from(1e21))).toBe(10n ** 39n);
		expect(EtherRoot.toWei(EtherRoot.from("1.5e-3"))).toBe(
			1_500_000_000_000_000n,
		);
	});

	it("Ether.js: below 1 wei still throws a clear error", () => {
		expect(() => EtherRoot.toWei(EtherRoot.from(1e-19))).toThrow(
			"too many decimal places",
		);
	});

	it("ether-index: from(1e-9) -> toWei / toGwei", () => {
		const ether = EtherIndex.from(1e-9);
		expect(ether).toBe("0.000000001");
		expect(EtherIndex.toWei(ether)).toBe(1_000_000_000n);
		expect(EtherIndex.toGwei(ether)).toBe("1");
		expect(EtherIndex.toWei(EtherIndex.from("2E-7"))).toBe(200_000_000_000n);
		expect(() => EtherIndex.from(-1e-9)).toThrow("cannot be negative");
	});

	it("Gwei/Wei fromEther accept scientific-notation Ether", () => {
		expect(GweiRoot.fromEther(EtherRoot.from(1e-9))).toBe(1n);
		expect(GweiIndex.fromEther(EtherIndex.from(1e-7))).toBe("100");
		expect(WeiIndex.fromEther(EtherIndex.from(1e-9))).toBe(1_000_000_000n);
	});
});
