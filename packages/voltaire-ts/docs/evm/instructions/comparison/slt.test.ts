/**
 * Test file for SLT (0x12) documentation examples
 * Tests examples from slt.mdx
 */
import { describe, expect, it } from "vitest";

describe("SLT (0x12) - Documentation Examples", async () => {
	const { SLT } = await import("../../../../src/evm/comparison/index.js");
	const { Frame } = await import("../../../../src/evm/Frame/index.js");

	/** Convert negative bigint to two's complement 256-bit representation */
	const toSigned = (n: bigint) => (n < 0n ? (1n << 256n) + n : n);

	function createFrame(stack: bigint[], gasRemaining = 1000000n) {
		const frame = Frame({ gas: gasRemaining });
		frame.stack = [...stack];
		return frame;
	}

	describe("Positive Values", () => {
		it("10 < 20 = 1 (both positive)", () => {
			const frame = createFrame([10n, 20n]);
			const err = SLT(frame);

			expect(err).toBeNull();
			expect(frame.stack).toEqual([1n]);
		});
	});

	describe("Negative Less Than Positive", () => {
		it("-1 < 10 = 1 (true)", () => {
			const NEG_1 = toSigned(-1n);
			const frame = createFrame([NEG_1, 10n]);
			SLT(frame);

			expect(frame.stack).toEqual([1n]);
		});
	});

	describe("Positive Greater Than Negative", () => {
		it("10 < -1 = 0 (false)", () => {
			const NEG_1 = toSigned(-1n);
			const frame = createFrame([10n, NEG_1]);
			SLT(frame);

			expect(frame.stack).toEqual([0n]);
		});
	});

	describe("Negative Value Comparison", () => {
		it("-10 < -5 = 1 (true)", () => {
			const NEG_10 = toSigned(-10n);
			const NEG_5 = toSigned(-5n);
			const frame = createFrame([NEG_10, NEG_5]);
			SLT(frame);

			expect(frame.stack).toEqual([1n]);
		});
	});

	describe("Zero Boundary", () => {
		it("-1 < 0 = 1 (true)", () => {
			const NEG_1 = toSigned(-1n);
			const frame = createFrame([NEG_1, 0n]);
			SLT(frame);

			expect(frame.stack).toEqual([1n]);
		});

		it("0 < 1 = 1 (true)", () => {
			const frame = createFrame([0n, 1n]);
			SLT(frame);
			expect(frame.stack).toEqual([1n]);
		});
	});

	describe("Minimum and Maximum", () => {
		it("MIN_INT256 < MAX_INT256 = 1", () => {
			const MIN_INT256 = 1n << 255n; // -2^255
			const MAX_INT256 = (1n << 255n) - 1n; // 2^255 - 1
			const frame = createFrame([MIN_INT256, MAX_INT256]);
			SLT(frame);

			expect(frame.stack).toEqual([1n]);
		});
	});

	describe("Contrast with Unsigned LT", () => {
		it("SLT: -2^255 < 1 = 1 (signed)", () => {
			const SIGN_BIT = 1n << 255n;
			const frame = createFrame([SIGN_BIT, 1n]);
			SLT(frame);
			expect(frame.stack).toEqual([1n]);
		});
	});

	describe("Edge Cases", () => {
		it("equal values return 0", () => {
			const frame = createFrame([20n, 20n]);
			SLT(frame);
			expect(frame.stack).toEqual([0n]);
		});

		it("0 > -1 (0 is not less than -1)", () => {
			const NEG_1 = toSigned(-1n);
			const frame = createFrame([0n, NEG_1]);
			SLT(frame);
			expect(frame.stack).toEqual([0n]);
		});

		it("returns StackUnderflow with insufficient stack", () => {
			const frame = createFrame([10n]);
			const err = SLT(frame);

			expect(err).toEqual({ type: "StackUnderflow" });
		});

		it("returns OutOfGas when insufficient gas", () => {
			const frame = createFrame([10n, 20n], 2n);
			const err = SLT(frame);

			expect(err).toEqual({ type: "OutOfGas" });
			expect(frame.gasRemaining).toBe(0n);
		});
	});

	describe("Gas Cost", () => {
		it("consumes 3 gas (GasFastestStep)", () => {
			const frame = createFrame([10n, 20n], 100n);
			const err = SLT(frame);

			expect(err).toBeNull();
			expect(frame.gasRemaining).toBe(97n);
		});
	});
});
