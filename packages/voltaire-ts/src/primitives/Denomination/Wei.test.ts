import { describe, expect, it } from "vitest";
import { Ether, Gwei, Wei } from "./index.js";

describe("Wei", () => {
	it("creates Wei from bigint", () => {
		const wei = Wei(1000n);
		expect(wei).toBe(1000n);
	});

	it("creates Wei from number", () => {
		const wei = Wei(1000);
		expect(wei).toBe(1000n);
	});

	it("creates Wei from string", () => {
		const wei = Wei("1000");
		expect(wei).toBe(1000n);
	});

	it("converts Wei to Gwei", () => {
		const wei = Wei(1_000_000_000n);
		const gwei = Wei.toGwei(wei);
		expect(gwei).toBe(1n);
	});

	it("converts Wei to Ether", () => {
		const wei = Wei(1_000_000_000_000_000_000n);
		const ether = Wei.toEther(wei);
		expect(ether).toBe("1"); // Ether is a string type to support decimals
	});

	describe("fromEther", () => {
		it("converts 1 Ether to Wei", () => {
			const ether = Ether("1");
			const wei = Wei.fromEther(ether);
			expect(wei).toBe(1_000_000_000_000_000_000n);
		});

		it("converts decimal string 1.5 ETH to Wei", () => {
			const ether = Ether("1.5");
			const wei = Wei.fromEther(ether);
			expect(wei).toBe(1_500_000_000_000_000_000n);
		});

		it("converts decimal string 0.001 ETH to Wei", () => {
			const ether = Ether("0.001");
			const wei = Wei.fromEther(ether);
			expect(wei).toBe(1_000_000_000_000_000n);
		});

		it("converts 18 decimal places", () => {
			const ether = Ether("1.000000000000000001");
			const wei = Wei.fromEther(ether);
			expect(wei).toBe(1_000_000_000_000_000_001n);
		});

		it("converts small decimal 0.000000000000000001 ETH (1 wei)", () => {
			const ether = Ether("0.000000000000000001");
			const wei = Wei.fromEther(ether);
			expect(wei).toBe(1n);
		});

		it("converts 0 Ether to 0 Wei", () => {
			const ether = Ether("0");
			const wei = Wei.fromEther(ether);
			expect(wei).toBe(0n);
		});

		it("throws for more than 18 decimal places", () => {
			const ether = Ether("1.0000000000000000001");
			expect(() => Wei.fromEther(ether)).toThrow("too many decimal places");
		});
	});
});

// Type tests - these just need to compile
function _typeTests() {
	// Wei is usable as both a type and a constructor
	const _wei: Wei = Wei(100n);

	// Gwei type should be distinct from Wei
	const gwei: Gwei = Gwei(100n);

	// @ts-expect-error - Wei and Gwei are not assignable to each other
	const _wrongAssignment: Wei = gwei;
}
