import { describe, it, expect } from "vitest";
import { address } from "./0x30_ADDRESS.js";
import type { BrandedFrame } from "../Frame/BrandedFrame.js";
import { Address } from "../../primitives/Address/index.js";

function createFrame(
	address: Uint8Array,
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
		address: address as any,
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

describe("ADDRESS (0x30)", () => {
	it("pushes current address to stack", () => {
		const addr = Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
		const frame = createFrame(addr);
		const err = address(frame);

		expect(err).toBeNull();
		expect(frame.stack.length).toBe(1);
		expect(frame.stack[0]).toBe(Address.toU256(addr));
		expect(frame.pc).toBe(1);
	});

	it("pushes zero address correctly", () => {
		const addr = Address.zero();
		const frame = createFrame(addr);
		const err = address(frame);

		expect(err).toBeNull();
		expect(frame.stack.length).toBe(1);
		expect(frame.stack[0]).toBe(0n);
		expect(frame.pc).toBe(1);
	});

	it("pushes max address correctly", () => {
		const addr = Address.fromNumber((1n << 160n) - 1n);
		const frame = createFrame(addr);
		const err = address(frame);

		expect(err).toBeNull();
		expect(frame.stack.length).toBe(1);
		expect(frame.stack[0]).toBe((1n << 160n) - 1n);
		expect(frame.pc).toBe(1);
	});

	it("returns OutOfGas when insufficient gas", () => {
		const addr = Address.zero();
		const frame = createFrame(addr, [], 1n);
		const err = address(frame);

		expect(err).toEqual({ type: "OutOfGas" });
		expect(frame.gasRemaining).toBe(0n);
		expect(frame.pc).toBe(0);
	});

	it("consumes correct gas amount (2)", () => {
		const addr = Address.zero();
		const frame = createFrame(addr, [], 100n);
		const err = address(frame);

		expect(err).toBeNull();
		expect(frame.gasRemaining).toBe(98n);
	});

	it("returns StackOverflow when stack is full", () => {
		const addr = Address.zero();
		const fullStack = new Array(1024).fill(0n);
		const frame = createFrame(addr, fullStack);
		const err = address(frame);

		expect(err).toEqual({ type: "StackOverflow" });
		expect(frame.pc).toBe(0);
	});
});
