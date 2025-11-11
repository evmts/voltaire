import { describe, it, expect } from "vitest";
import { handler_0x50_POP } from "./handlers/0x50_POP.js";
import { handler_0x60_PUSH1 } from "./handlers/0x60_PUSH1.js";
import { handler_0x7F_PUSH32 } from "./handlers/0x7F_PUSH32.js";
import { handler_0x80_DUP1 } from "./handlers/0x80_DUP1.js";
import { handler_0x90_SWAP1 } from "./handlers/0x90_SWAP1.js";
import type { BrandedFrame } from "../Frame/BrandedFrame.js";

/**
 * Create a minimal test frame
 */
function createFrame(
	stack: bigint[],
	bytecode: Uint8Array = new Uint8Array(),
	pc = 0,
	gasRemaining = 1000000n,
): BrandedFrame {
	return {
		__tag: "Frame",
		stack,
		memory: new Map(),
		memorySize: 0,
		pc,
		gasRemaining,
		bytecode,
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

describe("POP (0x50)", () => {
	it("removes top item from stack", () => {
		const frame = createFrame([1n, 2n, 3n]);
		const err = handler_0x50_POP(frame);

		expect(err).toBeNull();
		expect(frame.stack).toEqual([1n, 2n]);
		expect(frame.pc).toBe(1);
	});

	it("removes from single item stack", () => {
		const frame = createFrame([42n]);
		const err = handler_0x50_POP(frame);

		expect(err).toBeNull();
		expect(frame.stack).toEqual([]);
		expect(frame.pc).toBe(1);
	});

	it("returns StackUnderflow on empty stack", () => {
		const frame = createFrame([]);
		const err = handler_0x50_POP(frame);

		expect(err).toEqual({ type: "StackUnderflow" });
		expect(frame.pc).toBe(0);
	});

	it("returns OutOfGas when insufficient gas", () => {
		const frame = createFrame([1n], new Uint8Array(), 0, 2n);
		const err = handler_0x50_POP(frame);

		expect(err).toEqual({ type: "OutOfGas" });
		expect(frame.gasRemaining).toBe(0n);
		expect(frame.pc).toBe(0);
	});

	it("consumes correct gas amount (3)", () => {
		const frame = createFrame([1n], new Uint8Array(), 0, 100n);
		const err = handler_0x50_POP(frame);

		expect(err).toBeNull();
		expect(frame.gasRemaining).toBe(97n);
	});
});

describe("PUSH1 (0x60)", () => {
	it("pushes 1 byte from bytecode", () => {
		const bytecode = new Uint8Array([0x60, 0x42]);
		const frame = createFrame([], bytecode);
		const err = handler_0x60_PUSH1(frame);

		expect(err).toBeNull();
		expect(frame.stack).toEqual([0x42n]);
		expect(frame.pc).toBe(2);
	});

	it("pushes max byte value", () => {
		const bytecode = new Uint8Array([0x60, 0xff]);
		const frame = createFrame([], bytecode);
		const err = handler_0x60_PUSH1(frame);

		expect(err).toBeNull();
		expect(frame.stack).toEqual([0xffn]);
		expect(frame.pc).toBe(2);
	});

	it("pushes zero", () => {
		const bytecode = new Uint8Array([0x60, 0x00]);
		const frame = createFrame([], bytecode);
		const err = handler_0x60_PUSH1(frame);

		expect(err).toBeNull();
		expect(frame.stack).toEqual([0n]);
		expect(frame.pc).toBe(2);
	});

	it("returns InvalidOpcode when bytecode too short", () => {
		const bytecode = new Uint8Array([0x60]);
		const frame = createFrame([], bytecode);
		const err = handler_0x60_PUSH1(frame);

		expect(err).toEqual({ type: "InvalidOpcode" });
		expect(frame.pc).toBe(0);
	});

	it("returns StackOverflow when stack at max (1024)", () => {
		const stack = new Array(1024).fill(0n);
		const bytecode = new Uint8Array([0x60, 0x42]);
		const frame = createFrame(stack, bytecode);
		const err = handler_0x60_PUSH1(frame);

		expect(err).toEqual({ type: "StackOverflow" });
		expect(frame.pc).toBe(0);
	});

	it("consumes correct gas amount (3)", () => {
		const bytecode = new Uint8Array([0x60, 0x42]);
		const frame = createFrame([], bytecode, 0, 100n);
		const err = handler_0x60_PUSH1(frame);

		expect(err).toBeNull();
		expect(frame.gasRemaining).toBe(97n);
	});
});

describe("PUSH32 (0x7F)", () => {
	it("pushes 32 bytes from bytecode", () => {
		const data = new Uint8Array(32);
		data.fill(0xff);
		const bytecode = new Uint8Array([0x7f, ...data]);
		const frame = createFrame([], bytecode);
		const err = handler_0x7F_PUSH32(frame);

		expect(err).toBeNull();
		expect(frame.stack).toEqual([(1n << 256n) - 1n]);
		expect(frame.pc).toBe(33);
	});

	it("pushes specific 32-byte value", () => {
		const data = new Uint8Array(32);
		data[31] = 0x42;
		const bytecode = new Uint8Array([0x7f, ...data]);
		const frame = createFrame([], bytecode);
		const err = handler_0x7F_PUSH32(frame);

		expect(err).toBeNull();
		expect(frame.stack).toEqual([0x42n]);
		expect(frame.pc).toBe(33);
	});

	it("pushes max u256", () => {
		const data = new Uint8Array(32);
		data.fill(0xff);
		const bytecode = new Uint8Array([0x7f, ...data]);
		const frame = createFrame([], bytecode);
		const err = handler_0x7F_PUSH32(frame);

		const MAX_U256 = (1n << 256n) - 1n;
		expect(err).toBeNull();
		expect(frame.stack).toEqual([MAX_U256]);
		expect(frame.pc).toBe(33);
	});

	it("pushes zero (32 zero bytes)", () => {
		const data = new Uint8Array(32);
		const bytecode = new Uint8Array([0x7f, ...data]);
		const frame = createFrame([], bytecode);
		const err = handler_0x7F_PUSH32(frame);

		expect(err).toBeNull();
		expect(frame.stack).toEqual([0n]);
		expect(frame.pc).toBe(33);
	});

	it("returns InvalidOpcode when bytecode too short", () => {
		const bytecode = new Uint8Array([0x7f, 1, 2, 3]);
		const frame = createFrame([], bytecode);
		const err = handler_0x7F_PUSH32(frame);

		expect(err).toEqual({ type: "InvalidOpcode" });
		expect(frame.pc).toBe(0);
	});

	it("returns StackOverflow when stack at max (1024)", () => {
		const stack = new Array(1024).fill(0n);
		const data = new Uint8Array(32);
		const bytecode = new Uint8Array([0x7f, ...data]);
		const frame = createFrame(stack, bytecode);
		const err = handler_0x7F_PUSH32(frame);

		expect(err).toEqual({ type: "StackOverflow" });
		expect(frame.pc).toBe(0);
	});

	it("consumes correct gas amount (3)", () => {
		const data = new Uint8Array(32);
		const bytecode = new Uint8Array([0x7f, ...data]);
		const frame = createFrame([], bytecode, 0, 100n);
		const err = handler_0x7F_PUSH32(frame);

		expect(err).toBeNull();
		expect(frame.gasRemaining).toBe(97n);
	});
});

describe("DUP1 (0x80)", () => {
	it("duplicates top stack item", () => {
		const frame = createFrame([1n, 2n, 3n]);
		const err = handler_0x80_DUP1(frame);

		expect(err).toBeNull();
		expect(frame.stack).toEqual([1n, 2n, 3n, 3n]);
		expect(frame.pc).toBe(1);
	});

	it("duplicates single item", () => {
		const frame = createFrame([42n]);
		const err = handler_0x80_DUP1(frame);

		expect(err).toBeNull();
		expect(frame.stack).toEqual([42n, 42n]);
		expect(frame.pc).toBe(1);
	});

	it("duplicates zero", () => {
		const frame = createFrame([0n]);
		const err = handler_0x80_DUP1(frame);

		expect(err).toBeNull();
		expect(frame.stack).toEqual([0n, 0n]);
		expect(frame.pc).toBe(1);
	});

	it("returns StackUnderflow on empty stack", () => {
		const frame = createFrame([]);
		const err = handler_0x80_DUP1(frame);

		expect(err).toEqual({ type: "StackUnderflow" });
		expect(frame.pc).toBe(0);
	});

	it("returns StackOverflow when stack at max (1024)", () => {
		const stack = new Array(1024).fill(0n);
		const frame = createFrame(stack);
		const err = handler_0x80_DUP1(frame);

		expect(err).toEqual({ type: "StackOverflow" });
		expect(frame.pc).toBe(0);
	});

	it("returns OutOfGas when insufficient gas", () => {
		const frame = createFrame([1n], new Uint8Array(), 0, 2n);
		const err = handler_0x80_DUP1(frame);

		expect(err).toEqual({ type: "OutOfGas" });
		expect(frame.gasRemaining).toBe(0n);
		expect(frame.pc).toBe(0);
	});

	it("consumes correct gas amount (3)", () => {
		const frame = createFrame([1n], new Uint8Array(), 0, 100n);
		const err = handler_0x80_DUP1(frame);

		expect(err).toBeNull();
		expect(frame.gasRemaining).toBe(97n);
	});
});

describe("SWAP1 (0x90)", () => {
	it("swaps top with second item", () => {
		const frame = createFrame([1n, 2n, 3n]);
		const err = handler_0x90_SWAP1(frame);

		expect(err).toBeNull();
		expect(frame.stack).toEqual([1n, 3n, 2n]);
		expect(frame.pc).toBe(1);
	});

	it("swaps in 2-item stack", () => {
		const frame = createFrame([5n, 10n]);
		const err = handler_0x90_SWAP1(frame);

		expect(err).toBeNull();
		expect(frame.stack).toEqual([10n, 5n]);
		expect(frame.pc).toBe(1);
	});

	it("swaps with zero", () => {
		const frame = createFrame([0n, 42n]);
		const err = handler_0x90_SWAP1(frame);

		expect(err).toBeNull();
		expect(frame.stack).toEqual([42n, 0n]);
		expect(frame.pc).toBe(1);
	});

	it("returns StackUnderflow on empty stack", () => {
		const frame = createFrame([]);
		const err = handler_0x90_SWAP1(frame);

		expect(err).toEqual({ type: "StackUnderflow" });
		expect(frame.pc).toBe(0);
	});

	it("returns StackUnderflow on single item stack", () => {
		const frame = createFrame([1n]);
		const err = handler_0x90_SWAP1(frame);

		expect(err).toEqual({ type: "StackUnderflow" });
		expect(frame.pc).toBe(0);
	});

	it("returns OutOfGas when insufficient gas", () => {
		const frame = createFrame([1n, 2n], new Uint8Array(), 0, 2n);
		const err = handler_0x90_SWAP1(frame);

		expect(err).toEqual({ type: "OutOfGas" });
		expect(frame.gasRemaining).toBe(0n);
		expect(frame.pc).toBe(0);
	});

	it("consumes correct gas amount (3)", () => {
		const frame = createFrame([1n, 2n], new Uint8Array(), 0, 100n);
		const err = handler_0x90_SWAP1(frame);

		expect(err).toBeNull();
		expect(frame.gasRemaining).toBe(97n);
	});
});
