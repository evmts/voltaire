/**
 * Test file for OR (0x17) documentation examples
 * Tests examples from or.mdx
 */
import { describe, expect, it } from "vitest";

describe("OR (0x17) - Documentation Examples", async () => {
	const { OR } = await import("../../../../src/evm/bitwise/index.js");
	const { Frame } = await import("../../../../src/evm/Frame/index.js");

	function createFrame(stack: bigint[], gasRemaining = 1000000n) {
		const frame = Frame({ gas: gasRemaining });
		frame.stack = [...stack];
		return frame;
	}

	describe("Set Multiple Flags", () => {
		it("combines flag bits", () => {
			const existing = 0b0000n;
			const flags = 0b0101n;
			const frame = createFrame([existing, flags]);
			const err = OR(frame);

			expect(err).toBeNull();
			expect(frame.stack).toEqual([0b0101n]);
		});
	});

	describe("Truth Table", () => {
		it("follows OR truth table", () => {
			const frame = createFrame([0b1100n, 0b1010n]);
			OR(frame);
			expect(frame.stack).toEqual([0b1110n]);
		});
	});

	describe("Identity Element", () => {
		it("OR with zero returns original", () => {
			const value = 0x123456n;
			const frame = createFrame([value, 0n]);
			OR(frame);

			expect(frame.stack).toEqual([value]);
		});
	});

	describe("Null Element", () => {
		it("OR with all ones returns all ones", () => {
			const MAX = (1n << 256n) - 1n;
			const value = 0x123456n;
			const frame = createFrame([value, MAX]);
			OR(frame);

			expect(frame.stack).toEqual([MAX]);
		});
	});

	describe("Idempotent Property", () => {
		it("a OR a = a", () => {
			const value = 0x123456n;
			const frame = createFrame([value, value]);
			OR(frame);

			expect(frame.stack).toEqual([value]);
		});
	});

	describe("Commutative Property", () => {
		it("a OR b = b OR a", () => {
			const a = 0xaaaan;
			const b = 0x5555n;
			const frame1 = createFrame([a, b]);
			OR(frame1);

			const frame2 = createFrame([b, a]);
			OR(frame2);

			expect(frame1.stack[0]).toBe(frame2.stack[0]);
		});
	});

	describe("Edge Cases", () => {
		it("complementary values OR to all ones", () => {
			const MAX = (1n << 256n) - 1n;
			const value = 0x123456789abcdef0n;
			const complement = MAX ^ value; // True complement
			const frame = createFrame([value, complement]);
			OR(frame);

			expect(frame.stack).toEqual([MAX]);
		});

		it("returns StackUnderflow with insufficient stack", () => {
			const frame = createFrame([0x123n]);
			const err = OR(frame);

			expect(err).toEqual({ type: "StackUnderflow" });
		});

		it("returns OutOfGas when insufficient gas", () => {
			const frame = createFrame([0x123n, 0x456n], 2n);
			const err = OR(frame);

			expect(err).toEqual({ type: "OutOfGas" });
			expect(frame.gasRemaining).toBe(0n);
		});
	});

	describe("Gas Cost", () => {
		it("consumes 3 gas (GasFastestStep)", () => {
			const frame = createFrame([0x123n, 0x456n], 100n);
			const err = OR(frame);

			expect(err).toBeNull();
			expect(frame.gasRemaining).toBe(97n);
		});
	});
});
