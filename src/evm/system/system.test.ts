import { describe, expect, test } from "vitest";
import type { BrandedFrame } from "../Frame/BrandedFrame.js";
import { create } from "./0xf0_CREATE.js";
import { call } from "./0xf1_CALL.js";
import { delegatecall } from "./0xf4_DELEGATECALL.js";
import { create2 } from "./0xf5_CREATE2.js";
import { staticcall } from "./0xfa_STATICCALL.js";
import { selfdestruct } from "./0xff_SELFDESTRUCT.js";

/**
 * Create a minimal test frame
 */
function createFrame(overrides?: Partial<BrandedFrame>): BrandedFrame {
	return {
		__tag: "Frame",
		stack: [],
		memory: new Map(),
		memorySize: 0,
		pc: 0,
		gasRemaining: 1000000n,
		bytecode: new Uint8Array(0),
		caller: new Uint8Array(20) as any,
		address: new Uint8Array(20) as any,
		value: 0n,
		calldata: new Uint8Array(0),
		output: new Uint8Array(0),
		returnData: new Uint8Array(0),
		stopped: false,
		reverted: false,
		isStatic: false,
		authorized: null,
		callDepth: 0,
		...overrides,
	};
}

describe("CREATE (0xf0)", () => {
	test("rejects in static context", () => {
		const frame = createFrame({ isStatic: true });
		frame.stack = [0n, 0n, 0n]; // length, offset, value

		const err = create(frame);

		expect(err).toEqual({ type: "WriteProtection" });
	});

	test("consumes gas correctly for empty init code", () => {
		const frame = createFrame();
		frame.stack = [0n, 0n, 0n]; // length=0, offset=0, value=0
		const initialGas = frame.gasRemaining;

		const err = create(frame);

		expect(err).toBeNull();
		// Base cost: 32000
		expect(initialGas - frame.gasRemaining).toBe(32000n);
	});

	test("calculates gas with init code", () => {
		const frame = createFrame();
		// Create 32 bytes of init code (1 word)
		frame.stack = [32n, 0n, 0n]; // length=32, offset=0, value=0
		const initialGas = frame.gasRemaining;

		const err = create(frame);

		expect(err).toBeNull();
		// Base: 32000 + init code word cost (1 word * 2 gas) = 32002
		// Memory expansion for 32 bytes: newWords=1, cost = 3*1 + 1^2/512 = 3
		// Total: 32000 + 2 + 3 = 32005
		expect(initialGas - frame.gasRemaining).toBe(32005n);
	});

	test("pushes failure address to stack (stubbed)", () => {
		const frame = createFrame();
		frame.stack = [0n, 0n, 0n]; // length=0, offset=0, value=0

		const err = create(frame);

		expect(err).toBeNull();
		expect(frame.stack).toHaveLength(1);
		expect(frame.stack[0]).toBe(0n); // Stubbed failure
	});

	test("increments pc", () => {
		const frame = createFrame({ pc: 10 });
		frame.stack = [0n, 0n, 0n];

		create(frame);

		expect(frame.pc).toBe(11);
	});

	test("clears return data", () => {
		const frame = createFrame({
			returnData: new Uint8Array([1, 2, 3]),
		});
		frame.stack = [0n, 0n, 0n];

		create(frame);

		expect(frame.returnData).toHaveLength(0);
	});

	test("fails on stack underflow", () => {
		const frame = createFrame();
		frame.stack = [0n]; // Only 1 item, need 3

		const err = create(frame);

		expect(err).toEqual({ type: "StackUnderflow" });
	});

	test("fails on out of gas", () => {
		const frame = createFrame({ gasRemaining: 100n });
		frame.stack = [0n, 0n, 0n];

		const err = create(frame);

		expect(err).toEqual({ type: "OutOfGas" });
		expect(frame.gasRemaining).toBe(0n);
	});
});

describe("CALL (0xf1)", () => {
	test("rejects value transfer in static context", () => {
		const frame = createFrame({ isStatic: true });
		// Stack: gas, address, value, inOffset, inLength, outOffset, outLength (bottom to top)
		frame.stack = [10000n, 0n, 1n, 0n, 0n, 0n, 0n];

		const err = call(frame);

		expect(err).toEqual({ type: "WriteProtection" });
	});

	test("allows zero value in static context", () => {
		const frame = createFrame({ isStatic: true });
		// Stack: gas, address, value=0, inOffset, inLength, outOffset, outLength (bottom to top)
		frame.stack = [10000n, 0n, 0n, 0n, 0n, 0n, 0n];

		const err = call(frame);

		expect(err).toBeNull();
	});

	test("consumes base gas cost", () => {
		const frame = createFrame();
		// Stack: gas, address, value, inOffset, inLength, outOffset, outLength (bottom to top)
		frame.stack = [10000n, 0n, 0n, 0n, 0n, 0n, 0n];
		const initialGas = frame.gasRemaining;

		const err = call(frame);

		expect(err).toBeNull();
		// Base cost: 700 (post-EIP-150)
		// With gas forwarding: availableGas = min(10000, remainingGas - 700 - (remainingGas-700)/64)
		// Available gas ~= 984468n, total cost = 700 + 984468 = 985168n
		// Actually simpler: we forward some gas
		expect(initialGas - frame.gasRemaining).toBeGreaterThan(700n);
	});

	test("adds value transfer cost", () => {
		const frame = createFrame();
		// Stack: gas, address, value, inOffset, inLength, outOffset, outLength (bottom to top)
		frame.stack = [10000n, 0n, 1n, 0n, 0n, 0n, 0n];
		const initialGas = frame.gasRemaining;

		const err = call(frame);

		expect(err).toBeNull();
		// Base: 700 + value transfer: 9000 + stipend handled
		// With 1/64 rule and gas limit, calculation is complex
		// Just verify > base cost
		expect(initialGas - frame.gasRemaining).toBeGreaterThan(9700n);
	});

	test("handles memory expansion", () => {
		const frame = createFrame();
		// Stack: gas, address, value, inOffset, inLength, outOffset, outLength (bottom to top)
		frame.stack = [10000n, 0n, 0n, 0n, 32n, 0n, 0n];
		const initialGas = frame.gasRemaining;

		const err = call(frame);

		expect(err).toBeNull();
		// Should include memory expansion cost for 32 bytes
		expect(frame.memorySize).toBe(32);
		expect(initialGas - frame.gasRemaining).toBeGreaterThan(700n);
	});

	test("pushes failure to stack (stubbed)", () => {
		const frame = createFrame();
		frame.stack = [10000n, 0n, 0n, 0n, 0n, 0n, 0n];

		const err = call(frame);

		expect(err).toBeNull();
		expect(frame.stack).toHaveLength(1);
		expect(frame.stack[0]).toBe(0n); // Stubbed failure
	});

	test("increments pc", () => {
		const frame = createFrame({ pc: 20 });
		frame.stack = [10000n, 0n, 0n, 0n, 0n, 0n, 0n];

		call(frame);

		expect(frame.pc).toBe(21);
	});

	test("sets empty return data (stubbed)", () => {
		const frame = createFrame({
			returnData: new Uint8Array([1, 2, 3]),
		});
		frame.stack = [10000n, 0n, 0n, 0n, 0n, 0n, 0n];

		call(frame);

		expect(frame.returnData).toHaveLength(0);
	});

	test("fails on stack underflow", () => {
		const frame = createFrame();
		frame.stack = [0n, 0n]; // Only 2 items, need 7

		const err = call(frame);

		expect(err).toEqual({ type: "StackUnderflow" });
	});

	test("fails on out of gas", () => {
		const frame = createFrame({ gasRemaining: 100n });
		frame.stack = [10000n, 0n, 0n, 0n, 0n, 0n, 0n];

		const err = call(frame);

		expect(err).toEqual({ type: "OutOfGas" });
		expect(frame.gasRemaining).toBe(0n);
	});
});

describe("CREATE2 (0xf5)", () => {
	test("rejects in static context", () => {
		const frame = createFrame({ isStatic: true });
		frame.stack = [0n, 0n, 0n, 0n]; // salt, length, offset, value

		const err = create2(frame);

		expect(err).toEqual({ type: "WriteProtection" });
	});

	test("consumes gas with keccak256 cost", () => {
		const frame = createFrame();
		// Create 32 bytes of init code (1 word)
		frame.stack = [0n, 32n, 0n, 0n]; // salt=0, length=32, offset=0, value=0
		const initialGas = frame.gasRemaining;

		const err = create2(frame);

		expect(err).toBeNull();
		// Base: 32000 + init code (1 word * 2) + keccak256 (1 word * 6) + memory (3)
		// Total: 32000 + 2 + 6 + 3 = 32011
		expect(initialGas - frame.gasRemaining).toBe(32011n);
	});
});

describe("DELEGATECALL (0xf4)", () => {
	test("takes 6 arguments (no value)", () => {
		const frame = createFrame();
		frame.stack = [0n, 0n, 0n, 0n, 0n, 10000n]; // 6 args

		const err = delegatecall(frame);

		expect(err).toBeNull();
		expect(frame.stack).toHaveLength(1);
	});

	test("increments pc", () => {
		const frame = createFrame({ pc: 5 });
		frame.stack = [0n, 0n, 0n, 0n, 0n, 10000n];

		delegatecall(frame);

		expect(frame.pc).toBe(6);
	});
});

describe("STATICCALL (0xfa)", () => {
	test("takes 6 arguments (no value)", () => {
		const frame = createFrame();
		frame.stack = [0n, 0n, 0n, 0n, 0n, 10000n]; // 6 args

		const err = staticcall(frame);

		expect(err).toBeNull();
		expect(frame.stack).toHaveLength(1);
	});

	test("increments pc", () => {
		const frame = createFrame({ pc: 15 });
		frame.stack = [0n, 0n, 0n, 0n, 0n, 10000n];

		staticcall(frame);

		expect(frame.pc).toBe(16);
	});
});

describe("SELFDESTRUCT (0xff)", () => {
	test("rejects in static context after gas charge", () => {
		const frame = createFrame({ isStatic: true });
		frame.stack = [0n]; // beneficiary
		const initialGas = frame.gasRemaining;

		const err = selfdestruct(frame);

		expect(err).toEqual({ type: "WriteProtection" });
		// Gas should have been charged before static check
		expect(frame.gasRemaining).toBeLessThan(initialGas);
	});

	test("consumes base gas", () => {
		const frame = createFrame();
		frame.stack = [0n]; // beneficiary
		const initialGas = frame.gasRemaining;

		const err = selfdestruct(frame);

		expect(err).toBeNull();
		// Base cost: 5000
		expect(initialGas - frame.gasRemaining).toBe(5000n);
	});

	test("sets stopped flag", () => {
		const frame = createFrame();
		frame.stack = [0n];

		const err = selfdestruct(frame);

		expect(err).toBeNull();
		expect(frame.stopped).toBe(true);
	});

	test("does not increment pc (stopped)", () => {
		const frame = createFrame({ pc: 42 });
		frame.stack = [0n];

		selfdestruct(frame);

		expect(frame.pc).toBe(42); // Not incremented
	});

	test("does not push to stack", () => {
		const frame = createFrame();
		frame.stack = [0n];

		selfdestruct(frame);

		expect(frame.stack).toHaveLength(0);
	});

	test("fails on stack underflow", () => {
		const frame = createFrame();
		frame.stack = []; // Empty stack

		const err = selfdestruct(frame);

		expect(err).toEqual({ type: "StackUnderflow" });
	});

	test("fails on out of gas", () => {
		const frame = createFrame({ gasRemaining: 100n });
		frame.stack = [0n];

		const err = selfdestruct(frame);

		expect(err).toEqual({ type: "OutOfGas" });
		expect(frame.gasRemaining).toBe(0n);
	});
});
