/**
 * Test file for SMOD (0x07) documentation examples
 * Tests examples from smod.mdx
 *
 * NOTE: Stack order is [bottom, ..., top] - pop() returns the last element.
 * For SMOD(a, b): a is popped first, b second. Result = a % b.
 * So for a % b, stack should be [b, a].
 */
import { describe, expect, it } from "vitest";

describe("SMOD (0x07) - Documentation Examples", async () => {
	const { smod } = await import("../../../../src/evm/arithmetic/index.js");
	const { Frame } = await import("../../../../src/evm/Frame/index.js");

	const MIN_INT = 1n << 255n;
	const MAX_UINT = (1n << 256n) - 1n;

	/** Convert negative bigint to two's complement 256-bit representation */
	const toSigned = (n: bigint) => (n < 0n ? (1n << 256n) + n : n);

	function createFrame(stack: bigint[], gasRemaining = 1000000n) {
		const frame = Frame({ gas: gasRemaining });
		frame.stack = [...stack];
		return frame;
	}

	describe("Basic Signed Modulo", () => {
		it("10 % 3 = 1", () => {
			const frame = createFrame([3n, 10n]);
			const err = smod(frame);

			expect(err).toBeNull();
			expect(frame.stack).toEqual([1n]);
		});
	});

	describe("Negative Dividend", () => {
		it("-10 % 3 = -1 (result has same sign as dividend)", () => {
			const neg10 = toSigned(-10n);
			const frame = createFrame([3n, neg10]);
			smod(frame);

			const neg1 = toSigned(-1n);
			expect(frame.stack).toEqual([neg1]);
		});
	});

	describe("Negative Modulus", () => {
		it("10 % -3 = 1 (result has sign of dividend, not modulus)", () => {
			const neg3 = toSigned(-3n);
			const frame = createFrame([neg3, 10n]);
			smod(frame);

			expect(frame.stack).toEqual([1n]);
		});
	});

	describe("Both Negative", () => {
		it("-10 % -3 = -1 (result follows dividend sign)", () => {
			const neg10 = toSigned(-10n);
			const neg3 = toSigned(-3n);
			const frame = createFrame([neg3, neg10]);
			smod(frame);

			const neg1 = toSigned(-1n);
			expect(frame.stack).toEqual([neg1]);
		});
	});

	describe("MIN_INT % -1 Edge Case", () => {
		it("MIN_INT % -1 = 0 (special case)", () => {
			const negOne = MAX_UINT; // -1 in two's complement
			const frame = createFrame([negOne, MIN_INT]);
			smod(frame);

			expect(frame.stack).toEqual([0n]);
		});
	});

	describe("Edge Cases", () => {
		it("modulo by zero returns 0", () => {
			const neg10 = toSigned(-10n);
			const frame = createFrame([0n, neg10]);
			smod(frame);

			expect(frame.stack).toEqual([0n]);
		});

		it("MIN_INT % 1 = 0", () => {
			const frame = createFrame([1n, MIN_INT]);
			smod(frame);
			expect(frame.stack).toEqual([0n]);
		});

		it("MIN_INT % MIN_INT = 0", () => {
			const frame = createFrame([MIN_INT, MIN_INT]);
			smod(frame);
			expect(frame.stack).toEqual([0n]);
		});

		it("0 % -5 = 0", () => {
			const neg5 = toSigned(-5n);
			const frame = createFrame([neg5, 0n]);
			smod(frame);

			expect(frame.stack).toEqual([0n]);
		});

		it("result sign matches dividend: -7 % 2 = -1", () => {
			const neg7 = toSigned(-7n);
			const frame = createFrame([2n, neg7]);
			smod(frame);

			const neg1 = toSigned(-1n);
			expect(frame.stack).toEqual([neg1]);
		});
	});

	describe("Gas Cost", () => {
		it("consumes 5 gas (GasFastStep)", () => {
			const frame = createFrame([3n, 10n], 100n);
			const err = smod(frame);

			expect(err).toBeNull();
			expect(frame.gasRemaining).toBe(95n);
		});
	});
});
