import { describe, expect, test } from "bun:test";
import { formatEther } from "./format-ether.js";
import { formatGwei } from "./format-gwei.js";
import { formatUnits } from "./format-units.js";
import { parseEther } from "./parse-ether.js";
import { parseGwei } from "./parse-gwei.js";
import { parseUnits } from "./parse-units.js";

describe("formatUnits", () => {
	test("formats with 0 decimals", () => {
		expect(formatUnits(12345n, 0)).toBe("12345");
		expect(formatUnits(0n, 0)).toBe("0");
		expect(formatUnits(1n, 0)).toBe("1");
	});

	test("formats with 18 decimals (ether)", () => {
		expect(formatUnits(1000000000000000000n, 18)).toBe("1");
		expect(formatUnits(1500000000000000000n, 18)).toBe("1.5");
		expect(formatUnits(123456789012345678n, 18)).toBe("0.123456789012345678");
		expect(formatUnits(1n, 18)).toBe("0.000000000000000001");
	});

	test("formats with 9 decimals (gwei)", () => {
		expect(formatUnits(1000000000n, 9)).toBe("1");
		expect(formatUnits(1500000000n, 9)).toBe("1.5");
		expect(formatUnits(123456789n, 9)).toBe("0.123456789");
		expect(formatUnits(1n, 9)).toBe("0.000000001");
	});

	test("removes trailing zeros", () => {
		expect(formatUnits(1000000000000000000n, 18)).toBe("1");
		expect(formatUnits(1100000000000000000n, 18)).toBe("1.1");
		expect(formatUnits(1230000000000000000n, 18)).toBe("1.23");
		expect(formatUnits(1234500000000000000n, 18)).toBe("1.2345");
	});

	test("handles zero", () => {
		expect(formatUnits(0n, 0)).toBe("0");
		expect(formatUnits(0n, 9)).toBe("0");
		expect(formatUnits(0n, 18)).toBe("0");
	});

	test("handles negative values", () => {
		expect(formatUnits(-1000000000000000000n, 18)).toBe("-1");
		expect(formatUnits(-1500000000000000000n, 18)).toBe("-1.5");
		expect(formatUnits(-1n, 18)).toBe("-0.000000000000000001");
	});

	test("handles large values", () => {
		// Max uint256 in wei
		const maxUint256 =
			115792089237316195423570985008687907853269984665640564039457584007913129639935n;
		const formatted = formatUnits(maxUint256, 18);
		expect(formatted).toBeTruthy();
		expect(typeof formatted).toBe("string");
	});

	test("throws on invalid decimals", () => {
		expect(() => formatUnits(1n, -1)).toThrow("Invalid decimals");
		expect(() => formatUnits(1n, 78)).toThrow("Invalid decimals");
		expect(() => formatUnits(1n, 1.5)).toThrow("must be an integer");
	});
});

describe("parseUnits", () => {
	test("parses with 0 decimals", () => {
		expect(parseUnits("12345", 0)).toBe(12345n);
		expect(parseUnits("0", 0)).toBe(0n);
		expect(parseUnits("1", 0)).toBe(1n);
	});

	test("parses with 18 decimals (ether)", () => {
		expect(parseUnits("1", 18)).toBe(1000000000000000000n);
		expect(parseUnits("1.5", 18)).toBe(1500000000000000000n);
		expect(parseUnits("0.123456789012345678", 18)).toBe(123456789012345678n);
		expect(parseUnits("0.000000000000000001", 18)).toBe(1n);
	});

	test("parses with 9 decimals (gwei)", () => {
		expect(parseUnits("1", 9)).toBe(1000000000n);
		expect(parseUnits("1.5", 9)).toBe(1500000000n);
		expect(parseUnits("0.123456789", 9)).toBe(123456789n);
		expect(parseUnits("0.000000001", 9)).toBe(1n);
	});

	test("handles zero", () => {
		expect(parseUnits("0", 0)).toBe(0n);
		expect(parseUnits("0", 9)).toBe(0n);
		expect(parseUnits("0", 18)).toBe(0n);
		expect(parseUnits("0.0", 18)).toBe(0n);
		expect(parseUnits("0.000", 18)).toBe(0n);
	});

	test("handles negative values", () => {
		expect(parseUnits("-1", 18)).toBe(-1000000000000000000n);
		expect(parseUnits("-1.5", 18)).toBe(-1500000000000000000n);
		expect(parseUnits("-0.000000000000000001", 18)).toBe(-1n);
	});

	test("handles values without decimal point", () => {
		expect(parseUnits("1", 18)).toBe(1000000000000000000n);
		expect(parseUnits("123", 9)).toBe(123000000000n);
	});

	test("handles values with trailing zeros", () => {
		expect(parseUnits("1.0", 18)).toBe(1000000000000000000n);
		expect(parseUnits("1.50", 18)).toBe(1500000000000000000n);
		expect(parseUnits("1.500000", 18)).toBe(1500000000000000000n);
	});

	test("handles values with leading zeros", () => {
		expect(parseUnits("0.1", 18)).toBe(100000000000000000n);
		expect(parseUnits("0.01", 18)).toBe(10000000000000000n);
		expect(parseUnits("0.001", 18)).toBe(1000000000000000n);
	});

	test("handles whitespace", () => {
		expect(parseUnits("  1  ", 18)).toBe(1000000000000000000n);
		expect(parseUnits("  1.5  ", 18)).toBe(1500000000000000000n);
	});

	test("throws on too many decimal places", () => {
		expect(() => parseUnits("1.0000000000000000001", 18)).toThrow(
			"Too many decimal places",
		);
		expect(() => parseUnits("1.0000000001", 9)).toThrow(
			"Too many decimal places",
		);
	});

	test("throws on invalid decimals", () => {
		expect(() => parseUnits("1", -1)).toThrow("Invalid decimals");
		expect(() => parseUnits("1", 78)).toThrow("Invalid decimals");
		expect(() => parseUnits("1", 1.5)).toThrow("must be an integer");
	});

	test("throws on invalid input", () => {
		expect(() => parseUnits("", 18)).toThrow("Invalid value");
		expect(() => parseUnits("   ", 18)).toThrow("Invalid value");
		expect(() => parseUnits("abc", 18)).toThrow("Invalid whole part");
		expect(() => parseUnits("1.abc", 18)).toThrow("Invalid fractional part");
		expect(() => parseUnits("1.2.3", 18)).toThrow("multiple decimal points");
	});
});

describe("formatEther", () => {
	test("formats common ether values", () => {
		expect(formatEther(0n)).toBe("0");
		expect(formatEther(1n)).toBe("0.000000000000000001");
		expect(formatEther(1000000000000000000n)).toBe("1");
		expect(formatEther(1500000000000000000n)).toBe("1.5");
		expect(formatEther(123456789012345678n)).toBe("0.123456789012345678");
	});

	test("formats large ether values", () => {
		expect(formatEther(1000000000000000000000n)).toBe("1000");
		expect(formatEther(999999999999999999999999n)).toBe("999999.999999999999999999");
	});

	test("handles negative ether values", () => {
		expect(formatEther(-1000000000000000000n)).toBe("-1");
		expect(formatEther(-1500000000000000000n)).toBe("-1.5");
	});
});

describe("parseEther", () => {
	test("parses common ether values", () => {
		expect(parseEther("0")).toBe(0n);
		expect(parseEther("0.000000000000000001")).toBe(1n);
		expect(parseEther("1")).toBe(1000000000000000000n);
		expect(parseEther("1.5")).toBe(1500000000000000000n);
		expect(parseEther("0.123456789012345678")).toBe(123456789012345678n);
	});

	test("parses large ether values", () => {
		expect(parseEther("1000")).toBe(1000000000000000000000n);
		expect(parseEther("999999.999999999999999999")).toBe(
			999999999999999999999999n,
		);
	});

	test("handles negative ether values", () => {
		expect(parseEther("-1")).toBe(-1000000000000000000n);
		expect(parseEther("-1.5")).toBe(-1500000000000000000n);
	});

	test("throws on too many decimals", () => {
		expect(() => parseEther("1.0000000000000000001")).toThrow(
			"Too many decimal places",
		);
	});
});

describe("formatGwei", () => {
	test("formats common gwei values", () => {
		expect(formatGwei(0n)).toBe("0");
		expect(formatGwei(1n)).toBe("0.000000001");
		expect(formatGwei(1000000000n)).toBe("1");
		expect(formatGwei(1500000000n)).toBe("1.5");
		expect(formatGwei(123456789n)).toBe("0.123456789");
	});

	test("formats large gwei values", () => {
		expect(formatGwei(1000000000000n)).toBe("1000");
		expect(formatGwei(999999999999999n)).toBe("999999.999999999");
	});

	test("handles negative gwei values", () => {
		expect(formatGwei(-1000000000n)).toBe("-1");
		expect(formatGwei(-1500000000n)).toBe("-1.5");
	});
});

describe("parseGwei", () => {
	test("parses common gwei values", () => {
		expect(parseGwei("0")).toBe(0n);
		expect(parseGwei("0.000000001")).toBe(1n);
		expect(parseGwei("1")).toBe(1000000000n);
		expect(parseGwei("1.5")).toBe(1500000000n);
		expect(parseGwei("0.123456789")).toBe(123456789n);
	});

	test("parses large gwei values", () => {
		expect(parseGwei("1000")).toBe(1000000000000n);
		expect(parseGwei("999999.999999999")).toBe(999999999999999n);
	});

	test("handles negative gwei values", () => {
		expect(parseGwei("-1")).toBe(-1000000000n);
		expect(parseGwei("-1.5")).toBe(-1500000000n);
	});

	test("throws on too many decimals", () => {
		expect(() => parseGwei("1.0000000001")).toThrow("Too many decimal places");
	});
});

describe("round-trip conversions", () => {
	test("ether round-trip: parse then format", () => {
		const values = ["1", "1.5", "0.123456789012345678", "999.999999999999999999"];
		for (const value of values) {
			expect(formatEther(parseEther(value))).toBe(value);
		}
	});

	test("gwei round-trip: parse then format", () => {
		const values = ["1", "1.5", "0.123456789", "999.999999999"];
		for (const value of values) {
			expect(formatGwei(parseGwei(value))).toBe(value);
		}
	});

	test("custom decimals round-trip: parse then format", () => {
		const testCases = [
			{ value: "1", decimals: 6 },
			{ value: "1.5", decimals: 6 },
			{ value: "0.123456", decimals: 6 },
			{ value: "1", decimals: 3 },
			{ value: "1.5", decimals: 3 },
			{ value: "0.123", decimals: 3 },
		];

		for (const { value, decimals } of testCases) {
			expect(formatUnits(parseUnits(value, decimals), decimals)).toBe(value);
		}
	});

	test("format then parse (with normalization)", () => {
		// Note: formatEther removes trailing zeros, so we compare bigint values
		const weiValues = [
			1000000000000000000n,
			1500000000000000000n,
			123456789012345678n,
		];
		for (const wei of weiValues) {
			expect(parseEther(formatEther(wei))).toBe(wei);
		}
	});
});

describe("edge cases", () => {
	test("handles max uint256", () => {
		const maxUint256 =
			115792089237316195423570985008687907853269984665640564039457584007913129639935n;
		const formatted = formatEther(maxUint256);
		expect(formatted).toBeTruthy();
		// Should be able to parse it back (though it may not be exact due to precision)
		const parsed = parseEther(formatted);
		expect(parsed).toBe(maxUint256);
	});

	test("handles 1 wei", () => {
		expect(formatEther(1n)).toBe("0.000000000000000001");
		expect(parseEther("0.000000000000000001")).toBe(1n);
	});

	test("handles values at decimal boundary", () => {
		// Exactly at the decimal limit
		expect(parseUnits("0.123456789", 9)).toBe(123456789n);
		expect(formatUnits(123456789n, 9)).toBe("0.123456789");

		expect(parseUnits("0.123456789012345678", 18)).toBe(123456789012345678n);
		expect(formatUnits(123456789012345678n, 18)).toBe("0.123456789012345678");
	});

	test("handles all decimal places (0-18)", () => {
		for (let decimals = 0; decimals <= 18; decimals++) {
			// Use "1" for 0 decimals, "1.5" for others
			const value = decimals === 0 ? "1" : "1.5";
			const parsed = parseUnits(value, decimals);
			const formatted = formatUnits(parsed, decimals);
			expect(formatted).toBe(value);
		}
	});

	test("handles all decimal places (0-9) for gwei", () => {
		for (let decimals = 0; decimals <= 9; decimals++) {
			// Use "1" for 0 decimals, "1.5" for others
			const value = decimals === 0 ? "1" : "1.5";
			const parsed = parseUnits(value, decimals);
			const formatted = formatUnits(parsed, decimals);
			expect(formatted).toBe(value);
		}
	});
});

describe("error handling", () => {
	test("clear error messages for invalid input", () => {
		try {
			parseEther("not a number");
		} catch (error) {
			expect(error).toBeInstanceOf(Error);
			expect((error as Error).message).toContain("Invalid whole part");
		}

		try {
			parseEther("1.2.3");
		} catch (error) {
			expect(error).toBeInstanceOf(Error);
			expect((error as Error).message).toContain("multiple decimal points");
		}

		try {
			parseEther("1.0000000000000000001");
		} catch (error) {
			expect(error).toBeInstanceOf(Error);
			expect((error as Error).message).toContain("Too many decimal places");
		}
	});

	test("validates decimal parameter range", () => {
		expect(() => formatUnits(1n, -1)).toThrow();
		expect(() => formatUnits(1n, 78)).toThrow();
		expect(() => parseUnits("1", -1)).toThrow();
		expect(() => parseUnits("1", 78)).toThrow();
	});
});
