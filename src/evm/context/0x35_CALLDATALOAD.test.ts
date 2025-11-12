import { describe, expect, it } from "vitest";
import type { BrandedFrame } from "../Frame/BrandedFrame.js";
import { calldataload } from "./0x35_CALLDATALOAD.js";

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

describe("CALLDATALOAD (0x35)", () => {
	it("loads 32 bytes from calldata at offset 0", () => {
		const calldata = new Uint8Array(32);
		for (let i = 0; i < 32; i++) {
			calldata[i] = i + 1;
		}
		const frame = createFrame(calldata, [0n]);
		const err = calldataload(frame);

		expect(err).toBeNull();
		expect(frame.stack.length).toBe(1);
		// Construct expected value: big-endian
		let expected = 0n;
		for (let i = 0; i < 32; i++) {
			expected = (expected << 8n) | BigInt(i + 1);
		}
		expect(frame.stack[0]).toBe(expected);
		expect(frame.pc).toBe(1);
	});

	it("loads 32 bytes from calldata at offset 4", () => {
		const calldata = new Uint8Array(36);
		for (let i = 0; i < 36; i++) {
			calldata[i] = i;
		}
		const frame = createFrame(calldata, [4n]);
		const err = calldataload(frame);

		expect(err).toBeNull();
		expect(frame.stack.length).toBe(1);
		// Construct expected value: bytes 4-35
		let expected = 0n;
		for (let i = 4; i < 36; i++) {
			expected = (expected << 8n) | BigInt(i);
		}
		expect(frame.stack[0]).toBe(expected);
		expect(frame.pc).toBe(1);
	});

	it("zero-pads when offset is beyond calldata length", () => {
		const calldata = new Uint8Array(0);
		const frame = createFrame(calldata, [0n]);
		const err = calldataload(frame);

		expect(err).toBeNull();
		expect(frame.stack.length).toBe(1);
		expect(frame.stack[0]).toBe(0n);
		expect(frame.pc).toBe(1);
	});

	it("zero-pads when offset + 32 exceeds calldata length", () => {
		const calldata = new Uint8Array(10);
		for (let i = 0; i < 10; i++) {
			calldata[i] = 0xff;
		}
		const frame = createFrame(calldata, [0n]);
		const err = calldataload(frame);

		expect(err).toBeNull();
		expect(frame.stack.length).toBe(1);
		// First 10 bytes are 0xff, remaining 22 bytes are 0x00
		let expected = 0n;
		for (let i = 0; i < 10; i++) {
			expected = (expected << 8n) | 0xffn;
		}
		for (let i = 10; i < 32; i++) {
			expected = expected << 8n;
		}
		expect(frame.stack[0]).toBe(expected);
		expect(frame.pc).toBe(1);
	});

	it("zero-pads partial overlap", () => {
		const calldata = new Uint8Array(20);
		for (let i = 0; i < 20; i++) {
			calldata[i] = i + 1;
		}
		const frame = createFrame(calldata, [10n]);
		const err = calldataload(frame);

		expect(err).toBeNull();
		expect(frame.stack.length).toBe(1);
		// Reads 32 bytes starting at offset 10:
		// Indices 10-19 from calldata (values 11-20), then indices 20-41 are zeros
		let expected = 0n;
		for (let i = 0; i < 32; i++) {
			const idx = 10 + i;
			const value = idx < calldata.length ? calldata[idx] : 0;
			expected = (expected << 8n) | BigInt(value);
		}
		expect(frame.stack[0]).toBe(expected);
		expect(frame.pc).toBe(1);
	});

	it("returns zero for offset beyond u32 range", () => {
		const calldata = new Uint8Array(32);
		calldata.fill(0xff);
		const frame = createFrame(calldata, [0x100000000n]);
		const err = calldataload(frame);

		expect(err).toBeNull();
		expect(frame.stack.length).toBe(1);
		expect(frame.stack[0]).toBe(0n);
		expect(frame.pc).toBe(1);
	});

	it("returns StackUnderflow when stack is empty", () => {
		const calldata = new Uint8Array(32);
		const frame = createFrame(calldata, []);
		const err = calldataload(frame);

		expect(err).toEqual({ type: "StackUnderflow" });
		expect(frame.pc).toBe(0);
	});

	it("returns OutOfGas when insufficient gas", () => {
		const calldata = new Uint8Array(32);
		const frame = createFrame(calldata, [0n], 2n);
		const err = calldataload(frame);

		expect(err).toEqual({ type: "OutOfGas" });
		expect(frame.gasRemaining).toBe(0n);
		expect(frame.pc).toBe(0);
	});

	it("consumes correct gas amount (3)", () => {
		const calldata = new Uint8Array(32);
		const frame = createFrame(calldata, [0n], 100n);
		const err = calldataload(frame);

		expect(err).toBeNull();
		expect(frame.gasRemaining).toBe(97n);
	});
});
