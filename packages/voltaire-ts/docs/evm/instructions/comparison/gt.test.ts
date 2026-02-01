/**
 * Test file for GT (0x11) documentation examples
 * Tests examples from gt.mdx
 */
import { describe, expect, it } from "vitest";

describe("GT (0x11) - Documentation Examples", async () => {
	const { GT } = await import("../../../../src/evm/comparison/index.js");
	const { Frame } = await import("../../../../src/evm/Frame/index.js");

	function createFrame(stack: bigint[], gasRemaining = 1000000n) {
		const frame = Frame({ gas: gasRemaining });
		frame.stack = [...stack];
		return frame;
	}

	describe("Basic Comparison", () => {
		it("10 > 5 = 1 (true)", () => {
			const frame = createFrame([10n, 5n]);
			const err = GT(frame);

			expect(err).toBeNull();
			expect(frame.stack).toEqual([1n]);
		});
	});

	describe("Equal Values", () => {
		it("20 > 20 = 0 (false)", () => {
			const frame = createFrame([20n, 20n]);
			const err = GT(frame);

			expect(err).toBeNull();
			expect(frame.stack).toEqual([0n]);
		});
	});

	describe("Lesser Value", () => {
		it("20 > 30 = 0 (false)", () => {
			const frame = createFrame([20n, 30n]);
			const err = GT(frame);

			expect(err).toBeNull();
			expect(frame.stack).toEqual([0n]);
		});
	});

	describe("Zero Comparison", () => {
		it("1 > 0 = 1 (true)", () => {
			const frame = createFrame([1n, 0n]);
			GT(frame);
			expect(frame.stack).toEqual([1n]);
		});

		it("0 > 1 = 0 (false)", () => {
			const frame = createFrame([0n, 1n]);
			GT(frame);
			expect(frame.stack).toEqual([0n]);
		});
	});

	describe("Maximum Values", () => {
		it("MAX > (MAX - 1) = 1 (true)", () => {
			const MAX = (1n << 256n) - 1n;
			const frame = createFrame([MAX, MAX - 1n]);
			GT(frame);

			expect(frame.stack).toEqual([1n]);
		});
	});

	describe("Unsigned Treatment", () => {
		it("2^255 > 1 = 1 (true, unsigned)", () => {
			const SIGN_BIT = 1n << 255n;
			const frame = createFrame([SIGN_BIT, 1n]);
			GT(frame);

			expect(frame.stack).toEqual([1n]);
		});
	});

	describe("Edge Cases", () => {
		it("MAX > 0 = 1", () => {
			const MAX = (1n << 256n) - 1n;
			const frame = createFrame([MAX, 0n]);
			GT(frame);
			expect(frame.stack).toEqual([1n]);
		});

		it("0 > MAX = 0", () => {
			const MAX = (1n << 256n) - 1n;
			const frame = createFrame([0n, MAX]);
			GT(frame);
			expect(frame.stack).toEqual([0n]);
		});

		it("MAX > MAX = 0", () => {
			const MAX = (1n << 256n) - 1n;
			const frame = createFrame([MAX, MAX]);
			GT(frame);
			expect(frame.stack).toEqual([0n]);
		});

		it("returns StackUnderflow with insufficient stack", () => {
			const frame = createFrame([5n]);
			const err = GT(frame);

			expect(err).toEqual({ type: "StackUnderflow" });
		});

		it("returns OutOfGas when insufficient gas", () => {
			const frame = createFrame([10n, 5n], 2n);
			const err = GT(frame);

			expect(err).toEqual({ type: "OutOfGas" });
			expect(frame.gasRemaining).toBe(0n);
		});
	});

	describe("Gas Cost", () => {
		it("consumes 3 gas (GasFastestStep)", () => {
			const frame = createFrame([10n, 5n], 100n);
			const err = GT(frame);

			expect(err).toBeNull();
			expect(frame.gasRemaining).toBe(97n);
		});
	});
});
