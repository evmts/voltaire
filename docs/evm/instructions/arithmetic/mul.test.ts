/**
 * Test file for MUL (0x02) documentation examples
 * Tests examples from mul.mdx
 */
import { describe, expect, it } from "vitest";

describe("MUL (0x02) - Documentation Examples", async () => {
	const { mul } = await import("../../../../src/evm/arithmetic/index.js");
	const { Frame } = await import("../../../../src/evm/Frame/index.js");

	function createFrame(stack: bigint[], gasRemaining = 1000000n) {
		const frame = Frame({ gas: gasRemaining });
		frame.stack = [...stack];
		return frame;
	}

	describe("Basic Multiplication", () => {
		it("5 * 10 = 50", () => {
			const frame = createFrame([5n, 10n]);
			const err = mul(frame);

			expect(err).toBeNull();
			expect(frame.stack).toEqual([50n]);
		});
	});

	describe("Overflow Truncation", () => {
		it("MAX * 2 truncates to MAX - 1", () => {
			const MAX = (1n << 256n) - 1n;
			const frame = createFrame([MAX, 2n]);
			const err = mul(frame);

			expect(err).toBeNull();
			// (MAX * 2) mod 2^256 = 2^256 - 2 = MAX - 1
			expect(frame.stack).toEqual([MAX - 1n]);
		});
	});

	describe("Powers of Two", () => {
		it("15 * 2 = 30 (0x0F * 2 = 0x1E)", () => {
			const frame = createFrame([0x0fn, 2n]);
			const err = mul(frame);

			expect(err).toBeNull();
			expect(frame.stack).toEqual([0x1en]);
		});
	});

	describe("Identity Element", () => {
		it("42 * 1 = 42", () => {
			const frame = createFrame([42n, 1n]);
			const err = mul(frame);

			expect(err).toBeNull();
			expect(frame.stack).toEqual([42n]);
		});
	});

	describe("Zero Element", () => {
		it("42 * 0 = 0", () => {
			const frame = createFrame([42n, 0n]);
			const err = mul(frame);

			expect(err).toBeNull();
			expect(frame.stack).toEqual([0n]);
		});
	});

	describe("Edge Cases", () => {
		it("MAX * MAX = 1 (massive overflow)", () => {
			const MAX = (1n << 256n) - 1n;
			const frame = createFrame([MAX, MAX]);
			mul(frame);

			// (2^256-1)^2 mod 2^256 = 1
			expect(frame.stack).toEqual([1n]);
		});

		it("12 * 12 = 144 (squaring)", () => {
			const frame = createFrame([12n, 12n]);
			mul(frame);

			expect(frame.stack).toEqual([144n]);
		});

		it("100 * 1024 = 102400 (power of two scaling)", () => {
			const frame = createFrame([100n, 1n << 10n]);
			mul(frame);

			expect(frame.stack).toEqual([102400n]);
		});

		it("returns StackUnderflow with insufficient stack", () => {
			const frame = createFrame([5n]);
			const err = mul(frame);

			expect(err).toEqual({ type: "StackUnderflow" });
		});
	});

	describe("Gas Cost", () => {
		it("consumes 5 gas (GasFastStep)", () => {
			const frame = createFrame([5n, 10n], 100n);
			const err = mul(frame);

			expect(err).toBeNull();
			expect(frame.gasRemaining).toBe(95n);
		});
	});
});
