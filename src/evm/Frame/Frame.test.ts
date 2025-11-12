import { describe, expect, it } from "vitest";
import { Address } from "../../primitives/Address/index.js";
import { consumeGas } from "./consumeGas.js";
import { createTestFrame } from "./createTestFrame.js";
import { from } from "./from.js";
import { memoryExpansionCost } from "./memoryExpansionCost.js";
import { popStack } from "./popStack.js";
import { pushStack } from "./pushStack.js";
import { readMemory } from "./readMemory.js";
import { writeMemory } from "./writeMemory.js";

describe("Frame.from", () => {
	it("creates frame with required parameters", () => {
		const bytecode = new Uint8Array([0x60, 0x01, 0x60, 0x02]);
		const gas = 100000n;
		const caller = Address.from("0x0000000000000000000000000000000000000001");
		const address = Address.from("0x0000000000000000000000000000000000000002");
		const value = 1000n;
		const calldata = new Uint8Array([0x00, 0x01, 0x02, 0x03]);

		const frame = from({
			bytecode,
			gas,
			caller,
			address,
			value,
			calldata,
		});

		expect(frame.__tag).toBe("Frame");
		expect(frame.bytecode).toBe(bytecode);
		expect(frame.gasRemaining).toBe(gas);
		expect(frame.caller).toBe(caller);
		expect(frame.address).toBe(address);
		expect(frame.value).toBe(value);
		expect(frame.calldata).toBe(calldata);
		expect(frame.pc).toBe(0);
		expect(frame.stack).toEqual([]);
		expect(frame.memory.size).toBe(0);
		expect(frame.memorySize).toBe(0);
		expect(frame.stopped).toBe(false);
		expect(frame.reverted).toBe(false);
		expect(frame.isStatic).toBe(false);
		expect(frame.authorized).toBe(null);
		expect(frame.callDepth).toBe(0);
	});

	it("creates frame with isStatic flag", () => {
		const frame = createTestFrame({ isStatic: true });
		expect(frame.isStatic).toBe(true);
	});

	it("initializes empty output and returnData", () => {
		const frame = createTestFrame();
		expect(frame.output).toBeInstanceOf(Uint8Array);
		expect(frame.output.length).toBe(0);
		expect(frame.returnData).toBeInstanceOf(Uint8Array);
		expect(frame.returnData.length).toBe(0);
	});
});

describe("Frame.pushStack", () => {
	it("pushes value onto empty stack", () => {
		const frame = createTestFrame();
		const err = pushStack(frame, 42n);
		expect(err).toBe(null);
		expect(frame.stack).toEqual([42n]);
	});

	it("pushes multiple values", () => {
		const frame = createTestFrame();
		pushStack(frame, 1n);
		pushStack(frame, 2n);
		pushStack(frame, 3n);
		expect(frame.stack).toEqual([1n, 2n, 3n]);
	});

	it("returns StackOverflow when stack is full", () => {
		const frame = createTestFrame();
		for (let i = 0; i < 1024; i++) {
			pushStack(frame, BigInt(i));
		}
		const err = pushStack(frame, 1025n);
		expect(err).toEqual({ type: "StackOverflow" });
		expect(frame.stack.length).toBe(1024);
	});

	it("handles large bigint values", () => {
		const frame = createTestFrame();
		const largeValue = 2n ** 256n - 1n;
		const err = pushStack(frame, largeValue);
		expect(err).toBe(null);
		expect(frame.stack[0]).toBe(largeValue);
	});

	it("handles zero value", () => {
		const frame = createTestFrame();
		const err = pushStack(frame, 0n);
		expect(err).toBe(null);
		expect(frame.stack[0]).toBe(0n);
	});
});

describe("Frame.popStack", () => {
	it("pops value from stack", () => {
		const frame = createTestFrame();
		pushStack(frame, 42n);
		const result = popStack(frame);
		expect(result.error).toBe(null);
		expect(result.value).toBe(42n);
		expect(frame.stack).toEqual([]);
	});

	it("pops values in LIFO order", () => {
		const frame = createTestFrame();
		pushStack(frame, 1n);
		pushStack(frame, 2n);
		pushStack(frame, 3n);

		const result1 = popStack(frame);
		expect(result1.value).toBe(3n);

		const result2 = popStack(frame);
		expect(result2.value).toBe(2n);

		const result3 = popStack(frame);
		expect(result3.value).toBe(1n);

		expect(frame.stack).toEqual([]);
	});

	it("returns StackUnderflow when stack is empty", () => {
		const frame = createTestFrame();
		const result = popStack(frame);
		expect(result.value).toBe(null);
		expect(result.error).toEqual({ type: "StackUnderflow" });
	});

	it("handles popping after overflow attempt", () => {
		const frame = createTestFrame();
		for (let i = 0; i < 1024; i++) {
			pushStack(frame, BigInt(i));
		}
		pushStack(frame, 1025n);

		const result = popStack(frame);
		expect(result.value).toBe(1023n);
		expect(result.error).toBe(null);
	});
});

describe("Frame.consumeGas", () => {
	it("consumes gas from frame", () => {
		const frame = createTestFrame({ gas: 100n });
		const err = consumeGas(frame, 30n);
		expect(err).toBe(null);
		expect(frame.gasRemaining).toBe(70n);
	});

	it("consumes all remaining gas", () => {
		const frame = createTestFrame({ gas: 100n });
		const err = consumeGas(frame, 100n);
		expect(err).toBe(null);
		expect(frame.gasRemaining).toBe(0n);
	});

	it("returns OutOfGas when insufficient gas", () => {
		const frame = createTestFrame({ gas: 50n });
		const err = consumeGas(frame, 100n);
		expect(err).toEqual({ type: "OutOfGas" });
		expect(frame.gasRemaining).toBe(0n);
	});

	it("sets gasRemaining to 0 on OutOfGas", () => {
		const frame = createTestFrame({ gas: 10n });
		consumeGas(frame, 50n);
		expect(frame.gasRemaining).toBe(0n);
	});

	it("handles multiple gas consumption operations", () => {
		const frame = createTestFrame({ gas: 1000n });
		consumeGas(frame, 100n);
		consumeGas(frame, 200n);
		consumeGas(frame, 300n);
		expect(frame.gasRemaining).toBe(400n);
	});

	it("prevents gas consumption after OutOfGas", () => {
		const frame = createTestFrame({ gas: 10n });
		consumeGas(frame, 20n);
		const err = consumeGas(frame, 5n);
		expect(err).toEqual({ type: "OutOfGas" });
		expect(frame.gasRemaining).toBe(0n);
	});
});

describe("Frame.readMemory", () => {
	it("reads uninitialized memory as 0", () => {
		const frame = createTestFrame();
		expect(readMemory(frame, 0)).toBe(0);
		expect(readMemory(frame, 100)).toBe(0);
		expect(readMemory(frame, 1000)).toBe(0);
	});

	it("reads written value", () => {
		const frame = createTestFrame();
		writeMemory(frame, 10, 0xab);
		expect(readMemory(frame, 10)).toBe(0xab);
	});

	it("reads multiple written values", () => {
		const frame = createTestFrame();
		writeMemory(frame, 0, 0x11);
		writeMemory(frame, 1, 0x22);
		writeMemory(frame, 2, 0x33);

		expect(readMemory(frame, 0)).toBe(0x11);
		expect(readMemory(frame, 1)).toBe(0x22);
		expect(readMemory(frame, 2)).toBe(0x33);
	});

	it("reads sparse memory correctly", () => {
		const frame = createTestFrame();
		writeMemory(frame, 0, 0xff);
		writeMemory(frame, 100, 0xaa);

		expect(readMemory(frame, 0)).toBe(0xff);
		expect(readMemory(frame, 50)).toBe(0);
		expect(readMemory(frame, 100)).toBe(0xaa);
	});
});

describe("Frame.writeMemory", () => {
	it("writes byte to memory", () => {
		const frame = createTestFrame();
		writeMemory(frame, 0, 0x42);
		expect(readMemory(frame, 0)).toBe(0x42);
	});

	it("masks value to single byte", () => {
		const frame = createTestFrame();
		writeMemory(frame, 0, 0x1234);
		expect(readMemory(frame, 0)).toBe(0x34);
	});

	it("updates memorySize for first write", () => {
		const frame = createTestFrame();
		expect(frame.memorySize).toBe(0);
		writeMemory(frame, 0, 0x42);
		expect(frame.memorySize).toBe(32);
	});

	it("updates memorySize with word alignment", () => {
		const frame = createTestFrame();
		writeMemory(frame, 31, 0x42);
		expect(frame.memorySize).toBe(32);

		writeMemory(frame, 32, 0x42);
		expect(frame.memorySize).toBe(64);

		writeMemory(frame, 63, 0x42);
		expect(frame.memorySize).toBe(64);

		writeMemory(frame, 64, 0x42);
		expect(frame.memorySize).toBe(96);
	});

	it("handles overwriting existing values", () => {
		const frame = createTestFrame();
		writeMemory(frame, 10, 0xaa);
		expect(readMemory(frame, 10)).toBe(0xaa);

		writeMemory(frame, 10, 0xbb);
		expect(readMemory(frame, 10)).toBe(0xbb);
	});

	it("writes at large offsets", () => {
		const frame = createTestFrame();
		writeMemory(frame, 10000, 0x99);
		expect(readMemory(frame, 10000)).toBe(0x99);
		expect(frame.memorySize).toBe(10016);
	});
});

describe("Frame.memoryExpansionCost", () => {
	it("returns 0 for no expansion", () => {
		const frame = createTestFrame();
		writeMemory(frame, 0, 0x00);
		expect(frame.memorySize).toBe(32);

		const cost = memoryExpansionCost(frame, 32);
		expect(cost).toBe(0n);
	});

	it("returns 0 for access within current size", () => {
		const frame = createTestFrame();
		writeMemory(frame, 31, 0x00);
		expect(frame.memorySize).toBe(32);

		const cost = memoryExpansionCost(frame, 16);
		expect(cost).toBe(0n);
	});

	it("calculates cost for first expansion (0 to 32 bytes)", () => {
		const frame = createTestFrame();
		const cost = memoryExpansionCost(frame, 32);
		const words = 1n;
		const expected = words * 3n + (words * words) / 512n;
		expect(cost).toBe(expected);
		expect(cost).toBe(3n);
	});

	it("calculates cost for expansion from 32 to 64 bytes", () => {
		const frame = createTestFrame();
		writeMemory(frame, 0, 0x00);
		expect(frame.memorySize).toBe(32);

		const cost = memoryExpansionCost(frame, 64);
		const newWords = 2n;
		const oldWords = 1n;
		const newCost = newWords * 3n + (newWords * newWords) / 512n;
		const oldCost = oldWords * 3n + (oldWords * oldWords) / 512n;
		const expected = newCost - oldCost;
		expect(cost).toBe(expected);
		expect(cost).toBe(3n);
	});

	it("calculates cost for larger expansions", () => {
		const frame = createTestFrame();
		const cost = memoryExpansionCost(frame, 1024);
		const words = 32n;
		const expected = words * 3n + (words * words) / 512n;
		expect(cost).toBe(expected);
		expect(cost).toBe(98n);
	});

	it("handles non-word-aligned sizes", () => {
		const frame = createTestFrame();
		const cost1 = memoryExpansionCost(frame, 33);
		const cost2 = memoryExpansionCost(frame, 64);
		expect(cost1).toBe(cost2);
	});

	it("returns MAX_SAFE_INTEGER for memory over 16MB", () => {
		const frame = createTestFrame();
		const cost = memoryExpansionCost(frame, 0x1000001);
		expect(cost).toBe(BigInt(Number.MAX_SAFE_INTEGER));
	});

	it("quadratic cost scaling verification", () => {
		const frame = createTestFrame();

		const cost1k = memoryExpansionCost(frame, 1024);
		writeMemory(frame, 1023, 0x00);
		const cost2k = memoryExpansionCost(frame, 2048);

		expect(cost2k).toBeGreaterThan(cost1k);
	});

	it("handles edge case at 16MB boundary", () => {
		const frame = createTestFrame();
		const cost = memoryExpansionCost(frame, 0x1000000);
		expect(cost).toBeLessThan(BigInt(Number.MAX_SAFE_INTEGER));
	});
});

describe("Frame integration", () => {
	it("simulates simple stack operations", () => {
		const frame = createTestFrame({ gas: 1000n });

		pushStack(frame, 10n);
		pushStack(frame, 20n);
		consumeGas(frame, 6n);

		const result1 = popStack(frame);
		expect(result1.value).toBe(20n);

		const result2 = popStack(frame);
		expect(result2.value).toBe(10n);

		expect(frame.gasRemaining).toBe(994n);
	});

	it("simulates memory write and read", () => {
		const frame = createTestFrame({ gas: 1000n });

		writeMemory(frame, 0, 0xde);
		writeMemory(frame, 1, 0xad);
		writeMemory(frame, 2, 0xbe);
		writeMemory(frame, 3, 0xef);

		const memCost = memoryExpansionCost(frame, 32);
		expect(memCost).toBe(0n);

		expect(readMemory(frame, 0)).toBe(0xde);
		expect(readMemory(frame, 1)).toBe(0xad);
		expect(readMemory(frame, 2)).toBe(0xbe);
		expect(readMemory(frame, 3)).toBe(0xef);
	});

	it("handles out of gas during complex operation", () => {
		const frame = createTestFrame({ gas: 5n });

		consumeGas(frame, 3n);
		expect(frame.gasRemaining).toBe(2n);

		const err = consumeGas(frame, 10n);
		expect(err).toEqual({ type: "OutOfGas" });
		expect(frame.gasRemaining).toBe(0n);

		const pushErr = pushStack(frame, 42n);
		expect(pushErr).toBe(null);
	});

	it("simulates PUSH/POP cycle", () => {
		const frame = createTestFrame();
		const values = [1n, 2n, 3n, 4n, 5n];

		for (const val of values) {
			pushStack(frame, val);
		}

		for (let i = values.length - 1; i >= 0; i--) {
			const result = popStack(frame);
			expect(result.value).toBe(values[i]);
		}

		const emptyResult = popStack(frame);
		expect(emptyResult.error).toEqual({ type: "StackUnderflow" });
	});

	it("simulates memory expansion with gas accounting", () => {
		const frame = createTestFrame({ gas: 100n });

		const cost1 = memoryExpansionCost(frame, 32);
		consumeGas(frame, cost1);
		writeMemory(frame, 0, 0xff);

		const remaining1 = frame.gasRemaining;

		const cost2 = memoryExpansionCost(frame, 64);
		consumeGas(frame, cost2);
		writeMemory(frame, 32, 0xaa);

		const remaining2 = frame.gasRemaining;

		expect(remaining1).toBeGreaterThan(remaining2);
		expect(frame.memorySize).toBe(64);
	});
});

describe("createTestFrame utility", () => {
	it("creates frame with defaults", () => {
		const frame = createTestFrame();
		expect(frame.__tag).toBe("Frame");
		expect(frame.gasRemaining).toBe(1000000n);
		expect(frame.bytecode.length).toBe(0);
		expect(frame.calldata.length).toBe(0);
		expect(frame.value).toBe(0n);
		expect(frame.isStatic).toBe(false);
	});

	it("overrides bytecode", () => {
		const bytecode = new Uint8Array([0x60, 0x01]);
		const frame = createTestFrame({ bytecode });
		expect(frame.bytecode).toBe(bytecode);
	});

	it("overrides gas", () => {
		const frame = createTestFrame({ gas: 5000n });
		expect(frame.gasRemaining).toBe(5000n);
	});

	it("overrides addresses", () => {
		const caller = Address.from("0x1111111111111111111111111111111111111111");
		const address = Address.from("0x2222222222222222222222222222222222222222");
		const frame = createTestFrame({ caller, address });
		expect(frame.caller).toBe(caller);
		expect(frame.address).toBe(address);
	});

	it("overrides value", () => {
		const frame = createTestFrame({ value: 999n });
		expect(frame.value).toBe(999n);
	});

	it("overrides calldata", () => {
		const calldata = new Uint8Array([0x11, 0x22, 0x33]);
		const frame = createTestFrame({ calldata });
		expect(frame.calldata).toBe(calldata);
	});

	it("overrides isStatic", () => {
		const frame = createTestFrame({ isStatic: true });
		expect(frame.isStatic).toBe(true);
	});
});
