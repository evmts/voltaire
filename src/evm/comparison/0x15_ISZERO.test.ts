import { describe, expect, it } from "vitest";
import type { BrandedFrame } from "../Frame/BrandedFrame.js";
import { handle as ISZERO } from "./0x15_ISZERO.js";

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

describe("ISZERO opcode (0x15)", () => {
	it("returns 1 when value is zero", () => {
		const frame = createFrame([0n], 1000n);

		const err = ISZERO(frame);

		expect(err).toBe(null);
		expect(frame.stack).toEqual([1n]);
		expect(frame.pc).toBe(1);
		expect(frame.gasRemaining).toBe(997n);
	});

	it("returns 0 when value is non-zero", () => {
		const frame = createFrame([42n], 1000n);

		const err = ISZERO(frame);

		expect(err).toBe(null);
		expect(frame.stack).toEqual([0n]);
		expect(frame.pc).toBe(1);
		expect(frame.gasRemaining).toBe(997n);
	});

	it("returns 0 for value 1", () => {
		const frame = createFrame([1n], 1000n);

		const err = ISZERO(frame);

		expect(err).toBe(null);
		expect(frame.stack).toEqual([0n]);
	});

	it("returns 0 for max uint256", () => {
		const MAX_UINT256 = (1n << 256n) - 1n;
		const frame = createFrame([MAX_UINT256], 1000n);

		const err = ISZERO(frame);

		expect(err).toBe(null);
		expect(frame.stack).toEqual([0n]);
	});

	it("returns 0 for negative value (two's complement)", () => {
		// -1 in two's complement
		const neg1 = (1n << 256n) - 1n;
		const frame = createFrame([neg1], 1000n);

		const err = ISZERO(frame);

		expect(err).toBe(null);
		expect(frame.stack).toEqual([0n]); // Not zero
	});

	it("returns 0 for small positive value", () => {
		const frame = createFrame([123n], 1000n);

		const err = ISZERO(frame);

		expect(err).toBe(null);
		expect(frame.stack).toEqual([0n]);
	});

	it("returns 0 for large positive value", () => {
		const large = 123456789012345678901234567890n;
		const frame = createFrame([large], 1000n);

		const err = ISZERO(frame);

		expect(err).toBe(null);
		expect(frame.stack).toEqual([0n]);
	});

	it("can be chained (ISZERO(ISZERO(0)) = 0)", () => {
		const frame = createFrame([0n], 1000n);

		// First ISZERO
		let err = ISZERO(frame);
		expect(err).toBe(null);
		expect(frame.stack).toEqual([1n]);

		// Reset PC for second operation
		frame.pc = 0;

		// Second ISZERO
		err = ISZERO(frame);
		expect(err).toBe(null);
		expect(frame.stack).toEqual([0n]);
	});

	it("can be chained (ISZERO(ISZERO(1)) = 1)", () => {
		const frame = createFrame([1n], 1000n);

		// First ISZERO
		let err = ISZERO(frame);
		expect(err).toBe(null);
		expect(frame.stack).toEqual([0n]);

		// Reset PC for second operation
		frame.pc = 0;

		// Second ISZERO
		err = ISZERO(frame);
		expect(err).toBe(null);
		expect(frame.stack).toEqual([1n]);
	});

	it("returns StackUnderflow when stack is empty", () => {
		const frame = createFrame([0n], 2n);

		const err = ISZERO(frame);

		expect(err).toEqual({ type: "OutOfGas" });
		expect(frame.gasRemaining).toBe(0n);
	});

	it("preserves stack below tested value", () => {
		const frame = createFrame([100n, 200n, 300n, 0n], 1000n);

		const err = ISZERO(frame);

		expect(err).toBe(null);
		expect(frame.stack).toEqual([100n, 200n, 300n, 1n]);
		expect(frame.pc).toBe(1);
	});
});
