import { describe, expect, test } from "vitest";
import { Address } from "../../primitives/Address/index.js";
import { from as createFrame } from "../Frame/from.js";
import { handler_0x00_STOP } from "./0x00_STOP.js";
import { handler_0x5b_JUMPDEST } from "./0x5b_JUMPDEST.js";
import { handler_0x56_JUMP } from "./0x56_JUMP.js";
import { handler_0x57_JUMPI } from "./0x57_JUMPI.js";
import { handler_0x58_PC } from "./0x58_PC.js";
import { handler_0xf3_RETURN } from "./0xf3_RETURN.js";
import { handler_0xfd_REVERT } from "./0xfd_REVERT.js";

describe("Control Flow Opcodes", () => {
	const zeroAddress = Address("0x0000000000000000000000000000000000000000");

	describe("STOP (0x00)", () => {
		test("stops execution", () => {
			const frame = createFrame({
				bytecode: new Uint8Array([0x00]),
				gas: 100n,
				caller: zeroAddress,
				address: zeroAddress,
				value: 0n,
				calldata: new Uint8Array(),
			});

			expect(frame.stopped).toBe(false);
			const err = handler_0x00_STOP(frame);
			expect(err).toBeNull();
			expect(frame.stopped).toBe(true);
		});
	});

	describe("JUMP (0x56)", () => {
		test("jumps to valid JUMPDEST", () => {
			// Bytecode: JUMPDEST at position 5
			const frame = createFrame({
				bytecode: new Uint8Array([0x60, 0x05, 0x56, 0x00, 0x00, 0x5b]),
				gas: 1000n,
				caller: zeroAddress,
				address: zeroAddress,
				value: 0n,
				calldata: new Uint8Array(),
			});

			frame.stack.push(5n); // Jump to position 5
			const err = handler_0x56_JUMP(frame);
			expect(err).toBeNull();
			expect(frame.pc).toBe(5);
		});

		test("fails on invalid jump destination", () => {
			const frame = createFrame({
				bytecode: new Uint8Array([0x60, 0x05, 0x56, 0x00, 0x00, 0x00]),
				gas: 1000n,
				caller: zeroAddress,
				address: zeroAddress,
				value: 0n,
				calldata: new Uint8Array(),
			});

			frame.stack.push(5n); // Position 5 is not JUMPDEST
			const err = handler_0x56_JUMP(frame);
			expect(err).toEqual({ type: "InvalidJump" });
		});

		test("fails on stack underflow", () => {
			const frame = createFrame({
				bytecode: new Uint8Array([0x56]),
				gas: 1000n,
				caller: zeroAddress,
				address: zeroAddress,
				value: 0n,
				calldata: new Uint8Array(),
			});

			const err = handler_0x56_JUMP(frame);
			expect(err).toEqual({ type: "StackUnderflow" });
		});

		test("fails on out of bounds destination", () => {
			const frame = createFrame({
				bytecode: new Uint8Array([0x56]),
				gas: 1000n,
				caller: zeroAddress,
				address: zeroAddress,
				value: 0n,
				calldata: new Uint8Array(),
			});

			frame.stack.push(0x100000000n); // > u32::MAX
			const err = handler_0x56_JUMP(frame);
			expect(err).toEqual({ type: "OutOfBounds" });
		});

		test("consumes gas", () => {
			const frame = createFrame({
				bytecode: new Uint8Array([0x5b]),
				gas: 1000n,
				caller: zeroAddress,
				address: zeroAddress,
				value: 0n,
				calldata: new Uint8Array(),
			});

			frame.stack.push(0n);
			const initialGas = frame.gasRemaining;
			handler_0x56_JUMP(frame);
			expect(frame.gasRemaining).toBe(initialGas - 8n); // MidStep = 8
		});
	});

	describe("JUMPI (0x57)", () => {
		test("jumps when condition is non-zero", () => {
			// Bytecode: JUMPDEST at position 1
			const frame = createFrame({
				bytecode: new Uint8Array([0x57, 0x5b]),
				gas: 1000n,
				caller: zeroAddress,
				address: zeroAddress,
				value: 0n,
				calldata: new Uint8Array(),
			});

			// Stack pushes in reverse: condition, then dest (LIFO)
			frame.stack.push(1n); // Condition (true) - popped second
			frame.stack.push(1n); // Destination - popped first
			const err = handler_0x57_JUMPI(frame);
			expect(err).toBeNull();
			expect(frame.pc).toBe(1);
		});

		test("does not jump when condition is zero", () => {
			const frame = createFrame({
				bytecode: new Uint8Array([0x57, 0x00]),
				gas: 1000n,
				caller: zeroAddress,
				address: zeroAddress,
				value: 0n,
				calldata: new Uint8Array(),
			});

			// Stack pushes in reverse: condition, then dest (LIFO)
			frame.stack.push(0n); // Condition (false) - popped second
			frame.stack.push(1n); // Destination (doesn't matter, invalid) - popped first
			const err = handler_0x57_JUMPI(frame);
			expect(err).toBeNull();
			expect(frame.pc).toBe(1); // pc + 1
		});

		test("fails on invalid jump destination when condition true", () => {
			const frame = createFrame({
				bytecode: new Uint8Array([0x57, 0x00]),
				gas: 1000n,
				caller: zeroAddress,
				address: zeroAddress,
				value: 0n,
				calldata: new Uint8Array(),
			});

			// Stack pushes in reverse: condition, then dest (LIFO)
			frame.stack.push(1n); // Condition (true) - popped second
			frame.stack.push(1n); // Destination (not JUMPDEST) - popped first
			const err = handler_0x57_JUMPI(frame);
			expect(err).toEqual({ type: "InvalidJump" });
		});

		test("consumes gas", () => {
			const frame = createFrame({
				bytecode: new Uint8Array([0x57]),
				gas: 1000n,
				caller: zeroAddress,
				address: zeroAddress,
				value: 0n,
				calldata: new Uint8Array(),
			});

			frame.stack.push(0n);
			frame.stack.push(0n);
			const initialGas = frame.gasRemaining;
			handler_0x57_JUMPI(frame);
			expect(frame.gasRemaining).toBe(initialGas - 10n); // SlowStep = 10
		});
	});

	describe("PC (0x58)", () => {
		test("pushes program counter to stack", () => {
			const frame = createFrame({
				bytecode: new Uint8Array([0x58]),
				gas: 1000n,
				caller: zeroAddress,
				address: zeroAddress,
				value: 0n,
				calldata: new Uint8Array(),
			});

			frame.pc = 42;
			const err = handler_0x58_PC(frame);
			expect(err).toBeNull();
			expect(frame.stack[0]).toBe(42n);
			expect(frame.pc).toBe(43);
		});

		test("consumes gas", () => {
			const frame = createFrame({
				bytecode: new Uint8Array([0x58]),
				gas: 1000n,
				caller: zeroAddress,
				address: zeroAddress,
				value: 0n,
				calldata: new Uint8Array(),
			});

			const initialGas = frame.gasRemaining;
			handler_0x58_PC(frame);
			expect(frame.gasRemaining).toBe(initialGas - 2n); // QuickStep = 2
		});
	});

	describe("JUMPDEST (0x5b)", () => {
		test("increments pc and consumes gas", () => {
			const frame = createFrame({
				bytecode: new Uint8Array([0x5b]),
				gas: 1000n,
				caller: zeroAddress,
				address: zeroAddress,
				value: 0n,
				calldata: new Uint8Array(),
			});

			const initialGas = frame.gasRemaining;
			const err = handler_0x5b_JUMPDEST(frame);
			expect(err).toBeNull();
			expect(frame.pc).toBe(1);
			expect(frame.gasRemaining).toBe(initialGas - 1n); // Jumpdest = 1
		});
	});

	describe("RETURN (0xf3)", () => {
		test("returns empty output", () => {
			const frame = createFrame({
				bytecode: new Uint8Array([0xf3]),
				gas: 1000n,
				caller: zeroAddress,
				address: zeroAddress,
				value: 0n,
				calldata: new Uint8Array(),
			});

			// Stack pushes in reverse: length, then offset (LIFO)
			frame.stack.push(0n); // Length - popped second
			frame.stack.push(0n); // Offset - popped first
			const err = handler_0xf3_RETURN(frame);
			expect(err).toBeNull();
			expect(frame.stopped).toBe(true);
			expect(frame.output.length).toBe(0);
		});

		test("returns memory slice", () => {
			const frame = createFrame({
				bytecode: new Uint8Array([0xf3]),
				gas: 10000n,
				caller: zeroAddress,
				address: zeroAddress,
				value: 0n,
				calldata: new Uint8Array(),
			});

			// Write to memory
			frame.memory.set(0, 0xaa);
			frame.memory.set(1, 0xbb);
			frame.memory.set(2, 0xcc);
			frame.memorySize = 32;

			// Stack pushes in reverse: length, then offset (LIFO)
			frame.stack.push(3n); // Length - popped second
			frame.stack.push(0n); // Offset - popped first
			const err = handler_0xf3_RETURN(frame);
			expect(err).toBeNull();
			expect(frame.stopped).toBe(true);
			expect(frame.output).toEqual(new Uint8Array([0xaa, 0xbb, 0xcc]));
		});

		test("expands memory and charges gas", () => {
			const frame = createFrame({
				bytecode: new Uint8Array([0xf3]),
				gas: 10000n,
				caller: zeroAddress,
				address: zeroAddress,
				value: 0n,
				calldata: new Uint8Array(),
			});

			// Stack pushes in reverse: length, then offset (LIFO)
			frame.stack.push(64n); // Length (2 words) - popped second
			frame.stack.push(0n); // Offset - popped first
			const initialGas = frame.gasRemaining;
			const err = handler_0xf3_RETURN(frame);
			expect(err).toBeNull();
			expect(frame.memorySize).toBe(64);
			expect(frame.gasRemaining).toBeLessThan(initialGas);
		});

		test("fails on stack underflow", () => {
			const frame = createFrame({
				bytecode: new Uint8Array([0xf3]),
				gas: 1000n,
				caller: zeroAddress,
				address: zeroAddress,
				value: 0n,
				calldata: new Uint8Array(),
			});

			const err = handler_0xf3_RETURN(frame);
			expect(err).toEqual({ type: "StackUnderflow" });
		});

		test("fails on out of bounds", () => {
			const frame = createFrame({
				bytecode: new Uint8Array([0xf3]),
				gas: 10000n,
				caller: zeroAddress,
				address: zeroAddress,
				value: 0n,
				calldata: new Uint8Array(),
			});

			// Stack pushes in reverse: length, then offset (LIFO)
			frame.stack.push(1n); // Length - popped second
			frame.stack.push(0x100000000n); // Offset > u32::MAX - popped first
			const err = handler_0xf3_RETURN(frame);
			expect(err).toEqual({ type: "OutOfBounds" });
		});
	});

	describe("REVERT (0xfd)", () => {
		test("reverts with empty output", () => {
			const frame = createFrame({
				bytecode: new Uint8Array([0xfd]),
				gas: 1000n,
				caller: zeroAddress,
				address: zeroAddress,
				value: 0n,
				calldata: new Uint8Array(),
			});

			// Stack pushes in reverse: length, then offset (LIFO)
			frame.stack.push(0n); // Length - popped second
			frame.stack.push(0n); // Offset - popped first
			const err = handler_0xfd_REVERT(frame);
			expect(err).toBeNull();
			expect(frame.reverted).toBe(true);
			expect(frame.output.length).toBe(0);
		});

		test("reverts with memory slice", () => {
			const frame = createFrame({
				bytecode: new Uint8Array([0xfd]),
				gas: 10000n,
				caller: zeroAddress,
				address: zeroAddress,
				value: 0n,
				calldata: new Uint8Array(),
			});

			// Write to memory
			frame.memory.set(0, 0x11);
			frame.memory.set(1, 0x22);
			frame.memory.set(2, 0x33);
			frame.memorySize = 32;

			// Stack pushes in reverse: length, then offset (LIFO)
			frame.stack.push(3n); // Length - popped second
			frame.stack.push(0n); // Offset - popped first
			const err = handler_0xfd_REVERT(frame);
			expect(err).toBeNull();
			expect(frame.reverted).toBe(true);
			expect(frame.output).toEqual(new Uint8Array([0x11, 0x22, 0x33]));
		});

		test("expands memory and charges gas", () => {
			const frame = createFrame({
				bytecode: new Uint8Array([0xfd]),
				gas: 10000n,
				caller: zeroAddress,
				address: zeroAddress,
				value: 0n,
				calldata: new Uint8Array(),
			});

			// Stack pushes in reverse: length, then offset (LIFO)
			frame.stack.push(64n); // Length (2 words) - popped second
			frame.stack.push(0n); // Offset - popped first
			const initialGas = frame.gasRemaining;
			const err = handler_0xfd_REVERT(frame);
			expect(err).toBeNull();
			expect(frame.memorySize).toBe(64);
			expect(frame.gasRemaining).toBeLessThan(initialGas);
		});

		test("fails on stack underflow", () => {
			const frame = createFrame({
				bytecode: new Uint8Array([0xfd]),
				gas: 1000n,
				caller: zeroAddress,
				address: zeroAddress,
				value: 0n,
				calldata: new Uint8Array(),
			});

			const err = handler_0xfd_REVERT(frame);
			expect(err).toEqual({ type: "StackUnderflow" });
		});

		test("fails on out of bounds", () => {
			const frame = createFrame({
				bytecode: new Uint8Array([0xfd]),
				gas: 10000n,
				caller: zeroAddress,
				address: zeroAddress,
				value: 0n,
				calldata: new Uint8Array(),
			});

			// Stack pushes in reverse: length, then offset (LIFO)
			frame.stack.push(1n); // Length - popped second
			frame.stack.push(0x100000000n); // Offset > u32::MAX - popped first
			const err = handler_0xfd_REVERT(frame);
			expect(err).toEqual({ type: "OutOfBounds" });
		});
	});
});
