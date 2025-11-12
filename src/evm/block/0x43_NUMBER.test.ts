import { describe, expect, it } from "vitest";
import { Address } from "../../primitives/Address/index.js";
import type { BrandedFrame } from "../Frame/BrandedFrame.js";
import { handler_0x43_NUMBER } from "./0x43_NUMBER.js";

describe("NUMBER (0x43)", () => {
	it("pushes block number to stack", () => {
		const frame: BrandedFrame = {
			__tag: "Frame",
			stack: [],
			memory: new Map(),
			memorySize: 0,
			pc: 0,
			gasRemaining: 1000n,
			bytecode: new Uint8Array([0x43]),
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
			blockNumber: 18000000n,
		};

		const error = handler_0x43_NUMBER(frame);

		expect(error).toBe(null);
		expect(frame.stack).toHaveLength(1);
		expect(frame.stack[0]).toBe(18000000n);
		expect(frame.pc).toBe(1);
		expect(frame.gasRemaining).toBe(998n);
	});

	it("uses default block number 0 if frame property not set", () => {
		const frame: BrandedFrame = {
			__tag: "Frame",
			stack: [],
			memory: new Map(),
			memorySize: 0,
			pc: 0,
			gasRemaining: 1000n,
			bytecode: new Uint8Array([0x43]),
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

		const error = handler_0x43_NUMBER(frame);

		expect(error).toBe(null);
		expect(frame.stack).toHaveLength(1);
		expect(frame.stack[0]).toBe(0n);
		expect(frame.pc).toBe(1);
	});

	it("handles genesis block (0)", () => {
		const frame: BrandedFrame = {
			__tag: "Frame",
			stack: [],
			memory: new Map(),
			memorySize: 0,
			pc: 0,
			gasRemaining: 1000n,
			bytecode: new Uint8Array([0x43]),
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
			blockNumber: 0n,
		};

		const error = handler_0x43_NUMBER(frame);

		expect(error).toBe(null);
		expect(frame.stack).toHaveLength(1);
		expect(frame.stack[0]).toBe(0n);
	});

	it("handles large block numbers", () => {
		const frame: BrandedFrame = {
			__tag: "Frame",
			stack: [],
			memory: new Map(),
			memorySize: 0,
			pc: 0,
			gasRemaining: 1000n,
			bytecode: new Uint8Array([0x43]),
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
			blockNumber: 999999999999n,
		};

		const error = handler_0x43_NUMBER(frame);

		expect(error).toBe(null);
		expect(frame.stack).toHaveLength(1);
		expect(frame.stack[0]).toBe(999999999999n);
	});

	it("returns OutOfGas when insufficient gas", () => {
		const frame: BrandedFrame = {
			__tag: "Frame",
			stack: [],
			memory: new Map(),
			memorySize: 0,
			pc: 0,
			gasRemaining: 1n,
			bytecode: new Uint8Array([0x43]),
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
			blockNumber: 18000000n,
		};

		const error = handler_0x43_NUMBER(frame);

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
			bytecode: new Uint8Array([0x43]),
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
			blockNumber: 18000000n,
		};

		const error = handler_0x43_NUMBER(frame);

		expect(error).toEqual({ type: "StackOverflow" });
		expect(frame.stack).toHaveLength(1024);
	});
});
