/**
 * Test file for BYTE (0x1a) documentation examples
 * Tests examples from byte.mdx
 *
 * NOTE: Stack order is [bottom, ..., top] - pop() returns the last element.
 * For BYTE(i, x): stack should be [x, i] so pop() returns i first, then x.
 */
import { describe, expect, it } from "vitest";

describe("BYTE (0x1a) - Documentation Examples", async () => {
	const { BYTE } = await import("../../../../src/evm/bitwise/index.js");
	const { Frame } = await import("../../../../src/evm/Frame/index.js");

	function createFrame(stack: bigint[], gasRemaining = 1000000n) {
		const frame = Frame({ gas: gasRemaining });
		frame.stack = [...stack];
		return frame;
	}

	describe("Extract MSB (byte 0)", () => {
		it("extracts most significant byte", () => {
			const value =
				0xff00000000000000000000000000000000000000000000000000000000000000n;
			// Stack: [value, i] - pop gives i=0n first, then value
			const frame = createFrame([value, 0n]);
			const err = BYTE(frame);

			expect(err).toBeNull();
			expect(frame.stack).toEqual([0xffn]);
		});
	});

	describe("Extract LSB (byte 31)", () => {
		it("extracts least significant byte", () => {
			const value =
				0x00000000000000000000000000000000000000000000000000000000000000ffn;
			const frame = createFrame([value, 31n]);
			BYTE(frame);

			expect(frame.stack).toEqual([0xffn]);
		});
	});

	describe("Extract Middle Byte", () => {
		it("extracts byte at index 15", () => {
			const value =
				0x000000000000000000000000000000ab00000000000000000000000000000000n;
			const frame = createFrame([value, 15n]);
			BYTE(frame);

			expect(frame.stack).toEqual([0xabn]);
		});
	});

	describe("Index Out of Range", () => {
		it("index >= 32 returns 0", () => {
			const value = 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn;
			const frame = createFrame([value, 32n]);
			BYTE(frame);

			expect(frame.stack).toEqual([0n]);
		});

		it("large index returns 0", () => {
			const value = 0x123456n;
			const frame = createFrame([value, 1000n]);
			BYTE(frame);

			expect(frame.stack).toEqual([0n]);
		});
	});

	describe("Zero Value", () => {
		it("all bytes are 0 from zero value", () => {
			const frame = createFrame([0n, 15n]);
			BYTE(frame);

			expect(frame.stack).toEqual([0n]);
		});
	});

	describe("Maximum Value", () => {
		it("all bytes are 0xFF from MAX", () => {
			const MAX = (1n << 256n) - 1n;
			for (let i = 0; i < 32; i++) {
				const frame = createFrame([MAX, BigInt(i)]);
				BYTE(frame);
				expect(frame.stack).toEqual([0xffn]);
			}
		});
	});

	describe("Iterating Through Bytes", () => {
		it("extracts correct bytes from value", () => {
			// Value with distinct bytes at the end
			const value = 0x0123456789abcdefn;
			// This is 8 bytes, so they occupy bytes 24-31

			const frame24 = createFrame([value, 24n]);
			BYTE(frame24);
			expect(frame24.stack).toEqual([0x01n]);

			const frame25 = createFrame([value, 25n]);
			BYTE(frame25);
			expect(frame25.stack).toEqual([0x23n]);

			const frame31 = createFrame([value, 31n]);
			BYTE(frame31);
			expect(frame31.stack).toEqual([0xefn]);
		});
	});

	describe("Edge Cases", () => {
		it("returns StackUnderflow with insufficient stack", () => {
			const frame = createFrame([5n]);
			const err = BYTE(frame);

			expect(err).toEqual({ type: "StackUnderflow" });
		});

		it("returns OutOfGas when insufficient gas", () => {
			const frame = createFrame([0x123n, 5n], 2n);
			const err = BYTE(frame);

			expect(err).toEqual({ type: "OutOfGas" });
			expect(frame.gasRemaining).toBe(0n);
		});
	});

	describe("Gas Cost", () => {
		it("consumes 3 gas (GasFastestStep)", () => {
			const frame = createFrame([0x123n, 5n], 100n);
			const err = BYTE(frame);

			expect(err).toBeNull();
			expect(frame.gasRemaining).toBe(97n);
		});
	});
});
