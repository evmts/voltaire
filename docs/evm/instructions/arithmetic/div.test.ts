/**
 * Test file for DIV (0x04) documentation examples
 * Tests examples from div.mdx
 *
 * NOTE: Stack order is [bottom, ..., top] - pop() returns the last element.
 * For DIV(a, b): a is popped first (dividend), b second (divisor). Result = a / b.
 * So for a / b, stack should be [b, a].
 */
import { describe, expect, it } from "vitest";

describe("DIV (0x04) - Documentation Examples", async () => {
	const { div } = await import("../../../../src/evm/arithmetic/index.js");
	const { Frame } = await import("../../../../src/evm/Frame/index.js");

	function createFrame(stack: bigint[], gasRemaining = 1000000n) {
		const frame = Frame({ gas: gasRemaining });
		frame.stack = [...stack];
		return frame;
	}

	describe("Basic Division", () => {
		it("10 / 2 = 5", () => {
			const frame = createFrame([2n, 10n]);
			const err = div(frame);

			expect(err).toBeNull();
			expect(frame.stack).toEqual([5n]);
		});
	});

	describe("Division with Remainder", () => {
		it("10 / 3 = 3 (remainder discarded)", () => {
			const frame = createFrame([3n, 10n]);
			const err = div(frame);

			expect(err).toBeNull();
			expect(frame.stack).toEqual([3n]);
		});
	});

	describe("Division by Zero", () => {
		it("42 / 0 = 0 (no exception)", () => {
			const frame = createFrame([0n, 42n]);
			const err = div(frame);

			expect(err).toBeNull();
			expect(frame.stack).toEqual([0n]);
		});
	});

	describe("Division by One", () => {
		it("n / 1 = n (identity)", () => {
			const frame = createFrame([1n, 42n]);
			const err = div(frame);

			expect(err).toBeNull();
			expect(frame.stack).toEqual([42n]);
		});
	});

	describe("Large Division", () => {
		it("MAX / 2 = floor(MAX / 2)", () => {
			const MAX = (1n << 256n) - 1n;
			const frame = createFrame([2n, MAX]);
			const err = div(frame);

			expect(err).toBeNull();
			expect(frame.stack).toEqual([(MAX - 1n) / 2n]);
		});
	});

	describe("Edge Cases", () => {
		it("0 / 0 = 0 (special case)", () => {
			const frame = createFrame([0n, 0n]);
			div(frame);

			expect(frame.stack).toEqual([0n]);
		});

		it("n / n = 1 (self-division)", () => {
			const frame = createFrame([42n, 42n]);
			div(frame);

			expect(frame.stack).toEqual([1n]);
		});

		it("MAX / MAX = 1", () => {
			const MAX = (1n << 256n) - 1n;
			const frame = createFrame([MAX, MAX]);
			div(frame);

			expect(frame.stack).toEqual([1n]);
		});

		it("truncates toward zero", () => {
			// 10/3 = 3
			const frame1 = createFrame([3n, 10n]);
			div(frame1);
			expect(frame1.stack).toEqual([3n]);

			// 100/9 = 11
			const frame2 = createFrame([9n, 100n]);
			div(frame2);
			expect(frame2.stack).toEqual([11n]);

			// 7/2 = 3
			const frame3 = createFrame([2n, 7n]);
			div(frame3);
			expect(frame3.stack).toEqual([3n]);
		});
	});

	describe("Gas Cost", () => {
		it("consumes 5 gas (GasFastStep)", () => {
			const frame = createFrame([2n, 10n], 100n);
			const err = div(frame);

			expect(err).toBeNull();
			expect(frame.gasRemaining).toBe(95n);
		});
	});
});
