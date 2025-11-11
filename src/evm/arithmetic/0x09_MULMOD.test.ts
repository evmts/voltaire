import { describe, it, expect } from "vitest";
import { mulmod } from "./0x09_MULMOD.js";
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

describe("MULMOD (0x09)", () => {
	it("computes (a * b) % n", () => {
		// Stack: [n, b, a] (bottom to top) -> pops a, b, n
		const frame = createFrame([3n, 10n, 5n]);
		const err = mulmod(frame);

		expect(err).toBeNull();
		expect(frame.stack).toEqual([2n]); // (5 * 10) % 3 = 50 % 3 = 2
		expect(frame.pc).toBe(1);
	});

	it("returns 0 when n is 0", () => {
		// Stack: [n=0, b, a] (bottom to top)
		const frame = createFrame([0n, 10n, 5n]);
		const err = mulmod(frame);

		expect(err).toBeNull();
		expect(frame.stack).toEqual([0n]);
		expect(frame.pc).toBe(1);
	});

	it("handles large values without overflow", () => {
		const MAX_U256 = (1n << 256n) - 1n;
		// Stack: [n, b, a] (bottom to top)
		const frame = createFrame([7n, MAX_U256, MAX_U256]);
		const err = mulmod(frame);

		expect(err).toBeNull();
		// (MAX_U256 * MAX_U256) % 7 should work with BigInt
		const expected = (MAX_U256 * MAX_U256) % 7n;
		expect(frame.stack).toEqual([expected]);
		expect(frame.pc).toBe(1);
	});

	it("handles overflow case with large modulus", () => {
		const MAX_U256 = (1n << 256n) - 1n;
		// Stack: [n, b, a] (bottom to top)
		const frame = createFrame([MAX_U256, 2n, MAX_U256]);
		const err = mulmod(frame);

		expect(err).toBeNull();
		// (MAX_U256 * 2) % MAX_U256 = (2 * MAX_U256) % MAX_U256 = 0
		expect(frame.stack).toEqual([0n]);
		expect(frame.pc).toBe(1);
	});

	it("multiplies by zero", () => {
		// Stack: [n, b, a=0] (bottom to top)
		const frame = createFrame([17n, 42n, 0n]);
		const err = mulmod(frame);

		expect(err).toBeNull();
		expect(frame.stack).toEqual([0n]); // (0 * 42) % 17 = 0
		expect(frame.pc).toBe(1);
	});

	it("handles n = 1", () => {
		// Stack: [n=1, b, a] (bottom to top)
		const frame = createFrame([1n, 888n, 999n]);
		const err = mulmod(frame);

		expect(err).toBeNull();
		expect(frame.stack).toEqual([0n]); // Any number mod 1 is 0
		expect(frame.pc).toBe(1);
	});

	it("handles result equals modulus minus one", () => {
		// Stack: [n, b, a] (bottom to top)
		const frame = createFrame([10n, 3n, 3n]);
		const err = mulmod(frame);

		expect(err).toBeNull();
		expect(frame.stack).toEqual([9n]); // (3 * 3) % 10 = 9
		expect(frame.pc).toBe(1);
	});

	it("handles very large multiplication", () => {
		const a = (1n << 200n) - 1n;
		const b = (1n << 200n) - 1n;
		const n = (1n << 100n) + 7n;
		// Stack: [n, b, a] (bottom to top)
		const frame = createFrame([n, b, a]);
		const err = mulmod(frame);

		expect(err).toBeNull();
		const expected = (a * b) % n;
		expect(frame.stack).toEqual([expected]);
		expect(frame.pc).toBe(1);
	});

	it("returns StackUnderflow when stack has less than 3 items", () => {
		const frame = createFrame([10n, 5n]);
		const err = mulmod(frame);

		expect(err).toEqual({ type: "StackUnderflow" });
		expect(frame.pc).toBe(0);
	});

	it("returns StackUnderflow when stack is empty", () => {
		const frame = createFrame([]);
		const err = mulmod(frame);

		expect(err).toEqual({ type: "StackUnderflow" });
		expect(frame.pc).toBe(0);
	});

	it("returns OutOfGas when insufficient gas", () => {
		const frame = createFrame([3n, 10n, 5n], 7n);
		const err = mulmod(frame);

		expect(err).toEqual({ type: "OutOfGas" });
		expect(frame.gasRemaining).toBe(0n);
		expect(frame.pc).toBe(0);
	});

	it("consumes correct gas amount (8)", () => {
		const frame = createFrame([3n, 10n, 5n], 100n);
		const err = mulmod(frame);

		expect(err).toBeNull();
		expect(frame.gasRemaining).toBe(92n);
	});

	it("handles stack with exactly 3 items", () => {
		// Stack: [n, b, a] (bottom to top) -> (a * b) % n = (13 * 11) % 7
		const frame = createFrame([7n, 11n, 13n]);
		const err = mulmod(frame);

		expect(err).toBeNull();
		expect(frame.stack.length).toBe(1);
		expect(frame.stack).toEqual([3n]); // (13 * 11) % 7 = 143 % 7 = 3
	});

	it("verifies against overflow-prone case", () => {
		// Test case where naive multiplication would overflow u256
		const a = 1n << 255n;
		const b = 3n;
		const n = 1n << 200n;
		// Stack: [n, b, a] (bottom to top)
		const frame = createFrame([n, b, a]);
		const err = mulmod(frame);

		expect(err).toBeNull();
		const expected = (a * b) % n;
		expect(frame.stack).toEqual([expected]);
	});
});
