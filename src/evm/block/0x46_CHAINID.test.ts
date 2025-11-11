import { describe, it, expect } from "vitest";
import { handler_0x46_CHAINID } from "./0x46_CHAINID.js";
import type { BrandedFrame } from "../Frame/BrandedFrame.js";
import * as Address from "../../primitives/Address/index.js";

describe("CHAINID (0x46)", () => {
	it("pushes chain ID to stack", () => {
		const frame: BrandedFrame = {
			__tag: "Frame",
			stack: [],
			memory: new Map(),
			memorySize: 0,
			pc: 0,
			gasRemaining: 1000n,
			bytecode: new Uint8Array([0x46]),
			caller: Address.from("0x0000000000000000000000000000000000000001"),
			address: Address.from("0x0000000000000000000000000000000000000002"),
			value: 0n,
			calldata: new Uint8Array(),
			output: new Uint8Array(),
			returnData: new Uint8Array(),
			stopped: false,
			reverted: false,
			isStatic: false,
			authorized: null,
			callDepth: 0,
			chainId: 1n,
		};

		const error = handler_0x46_CHAINID(frame);

		expect(error).toBe(null);
		expect(frame.stack).toHaveLength(1);
		expect(frame.stack[0]).toBe(1n);
		expect(frame.pc).toBe(1);
		expect(frame.gasRemaining).toBe(998n);
	});

	it("uses default chain ID 1 (mainnet) if frame property not set", () => {
		const frame: BrandedFrame = {
			__tag: "Frame",
			stack: [],
			memory: new Map(),
			memorySize: 0,
			pc: 0,
			gasRemaining: 1000n,
			bytecode: new Uint8Array([0x46]),
			caller: Address.from("0x0000000000000000000000000000000000000001"),
			address: Address.from("0x0000000000000000000000000000000000000002"),
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

		const error = handler_0x46_CHAINID(frame);

		expect(error).toBe(null);
		expect(frame.stack).toHaveLength(1);
		expect(frame.stack[0]).toBe(1n);
		expect(frame.pc).toBe(1);
	});

	it("handles different chain IDs (Goerli)", () => {
		const frame: BrandedFrame = {
			__tag: "Frame",
			stack: [],
			memory: new Map(),
			memorySize: 0,
			pc: 0,
			gasRemaining: 1000n,
			bytecode: new Uint8Array([0x46]),
			caller: Address.from("0x0000000000000000000000000000000000000001"),
			address: Address.from("0x0000000000000000000000000000000000000002"),
			value: 0n,
			calldata: new Uint8Array(),
			output: new Uint8Array(),
			returnData: new Uint8Array(),
			stopped: false,
			reverted: false,
			isStatic: false,
			authorized: null,
			callDepth: 0,
			chainId: 5n,
		};

		const error = handler_0x46_CHAINID(frame);

		expect(error).toBe(null);
		expect(frame.stack[0]).toBe(5n);
	});

	it("handles different chain IDs (Arbitrum)", () => {
		const frame: BrandedFrame = {
			__tag: "Frame",
			stack: [],
			memory: new Map(),
			memorySize: 0,
			pc: 0,
			gasRemaining: 1000n,
			bytecode: new Uint8Array([0x46]),
			caller: Address.from("0x0000000000000000000000000000000000000001"),
			address: Address.from("0x0000000000000000000000000000000000000002"),
			value: 0n,
			calldata: new Uint8Array(),
			output: new Uint8Array(),
			returnData: new Uint8Array(),
			stopped: false,
			reverted: false,
			isStatic: false,
			authorized: null,
			callDepth: 0,
			chainId: 42161n,
		};

		const error = handler_0x46_CHAINID(frame);

		expect(error).toBe(null);
		expect(frame.stack[0]).toBe(42161n);
	});

	it("handles different chain IDs (Polygon)", () => {
		const frame: BrandedFrame = {
			__tag: "Frame",
			stack: [],
			memory: new Map(),
			memorySize: 0,
			pc: 0,
			gasRemaining: 1000n,
			bytecode: new Uint8Array([0x46]),
			caller: Address.from("0x0000000000000000000000000000000000000001"),
			address: Address.from("0x0000000000000000000000000000000000000002"),
			value: 0n,
			calldata: new Uint8Array(),
			output: new Uint8Array(),
			returnData: new Uint8Array(),
			stopped: false,
			reverted: false,
			isStatic: false,
			authorized: null,
			callDepth: 0,
			chainId: 137n,
		};

		const error = handler_0x46_CHAINID(frame);

		expect(error).toBe(null);
		expect(frame.stack[0]).toBe(137n);
	});

	it("returns OutOfGas when insufficient gas", () => {
		const frame: BrandedFrame = {
			__tag: "Frame",
			stack: [],
			memory: new Map(),
			memorySize: 0,
			pc: 0,
			gasRemaining: 1n,
			bytecode: new Uint8Array([0x46]),
			caller: Address.from("0x0000000000000000000000000000000000000001"),
			address: Address.from("0x0000000000000000000000000000000000000002"),
			value: 0n,
			calldata: new Uint8Array(),
			output: new Uint8Array(),
			returnData: new Uint8Array(),
			stopped: false,
			reverted: false,
			isStatic: false,
			authorized: null,
			callDepth: 0,
			chainId: 1n,
		};

		const error = handler_0x46_CHAINID(frame);

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
			bytecode: new Uint8Array([0x46]),
			caller: Address.from("0x0000000000000000000000000000000000000001"),
			address: Address.from("0x0000000000000000000000000000000000000002"),
			value: 0n,
			calldata: new Uint8Array(),
			output: new Uint8Array(),
			returnData: new Uint8Array(),
			stopped: false,
			reverted: false,
			isStatic: false,
			authorized: null,
			callDepth: 0,
			chainId: 1n,
		};

		const error = handler_0x46_CHAINID(frame);

		expect(error).toEqual({ type: "StackOverflow" });
		expect(frame.stack).toHaveLength(1024);
	});
});
