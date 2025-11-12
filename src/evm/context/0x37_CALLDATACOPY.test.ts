import { describe, expect, it } from "vitest";
import type { BrandedFrame } from "../Frame/BrandedFrame.js";
import { readMemory } from "../Frame/readMemory.js";
import { calldatacopy } from "./0x37_CALLDATACOPY.js";

function createFrame(
	calldata: Uint8Array,
	stack: bigint[] = [],
	gasRemaining = 1000000n,
): BrandedFrame {
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
		calldata,
		output: new Uint8Array(),
		returnData: new Uint8Array(),
		stopped: false,
		reverted: false,
		isStatic: false,
		authorized: null,
		callDepth: 0,
	};
}

describe("CALLDATACOPY (0x37)", () => {
	it("copies 32 bytes from calldata to memory", () => {
		const calldata = new Uint8Array(64);
		for (let i = 0; i < 64; i++) {
			calldata[i] = i;
		}
		// Stack: [destOffset, offset, length] => [0, 0, 32]
		const frame = createFrame(calldata, [32n, 0n, 0n]);
		const err = calldatacopy(frame);

		expect(err).toBeNull();
		expect(frame.stack.length).toBe(0);
		// Verify memory contents
		for (let i = 0; i < 32; i++) {
			expect(readMemory(frame, i)).toBe(i);
		}
		expect(frame.pc).toBe(1);
	});

	it("copies from offset in calldata", () => {
		const calldata = new Uint8Array(64);
		for (let i = 0; i < 64; i++) {
			calldata[i] = i + 1;
		}
		// Stack: [destOffset, offset, length] => [0, 10, 20]
		const frame = createFrame(calldata, [20n, 10n, 0n]);
		const err = calldatacopy(frame);

		expect(err).toBeNull();
		expect(frame.stack.length).toBe(0);
		// Verify memory contains bytes 11-30 (indices 10-29)
		for (let i = 0; i < 20; i++) {
			expect(readMemory(frame, i)).toBe(i + 11);
		}
		expect(frame.pc).toBe(1);
	});

	it("zero-pads when copying beyond calldata length", () => {
		const calldata = new Uint8Array(10);
		calldata.fill(0xff);
		// Stack: [destOffset, offset, length] => [0, 0, 32]
		const frame = createFrame(calldata, [32n, 0n, 0n]);
		const err = calldatacopy(frame);

		expect(err).toBeNull();
		expect(frame.stack.length).toBe(0);
		// First 10 bytes are 0xff, remaining 22 bytes are 0x00
		for (let i = 0; i < 10; i++) {
			expect(readMemory(frame, i)).toBe(0xff);
		}
		for (let i = 10; i < 32; i++) {
			expect(readMemory(frame, i)).toBe(0x00);
		}
		expect(frame.pc).toBe(1);
	});

	it("zero-pads when offset exceeds calldata length", () => {
		const calldata = new Uint8Array(10);
		calldata.fill(0xaa);
		// Stack: [destOffset, offset, length] => [0, 20, 10]
		const frame = createFrame(calldata, [10n, 20n, 0n]);
		const err = calldatacopy(frame);

		expect(err).toBeNull();
		expect(frame.stack.length).toBe(0);
		// All bytes should be zero (reading beyond calldata)
		for (let i = 0; i < 10; i++) {
			expect(readMemory(frame, i)).toBe(0x00);
		}
		expect(frame.pc).toBe(1);
	});

	it("copies to offset in memory", () => {
		const calldata = new Uint8Array(32);
		for (let i = 0; i < 32; i++) {
			calldata[i] = i + 1;
		}
		// Stack: [destOffset, offset, length] => [0, 64, 16]
		const frame = createFrame(calldata, [16n, 0n, 64n]);
		const err = calldatacopy(frame);

		expect(err).toBeNull();
		expect(frame.stack.length).toBe(0);
		// Memory at offset 64 should contain first 16 bytes of calldata
		for (let i = 0; i < 16; i++) {
			expect(readMemory(frame, 64 + i)).toBe(i + 1);
		}
		expect(frame.pc).toBe(1);
	});

	it("handles zero length copy", () => {
		const calldata = new Uint8Array(32);
		calldata.fill(0xff);
		// Stack: [destOffset, offset, length] => [0, 0, 0]
		const frame = createFrame(calldata, [0n, 0n, 0n]);
		const err = calldatacopy(frame);

		expect(err).toBeNull();
		expect(frame.stack.length).toBe(0);
		expect(frame.memorySize).toBe(0);
		expect(frame.pc).toBe(1);
	});

	it("returns StackUnderflow when stack has less than 3 items", () => {
		const calldata = new Uint8Array(32);
		const frame = createFrame(calldata, [10n, 0n]);
		const err = calldatacopy(frame);

		expect(err).toEqual({ type: "StackUnderflow" });
		expect(frame.pc).toBe(0);
	});

	it("returns OutOfBounds when offset exceeds u32 max", () => {
		const calldata = new Uint8Array(32);
		const frame = createFrame(calldata, [32n, 0x100000000n, 0n]);
		const err = calldatacopy(frame);

		expect(err).toEqual({ type: "OutOfBounds" });
		expect(frame.pc).toBe(0);
	});

	it("returns OutOfGas when insufficient gas", () => {
		const calldata = new Uint8Array(32);
		const frame = createFrame(calldata, [32n, 0n, 0n], 5n);
		const err = calldatacopy(frame);

		expect(err).toEqual({ type: "OutOfGas" });
		expect(frame.pc).toBe(0);
	});

	it("charges correct gas for small copy", () => {
		const calldata = new Uint8Array(32);
		// Stack: [destOffset, offset, length] => [0, 0, 32]
		const frame = createFrame(calldata, [32n, 0n, 0n], 10000n);
		const err = calldatacopy(frame);

		expect(err).toBeNull();
		// Gas: 3 (base) + memory expansion + 3 (1 word copy)
		// Memory 0-31 = 1 word, cost = 3 + 1*1/512 ≈ 3
		// Copy cost = 3 (1 word)
		// Total = 3 + 3 + 3 = 9
		expect(frame.gasRemaining).toBeLessThan(10000n);
		expect(frame.gasRemaining).toBeGreaterThan(9990n);
	});

	it("charges correct gas for multi-word copy", () => {
		const calldata = new Uint8Array(128);
		// Stack: [destOffset, offset, length] => [0, 0, 64]
		const frame = createFrame(calldata, [64n, 0n, 0n], 10000n);
		const err = calldatacopy(frame);

		expect(err).toBeNull();
		// Gas: 3 (base) + memory expansion for 64 bytes (2 words) + 6 (2 word copy)
		// Memory cost for 2 words = 3*2 + 2*2/512 ≈ 6
		// Copy cost = 6 (2 words)
		// Total = 3 + 6 + 6 = 15
		expect(frame.gasRemaining).toBeLessThan(10000n);
		expect(frame.gasRemaining).toBeGreaterThan(9980n);
	});

	it("updates memory size correctly", () => {
		const calldata = new Uint8Array(64);
		// Stack: [destOffset, offset, length] => [0, 0, 50]
		const frame = createFrame(calldata, [50n, 0n, 0n]);
		const err = calldatacopy(frame);

		expect(err).toBeNull();
		// Memory size should be word-aligned: ceil(50/32) * 32 = 64
		expect(frame.memorySize).toBe(64);
	});
});
