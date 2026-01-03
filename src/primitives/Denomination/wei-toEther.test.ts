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

	// Issue #115: Precision tests for very large values
	// These tests verify no floating point is used (pure bigint math)

	it("preserves full precision for 1 wei (smallest unit)", () => {
		const wei = from(1n);
		const ether = toEther(wei);
		expect(ether).toBe("0.000000000000000001");
	});

	it("preserves full 18 decimal precision", () => {
		const wei = from(1234567890123456789n);
		const ether = toEther(wei);
		expect(ether).toBe("1.234567890123456789");
	});

	it("preserves precision for very large values (10^50 wei)", () => {
		const wei = from(10n ** 50n);
		const ether = toEther(wei);
		// 10^50 wei = 10^32 ether (no decimal)
		expect(ether).toBe("100000000000000000000000000000000");
	});

	it("preserves precision for max U256 value", () => {
		const maxU256 = 2n ** 256n - 1n;
		const wei = from(maxU256);
		const ether = toEther(wei);
		// Full precision: 115792089237316195423570985008687907853269984665640564039457.584007913129639935
		expect(ether).toBe(
			"115792089237316195423570985008687907853269984665640564039457.584007913129639935",
		);
	});

	it("preserves precision for large value with full decimal precision", () => {
		// 123456789012345678901234567890 wei
		const wei = from(123456789012345678901234567890n);
		const ether = toEther(wei);
		expect(ether).toBe("123456789012.34567890123456789");
	});

	it("handles value just above 1 ether", () => {
		const wei = from(WEI_PER_ETHER + 1n);
		const ether = toEther(wei);
		expect(ether).toBe("1.000000000000000001");
	});

	it("handles value just below 1 ether", () => {
		const wei = from(WEI_PER_ETHER - 1n);
		const ether = toEther(wei);
		expect(ether).toBe("0.999999999999999999");
	});

	it("handles trailing zeros correctly", () => {
		const wei = from(1_000_000_000_000_000_000_000n); // 1000 ETH
		const ether = toEther(wei);
		expect(ether).toBe("1000");
	});

	it("handles mixed precision correctly", () => {
		const wei = from(1_500_000_000_000_000_001n); // 1.500000000000000001 ETH
		const ether = toEther(wei);
		expect(ether).toBe("1.500000000000000001");
	});
});
