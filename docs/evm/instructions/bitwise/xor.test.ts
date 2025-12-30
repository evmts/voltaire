/**
 * Test file for XOR (0x18) documentation examples
 * Tests examples from xor.mdx
 */
import { describe, expect, it } from "vitest";

describe("XOR (0x18) - Documentation Examples", async () => {
	const { XOR } = await import("../../../../src/evm/bitwise/index.js");
	const { Frame } = await import("../../../../src/evm/Frame/index.js");

	function createFrame(stack: bigint[], gasRemaining = 1000000n) {
		const frame = Frame({ gas: gasRemaining });
		frame.stack = [...stack];
		return frame;
	}

	describe("Truth Table", () => {
		it("follows XOR truth table", () => {
			const frame = createFrame([0b1100n, 0b1010n]);
			XOR(frame);
			expect(frame.stack).toEqual([0b0110n]);
		});
	});

	describe("Toggle Bit", () => {
		it("toggles specific bit", () => {
			const value = 0b0000n;
			const toggle = 0b1000n;
			const frame = createFrame([value, toggle]);
			XOR(frame);

			expect(frame.stack).toEqual([0b1000n]);

			// Toggle again to clear
			const frame2 = createFrame([0b1000n, toggle]);
			XOR(frame2);
			expect(frame2.stack).toEqual([0n]);
		});
	});

	describe("Identity Element", () => {
		it("XOR with zero returns original", () => {
			const value = 0x123456n;
			const frame = createFrame([value, 0n]);
			XOR(frame);

			expect(frame.stack).toEqual([value]);
		});
	});

	describe("Self-Inverse", () => {
		it("a XOR a = 0", () => {
			const value = 0x123456n;
			const frame = createFrame([value, value]);
			XOR(frame);

			expect(frame.stack).toEqual([0n]);
		});
	});

	describe("Involution Property", () => {
		it("(a XOR b) XOR b = a", () => {
			const a = 0x123456n;
			const b = 0xabcdefn;

			const frame1 = createFrame([a, b]);
			XOR(frame1);
			const intermediate = frame1.stack[0];

			const frame2 = createFrame([intermediate, b]);
			XOR(frame2);

			expect(frame2.stack).toEqual([a]);
		});
	});

	describe("XOR as NOT", () => {
		it("XOR with all ones is equivalent to NOT", () => {
			const MAX = (1n << 256n) - 1n;
			const value = 0xaaaan;
			const frame = createFrame([value, MAX]);
			XOR(frame);

			const expected = MAX - value;
			expect(frame.stack).toEqual([expected]);
		});
	});

	describe("Commutative Property", () => {
		it("a XOR b = b XOR a", () => {
			const a = 0xaaaan;
			const b = 0x5555n;
			const frame1 = createFrame([a, b]);
			XOR(frame1);

			const frame2 = createFrame([b, a]);
			XOR(frame2);

			expect(frame1.stack[0]).toBe(frame2.stack[0]);
		});
	});

	describe("Edge Cases", () => {
		it("XOR with complement yields all ones", () => {
			const MAX = (1n << 256n) - 1n;
			const value = 0x123456789abcdef0n;
			const complement = MAX ^ value; // True complement
			const frame = createFrame([value, complement]);
			XOR(frame);

			expect(frame.stack).toEqual([MAX]);
		});

		it("returns StackUnderflow with insufficient stack", () => {
			const frame = createFrame([0x123n]);
			const err = XOR(frame);

			expect(err).toEqual({ type: "StackUnderflow" });
		});

		it("returns OutOfGas when insufficient gas", () => {
			const frame = createFrame([0x123n, 0x456n], 2n);
			const err = XOR(frame);

			expect(err).toEqual({ type: "OutOfGas" });
			expect(frame.gasRemaining).toBe(0n);
		});
	});

	describe("Gas Cost", () => {
		it("consumes 3 gas (GasFastestStep)", () => {
			const frame = createFrame([0x123n, 0x456n], 100n);
			const err = XOR(frame);

			expect(err).toBeNull();
			expect(frame.gasRemaining).toBe(97n);
		});
	});
});
