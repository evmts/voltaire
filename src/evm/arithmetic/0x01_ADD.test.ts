import { describe, expect, it } from "vitest";
import type { BrandedFrame } from "../Frame/BrandedFrame.js";
import { add } from "./0x01_ADD.js";

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

describe("ADD (0x01)", () => {
	it("adds two numbers", () => {
		const frame = createFrame([5n, 10n]);
		const err = add(frame);

		expect(err).toBeNull();
		expect(frame.stack).toEqual([15n]);
		expect(frame.pc).toBe(1);
	});

	it("handles overflow wrapping", () => {
		const MAX_U256 = (1n << 256n) - 1n;
		const frame = createFrame([MAX_U256, 1n]);
		const err = add(frame);

		expect(err).toBeNull();
		expect(frame.stack).toEqual([0n]);
		expect(frame.pc).toBe(1);
	});

	it("handles large overflow", () => {
		const MAX_U256 = (1n << 256n) - 1n;
		const frame = createFrame([MAX_U256, MAX_U256]);
		const err = add(frame);

		expect(err).toBeNull();
		expect(frame.stack).toEqual([MAX_U256 - 1n]);
		expect(frame.pc).toBe(1);
	});

	it("adds zero", () => {
		const frame = createFrame([42n, 0n]);
		const err = add(frame);

		expect(err).toBeNull();
		expect(frame.stack).toEqual([42n]);
		expect(frame.pc).toBe(1);
	});

	it("returns StackUnderflow when stack has less than 2 items", () => {
		const frame = createFrame([5n]);
		const err = add(frame);

		expect(err).toEqual({ type: "StackUnderflow" });
		expect(frame.pc).toBe(0);
	});

	it("returns StackUnderflow when stack is empty", () => {
		const frame = createFrame([]);
		const err = add(frame);

		expect(err).toEqual({ type: "StackUnderflow" });
		expect(frame.pc).toBe(0);
	});

	it("returns OutOfGas when insufficient gas", () => {
		const frame = createFrame([5n, 10n], 2n);
		const err = add(frame);

		expect(err).toEqual({ type: "OutOfGas" });
		expect(frame.gasRemaining).toBe(0n);
		expect(frame.pc).toBe(0);
	});

	it("consumes correct gas amount (3)", () => {
		const frame = createFrame([5n, 10n], 100n);
		const err = add(frame);

		expect(err).toBeNull();
		expect(frame.gasRemaining).toBe(97n);
	});

	it("handles maximum stack after pop", () => {
		// Start with 1024 items, add will pop 2 and push 1
		const stack = new Array(1024).fill(1n);
		const frame = createFrame(stack);
		const err = add(frame);

		expect(err).toBeNull();
		expect(frame.stack.length).toBe(1023);
		expect(frame.stack[1022]).toBe(2n);
	});
});
