import { describe, it, expect } from "vitest";
import { signextend } from "./0x0b_SIGNEXTEND.js";
import type { BrandedFrame } from "../Frame/BrandedFrame.js";

function createFrame(stack: bigint[], gasRemaining = 1000000n): BrandedFrame {
	return {
		__tag: "Frame",
		stack,
		memory: new Map(),
		memorySize: 0,
		pc: 0,
		gasRemaining,
		bytecode: new Uint8Array(),
		caller: new Uint8Array(20) as any,
		address: new Uint8Array(20) as any,
		value: 0n,
		calldata: new Uint8Array(),
		output: new Uint8Array(),
		returnData: new Uint8Array(),
		stopped: false,
		reverted: false,
		isStatic: false,
		authorized: null,
		callDepth: 0,
	};
}

describe("SIGNEXTEND (0x0b)", () => {
	it("extends positive 1-byte value (byte 0)", () => {
		// Stack: [value, byte_index] (bottom to top) -> pops byte_index, value
		const frame = createFrame([0x7fn, 0n]);
		const err = signextend(frame);

		expect(err).toBeNull();
		expect(frame.stack).toEqual([0x7fn]); // Positive, stays same
		expect(frame.pc).toBe(1);
	});

	it("extends negative 1-byte value (byte 0)", () => {
		// Stack: [value, byte_index] (bottom to top)
		const frame = createFrame([0xffn, 0n]);
		const err = signextend(frame);

		expect(err).toBeNull();
		const expected = (1n << 256n) - 1n; // All 1s = -1 in two's complement
		expect(frame.stack).toEqual([expected]);
		expect(frame.pc).toBe(1);
	});

	it("extends negative 1-byte value 0x80 (byte 0)", () => {
		// Stack: [value, byte_index] (bottom to top)
		const frame = createFrame([0x80n, 0n]);
		const err = signextend(frame);

		expect(err).toBeNull();
		// 0x80 has sign bit set, should be sign-extended to all 1s except lower bits
		const expected = (((1n << 256n) - 1n) & ~0x7fn) | 0x80n;
		expect(frame.stack).toEqual([expected]);
		expect(frame.pc).toBe(1);
	});

	it("extends positive 2-byte value (byte 1)", () => {
		// Stack: [value, byte_index] (bottom to top)
		const frame = createFrame([0x7fffn, 1n]);
		const err = signextend(frame);

		expect(err).toBeNull();
		expect(frame.stack).toEqual([0x7fffn]); // Positive, stays same
		expect(frame.pc).toBe(1);
	});

	it("extends negative 2-byte value (byte 1)", () => {
		// Stack: [value, byte_index] (bottom to top)
		const frame = createFrame([0x8000n, 1n]);
		const err = signextend(frame);

		expect(err).toBeNull();
		// Sign bit at position 15 is set, extend with 1s
		const expected = (((1n << 256n) - 1n) & ~0x7fffn) | 0x8000n;
		expect(frame.stack).toEqual([expected]);
		expect(frame.pc).toBe(1);
	});

	it("extends negative 2-byte value 0xFFFF (byte 1)", () => {
		// Stack: [value, byte_index] (bottom to top)
		const frame = createFrame([0xffffn, 1n]);
		const err = signextend(frame);

		expect(err).toBeNull();
		const expected = (1n << 256n) - 1n; // All 1s
		expect(frame.stack).toEqual([expected]);
		expect(frame.pc).toBe(1);
	});

	it("extends value with byte index 0 and value 0x12", () => {
		// Stack: [value, byte_index] (bottom to top)
		const frame = createFrame([0x12n, 0n]);
		const err = signextend(frame);

		expect(err).toBeNull();
		expect(frame.stack).toEqual([0x12n]); // Positive, no extension needed
		expect(frame.pc).toBe(1);
	});

	it("handles byte index 31 (no extension needed)", () => {
		const MAX_U256 = (1n << 256n) - 1n;
		// Stack: [value, byte_index] (bottom to top)
		const frame = createFrame([MAX_U256, 31n]);
		const err = signextend(frame);

		expect(err).toBeNull();
		expect(frame.stack).toEqual([MAX_U256]); // No change for byte 31
		expect(frame.pc).toBe(1);
	});

	it("handles byte index > 31 (no extension needed)", () => {
		// Stack: [value, byte_index] (bottom to top)
		const frame = createFrame([0xffn, 32n]);
		const err = signextend(frame);

		expect(err).toBeNull();
		expect(frame.stack).toEqual([0xffn]); // No change for byte >= 31
		expect(frame.pc).toBe(1);
	});

	it("handles byte index 30", () => {
		// Byte 30 means sign bit at position 30*8+7 = 247
		const value = 1n << 247n; // Sign bit set
		// Stack: [value, byte_index] (bottom to top)
		const frame = createFrame([value, 30n]);
		const err = signextend(frame);

		expect(err).toBeNull();
		// Should extend with 1s above bit 247
		const mask = (1n << 248n) - 1n;
		const expected = (((1n << 256n) - 1n) & ~mask) | value;
		expect(frame.stack).toEqual([expected]);
		expect(frame.pc).toBe(1);
	});

	it("clears upper bits when sign bit is 0", () => {
		// Stack: [value, byte_index] (bottom to top)
		const frame = createFrame([0x123n, 0n]);
		const err = signextend(frame);

		expect(err).toBeNull();
		expect(frame.stack).toEqual([0x23n]); // Clear bit 8, keep lower 8 bits
		expect(frame.pc).toBe(1);
	});

	it("handles zero value", () => {
		const frame = createFrame([0n, 0n]);
		const err = signextend(frame);

		expect(err).toBeNull();
		expect(frame.stack).toEqual([0n]);
		expect(frame.pc).toBe(1);
	});

	it("handles byte index 15 (16-byte value)", () => {
		const value = (1n << 127n) | 0xffffn; // Sign bit set at position 127
		// Stack: [value, byte_index] (bottom to top)
		const frame = createFrame([value, 15n]);
		const err = signextend(frame);

		expect(err).toBeNull();
		// Should sign-extend from bit 127
		const mask = (1n << 128n) - 1n;
		const expected = (((1n << 256n) - 1n) & ~mask) | value;
		expect(frame.stack).toEqual([expected]);
		expect(frame.pc).toBe(1);
	});

	it("handles positive value at byte boundary", () => {
		// Value with sign bit clear at byte 3
		// Stack: [value, byte_index] (bottom to top)
		const frame = createFrame([0x7fffffffn, 3n]);
		const err = signextend(frame);

		expect(err).toBeNull();
		expect(frame.stack).toEqual([0x7fffffffn]); // Positive, no extension
		expect(frame.pc).toBe(1);
	});

	it("handles negative value at byte boundary", () => {
		// Value with sign bit set at byte 3
		// Stack: [value, byte_index] (bottom to top)
		const frame = createFrame([0x80000000n, 3n]);
		const err = signextend(frame);

		expect(err).toBeNull();
		// Sign extend from bit 31
		const mask = (1n << 32n) - 1n;
		const expected = (((1n << 256n) - 1n) & ~mask) | 0x80000000n;
		expect(frame.stack).toEqual([expected]);
		expect(frame.pc).toBe(1);
	});

	it("returns StackUnderflow when stack has less than 2 items", () => {
		const frame = createFrame([0n]);
		const err = signextend(frame);

		expect(err).toEqual({ type: "StackUnderflow" });
		expect(frame.pc).toBe(0);
	});

	it("returns OutOfGas when insufficient gas", () => {
		// Stack: [value, byte_index] (bottom to top)
		const frame = createFrame([0x7fn, 0n], 4n);
		const err = signextend(frame);

		expect(err).toEqual({ type: "OutOfGas" });
		expect(frame.gasRemaining).toBe(0n);
		expect(frame.pc).toBe(0);
	});

	it("consumes correct gas amount (5)", () => {
		// Stack: [value, byte_index] (bottom to top)
		const frame = createFrame([0x7fn, 0n], 100n);
		const err = signextend(frame);

		expect(err).toBeNull();
		expect(frame.gasRemaining).toBe(95n);
	});

	it("handles large byte index value", () => {
		// Stack: [value, byte_index] (bottom to top)
		const frame = createFrame([0xffn, 1000n]);
		const err = signextend(frame);

		expect(err).toBeNull();
		expect(frame.stack).toEqual([0xffn]); // No change for very large byte index
		expect(frame.pc).toBe(1);
	});

	it("verifies result is always 256-bit", () => {
		// Stack: [value, byte_index] (bottom to top)
		const frame = createFrame([0xffn, 0n]);
		const err = signextend(frame);

		expect(err).toBeNull();
		const result = frame.stack[0];
		// Verify result fits in 256 bits
		expect(result).toBeLessThan(1n << 256n);
	});
});
