/**
 * Test file for LT (0x10) documentation examples
 * Tests examples from lt.mdx
 */
import { describe, expect, it } from "vitest";

describe("LT (0x10) - Documentation Examples", async () => {
	const { LT } = await import("../../../../src/evm/comparison/index.js");
	const { Frame } = await import("../../../../src/evm/Frame/index.js");

	function createFrame(stack: bigint[], gasRemaining = 1000000n) {
		const frame = Frame({ gas: gasRemaining });
		frame.stack = [...stack];
		return frame;
	}

	describe("Basic Comparison", () => {
		it("5 < 10 = 1 (true)", () => {
			const frame = createFrame([5n, 10n]);
			const err = LT(frame);

			expect(err).toBeNull();
			expect(frame.stack).toEqual([1n]);
		});
	});

	describe("Equal Values", () => {
		it("20 < 20 = 0 (false)", () => {
			const frame = createFrame([20n, 20n]);
			const err = LT(frame);

			expect(err).toBeNull();
			expect(frame.stack).toEqual([0n]);
		});
	});

	describe("Greater Value", () => {
		it("30 < 20 = 0 (false)", () => {
			const frame = createFrame([30n, 20n]);
			const err = LT(frame);

			expect(err).toBeNull();
			expect(frame.stack).toEqual([0n]);
		});
	});

	describe("Zero Comparison", () => {
		it("0 < 1 = 1 (true)", () => {
			const frame = createFrame([0n, 1n]);
			LT(frame);
			expect(frame.stack).toEqual([1n]);
		});

		it("1 < 0 = 0 (false)", () => {
			const frame = createFrame([1n, 0n]);
			LT(frame);
			expect(frame.stack).toEqual([0n]);
		});
	});

	describe("Maximum Values", () => {
		it("(MAX - 1) < MAX = 1 (true)", () => {
			const MAX = (1n << 256n) - 1n;
			const frame = createFrame([MAX - 1n, MAX]);
			LT(frame);

			expect(frame.stack).toEqual([1n]);
		});
	});

	describe("Unsigned Treatment", () => {
		it("1 < 2^255 = 1 (true, unsigned)", () => {
			const SIGN_BIT = 1n << 255n;
			const frame = createFrame([1n, SIGN_BIT]);
			LT(frame);

			expect(frame.stack).toEqual([1n]);
		});
	});

	describe("Edge Cases", () => {
		it("MAX < 0 = 0", () => {
			const MAX = (1n << 256n) - 1n;
			const frame = createFrame([MAX, 0n]);
			LT(frame);
			expect(frame.stack).toEqual([0n]);
		});

		it("0 < MAX = 1", () => {
			const MAX = (1n << 256n) - 1n;
			const frame = createFrame([0n, MAX]);
			LT(frame);
			expect(frame.stack).toEqual([1n]);
		});

		it("MAX < MAX = 0", () => {
			const MAX = (1n << 256n) - 1n;
			const frame = createFrame([MAX, MAX]);
			LT(frame);
			expect(frame.stack).toEqual([0n]);
		});

		it("returns StackUnderflow with insufficient stack", () => {
			const frame = createFrame([5n]);
			const err = LT(frame);

			expect(err).toEqual({ type: "StackUnderflow" });
		});

		it("returns OutOfGas when insufficient gas", () => {
			const frame = createFrame([5n, 10n], 2n);
			const err = LT(frame);

			expect(err).toEqual({ type: "OutOfGas" });
			expect(frame.gasRemaining).toBe(0n);
		});
	});

	describe("Gas Cost", () => {
		it("consumes 3 gas (GasFastestStep)", () => {
			const frame = createFrame([5n, 10n], 100n);
			const err = LT(frame);

			expect(err).toBeNull();
			expect(frame.gasRemaining).toBe(97n);
		});
	});
});
