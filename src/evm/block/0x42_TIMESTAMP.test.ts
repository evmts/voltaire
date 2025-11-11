import { describe, it, expect } from "vitest";
import { handler_0x42_TIMESTAMP } from "./0x42_TIMESTAMP.js";
import type { BrandedFrame } from "../Frame/BrandedFrame.js";
import { Address } from "../../primitives/Address/index.js";

describe("TIMESTAMP (0x42)", () => {
	it("pushes block timestamp to stack", () => {
		const frame: BrandedFrame = {
			__tag: "Frame",
			stack: [],
			memory: new Map(),
			memorySize: 0,
			pc: 0,
			gasRemaining: 1000n,
			bytecode: new Uint8Array([0x42]),
			caller: Address("0x0000000000000000000000000000000000000001"),
			address: Address("0x0000000000000000000000000000000000000002"),
			value: 0n,
			calldata: new Uint8Array(),
			output: new Uint8Array(),
			returnData: new Uint8Array(),
			stopped: false,
			reverted: false,
			isStatic: false,
			authorized: null,
			callDepth: 0,
			blockTimestamp: 1699999999n,
		};

		const error = handler_0x42_TIMESTAMP(frame);

		expect(error).toBe(null);
		expect(frame.stack).toHaveLength(1);
		expect(frame.stack[0]).toBe(1699999999n);
		expect(frame.pc).toBe(1);
		expect(frame.gasRemaining).toBe(998n);
	});

	it("uses current timestamp if frame property not set", () => {
		const frame: BrandedFrame = {
			__tag: "Frame",
			stack: [],
			memory: new Map(),
			memorySize: 0,
			pc: 0,
			gasRemaining: 1000n,
			bytecode: new Uint8Array([0x42]),
			caller: Address("0x0000000000000000000000000000000000000001"),
			address: Address("0x0000000000000000000000000000000000000002"),
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

		const error = handler_0x42_TIMESTAMP(frame);

		expect(error).toBe(null);
		expect(frame.stack).toHaveLength(1);
		// Should be a reasonable Unix timestamp
		expect(frame.stack[0]).toBeGreaterThan(1600000000n);
		expect(frame.stack[0]).toBeLessThan(2000000000n);
		expect(frame.pc).toBe(1);
	});

	it("returns OutOfGas when insufficient gas", () => {
		const frame: BrandedFrame = {
			__tag: "Frame",
			stack: [],
			memory: new Map(),
			memorySize: 0,
			pc: 0,
			gasRemaining: 1n,
			bytecode: new Uint8Array([0x42]),
			caller: Address("0x0000000000000000000000000000000000000001"),
			address: Address("0x0000000000000000000000000000000000000002"),
			value: 0n,
			calldata: new Uint8Array(),
			output: new Uint8Array(),
			returnData: new Uint8Array(),
			stopped: false,
			reverted: false,
			isStatic: false,
			authorized: null,
			callDepth: 0,
			blockTimestamp: 1699999999n,
		};

		const error = handler_0x42_TIMESTAMP(frame);

		expect(error).toEqual({ type: "OutOfGas" });
		expect(frame.gasRemaining).toBe(0n);
		expect(frame.stack).toHaveLength(0);
	});

	it("returns StackOverflow when stack is full", () => {
		const frame: BrandedFrame = {
			__tag: "Frame",
			stack: Array(1024).fill(1n),
			memory: new Map(),
			memorySize: 0,
			pc: 0,
			gasRemaining: 1000n,
			bytecode: new Uint8Array([0x42]),
			caller: Address("0x0000000000000000000000000000000000000001"),
			address: Address("0x0000000000000000000000000000000000000002"),
			value: 0n,
			calldata: new Uint8Array(),
			output: new Uint8Array(),
			returnData: new Uint8Array(),
			stopped: false,
			reverted: false,
			isStatic: false,
			authorized: null,
			callDepth: 0,
			blockTimestamp: 1699999999n,
		};

		const error = handler_0x42_TIMESTAMP(frame);

		expect(error).toEqual({ type: "StackOverflow" });
		expect(frame.stack).toHaveLength(1024);
	});
});
