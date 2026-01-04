import { describe, expect, it } from "vitest";
import { WEI_PER_ETHER } from "./wei-constants.js";
import { from } from "./wei-from.js";
import { toEther } from "./wei-toEther.js";

describe("toEther", () => {
	it("converts 1 Ether worth of Wei to Ether", () => {
		const wei = from(WEI_PER_ETHER);
		const ether = toEther(wei);
		expect(ether).toBe("1");
	});

	it("converts 0 Wei to 0 Ether", () => {
		const wei = from(0);
		const ether = toEther(wei);
		expect(ether).toBe("0");
	});

	it("converts 2 Ether worth of Wei to Ether", () => {
		const wei = from(2_000_000_000_000_000_000n);
		const ether = toEther(wei);
		expect(ether).toBe("2");
	});

	it("converts large Wei value to Ether", () => {
		const wei = from(1_000_000n * WEI_PER_ETHER);
		const ether = toEther(wei);
		expect(ether).toBe("1000000");
	});

	it("preserves fractional Ether as decimal string", () => {
		const wei = from(1_500_000_000_000_000_000n); // 1.5 ETH
		const ether = toEther(wei);
		expect(ether).toBe("1.5");
	});

	it("maintains precision for exact conversions", () => {
		const wei = from(123n * WEI_PER_ETHER);
		const ether = toEther(wei);
		expect(ether).toBe("123");
	});

	// Issue #115: Precision loss for large values
	// These tests verify that string-based conversion preserves full precision
	// for values that would lose precision with floating-point Number conversion

	it("preserves precision for values exceeding Number.MAX_SAFE_INTEGER", () => {
		// 9007199254740993 wei = just above MAX_SAFE_INTEGER (2^53 - 1)
		const wei = from(9007199254740993n);
		const ether = toEther(wei);
		expect(ether).toBe("0.009007199254740993");
	});

	it("preserves precision for very large ETH amounts", () => {
		// 1 billion ETH with full wei precision
		const wei = from(1_000_000_000n * WEI_PER_ETHER + 123456789012345678n);
		const ether = toEther(wei);
		expect(ether).toBe("1000000000.123456789012345678");
	});

	it("preserves precision for max uint256 range values", () => {
		// A very large wei value (but valid for Ethereum)
		const largeWei =
			from(
				115792089237316195423570985008687907853269984665640564039457584007913129639935n,
			);
		const ether = toEther(largeWei);
		expect(ether).toBe(
			"115792089237316195423570985008687907853269984665640564039457.584007913129639935",
		);
	});

	it("preserves exact wei value in round-trip for large values", () => {
		// Verify that 10^18 + 1 wei converts correctly (not rounded)
		const wei = from(WEI_PER_ETHER + 1n);
		const ether = toEther(wei);
		expect(ether).toBe("1.000000000000000001");
	});

	it("handles single wei precision", () => {
		const wei = from(1n);
		const ether = toEther(wei);
		expect(ether).toBe("0.000000000000000001");
	});

	it("preserves trailing non-zero decimals", () => {
		// 1.000000000000000010 ETH should keep the trailing 1
		const wei = from(1_000_000_000_000_000_010n);
		const ether = toEther(wei);
		expect(ether).toBe("1.00000000000000001");
	});
});
