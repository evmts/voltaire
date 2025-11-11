import { describe, expect, it } from "vitest";
import type { BrandedFrame } from "../Frame/BrandedFrame.js";
import { handle as GT } from "./0x11_GT.js";

/**
 * Create a minimal test frame
 */
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

describe("GT opcode (0x11)", () => {
	it("returns 1 when a > b", () => {
		const frame = createFrame([30n, 20n], 1000n);

		const err = GT(frame);

		expect(err).toBe(null);
		expect(frame.stack).toEqual([1n]);
		expect(frame.pc).toBe(1);
		expect(frame.gasRemaining).toBe(997n);
	});

	it("returns 0 when a <= b (equal)", () => {
		const frame = createFrame([20n, 20n], 1000n);

		const err = GT(frame);

		expect(err).toBe(null);
		expect(frame.stack).toEqual([0n]);
		expect(frame.pc).toBe(1);
		expect(frame.gasRemaining).toBe(997n);
	});

	it("returns 0 when a < b", () => {
		const frame = createFrame([10n, 20n], 1000n);

		const err = GT(frame);

		expect(err).toBe(null);
		expect(frame.stack).toEqual([0n]);
		expect(frame.pc).toBe(1);
		expect(frame.gasRemaining).toBe(997n);
	});

	it("handles 1 > 0", () => {
		const frame = createFrame([1n, 0n], 1000n);

		const err = GT(frame);

		expect(err).toBe(null);
		expect(frame.stack).toEqual([1n]);
	});

	it("handles 0 > 1", () => {
		const frame = createFrame([0n, 1n], 1000n);

		const err = GT(frame);

		expect(err).toBe(null);
		expect(frame.stack).toEqual([0n]);
	});

	it("handles max uint256 values", () => {
		const MAX_UINT256 = (1n << 256n) - 1n;
		const frame = createFrame([MAX_UINT256, MAX_UINT256 - 1n], 1000n);

		const err = GT(frame);

		expect(err).toBe(null);
		expect(frame.stack).toEqual([1n]);
	});

	it("treats all values as unsigned", () => {
		// 2^255 is large positive as unsigned
		const SIGN_BIT = 1n << 255n;
		const frame = createFrame([SIGN_BIT, 1n], 1000n);

		const err = GT(frame);

		expect(err).toBe(null);
		expect(frame.stack).toEqual([1n]); // 2^255 > 1 (unsigned)
	});

	it("returns StackUnderflow when stack has < 2 items", () => {
		const frame = createFrame([10n], 1000n);

		const err = GT(frame);

		expect(err).toEqual({ type: "StackUnderflow" });
	});

	it("returns OutOfGas when insufficient gas", () => {
		const frame = createFrame([10n, 20n], 2n);

		const err = GT(frame);

		expect(err).toEqual({ type: "OutOfGas" });
		expect(frame.gasRemaining).toBe(0n);
	});

	it("handles large value comparisons", () => {
		const a = 987654321098765432109876543210n;
		const b = 123456789012345678901234567890n;

		const frame = createFrame([a, b], 1000n);

		const err = GT(frame);

		expect(err).toBe(null);
		expect(frame.stack).toEqual([1n]); // a > b
	});

	it("preserves stack below compared values", () => {
		const frame = createFrame([100n, 200n, 30n, 20n], 1000n);

		const err = GT(frame);

		expect(err).toBe(null);
		expect(frame.stack).toEqual([100n, 200n, 1n]);
		expect(frame.pc).toBe(1);
	});
});
