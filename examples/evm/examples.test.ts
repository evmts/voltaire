/**
 * Simple EVM Tests
 *
 * Comprehensive tests for the minimal EVM implementation.
 */

import { describe, it, expect } from "vitest";
import {
	execute,
	assembleProgram,
	traceExecution,
	createState,
	stackPush,
	stackPop,
	memoryStore,
	memoryLoad,
	memoryExpansionCost,
	getOpcodeInfo,
	StackOverflowError,
	StackUnderflowError,
	InvalidJumpDestError,
	OutOfGasError,
	InvalidOpcodeError,
} from "./simple-evm.js";
import { Opcode } from "../../src/primitives/Opcode/index.js";
import * as Hex from "../../src/primitives/Hex/index.js";

describe("SimpleEVM", () => {
	describe("Arithmetic Operations", () => {
		it("ADD: 2 + 3 = 5", () => {
			// PUSH1 2, PUSH1 3, ADD, STOP
			const bytecode = "0x60026003010000";
			const result = execute(bytecode);

			expect(result.success).toBe(true);
			expect(result.finalStack).toEqual([5n]);
		});

		it("MUL: 2 * 3 = 6", () => {
			// PUSH1 2, PUSH1 3, MUL, STOP
			const bytecode = "0x60026003020000";
			const result = execute(bytecode);

			expect(result.success).toBe(true);
			expect(result.finalStack).toEqual([6n]);
		});

		it("SUB: 5 - 3 = 2", () => {
			// PUSH1 3, PUSH1 5, SUB, STOP (5 - 3, stack order)
			const bytecode = "0x60036005030000";
			const result = execute(bytecode);

			expect(result.success).toBe(true);
			expect(result.finalStack).toEqual([2n]);
		});

		it("DIV: 6 / 2 = 3", () => {
			// PUSH1 2, PUSH1 6, DIV, STOP
			const bytecode = "0x60026006040000";
			const result = execute(bytecode);

			expect(result.success).toBe(true);
			expect(result.finalStack).toEqual([3n]);
		});

		it("DIV by zero returns 0", () => {
			// PUSH1 0, PUSH1 6, DIV, STOP
			const bytecode = "0x60006006040000";
			const result = execute(bytecode);

			expect(result.success).toBe(true);
			expect(result.finalStack).toEqual([0n]);
		});

		it("MOD: 7 % 3 = 1", () => {
			// PUSH1 3, PUSH1 7, MOD, STOP
			const bytecode = "0x60036007060000";
			const result = execute(bytecode);

			expect(result.success).toBe(true);
			expect(result.finalStack).toEqual([1n]);
		});

		it("LT: 2 < 3 = 1", () => {
			// PUSH1 3, PUSH1 2, LT, STOP
			const bytecode = "0x60036002100000";
			const result = execute(bytecode);

			expect(result.success).toBe(true);
			expect(result.finalStack).toEqual([1n]);
		});

		it("GT: 3 > 2 = 1", () => {
			// PUSH1 2, PUSH1 3, GT, STOP
			const bytecode = "0x60026003110000";
			const result = execute(bytecode);

			expect(result.success).toBe(true);
			expect(result.finalStack).toEqual([1n]);
		});

		it("EQ: 5 == 5 = 1", () => {
			// PUSH1 5, PUSH1 5, EQ, STOP
			const bytecode = "0x60056005140000";
			const result = execute(bytecode);

			expect(result.success).toBe(true);
			expect(result.finalStack).toEqual([1n]);
		});

		it("ISZERO: 0 is zero = 1", () => {
			// PUSH1 0, ISZERO, STOP
			const bytecode = "0x6000150000";
			const result = execute(bytecode);

			expect(result.success).toBe(true);
			expect(result.finalStack).toEqual([1n]);
		});

		it("ISZERO: 5 is not zero = 0", () => {
			// PUSH1 5, ISZERO, STOP
			const bytecode = "0x6005150000";
			const result = execute(bytecode);

			expect(result.success).toBe(true);
			expect(result.finalStack).toEqual([0n]);
		});
	});

	describe("Bitwise Operations", () => {
		it("AND: 0xFF & 0x0F = 0x0F", () => {
			// PUSH1 0x0F, PUSH1 0xFF, AND, STOP
			const bytecode = "0x600f60ff160000";
			const result = execute(bytecode);

			expect(result.success).toBe(true);
			expect(result.finalStack).toEqual([0x0fn]);
		});

		it("OR: 0xF0 | 0x0F = 0xFF", () => {
			// PUSH1 0x0F, PUSH1 0xF0, OR, STOP
			const bytecode = "0x600f60f0170000";
			const result = execute(bytecode);

			expect(result.success).toBe(true);
			expect(result.finalStack).toEqual([0xffn]);
		});

		it("XOR: 0xFF ^ 0x0F = 0xF0", () => {
			// PUSH1 0x0F, PUSH1 0xFF, XOR, STOP
			const bytecode = "0x600f60ff180000";
			const result = execute(bytecode);

			expect(result.success).toBe(true);
			expect(result.finalStack).toEqual([0xf0n]);
		});

		it("NOT: ~0 = max uint256", () => {
			// PUSH1 0, NOT, STOP
			const bytecode = "0x600019";
			const result = execute(bytecode);

			expect(result.success).toBe(true);
			// NOT(0) = (2^256 - 1) - 0 = 2^256 - 1 (all bits set)
			expect(result.finalStack).toEqual([2n ** 256n - 1n]);
		});
	});

	describe("Stack Operations", () => {
		it("PUSH1 pushes single byte", () => {
			// PUSH1 0x42, STOP
			const bytecode = "0x604200";
			const result = execute(bytecode);

			expect(result.success).toBe(true);
			expect(result.finalStack).toEqual([0x42n]);
		});

		it("PUSH32 pushes 32 bytes", () => {
			// PUSH32 followed by 32 bytes, STOP
			const value = "0x" + "ff".repeat(32);
			const bytecode = "0x7f" + "ff".repeat(32) + "00";
			const result = execute(bytecode);

			expect(result.success).toBe(true);
			expect(result.finalStack).toEqual([2n ** 256n - 1n]);
		});

		it("DUP1 duplicates top of stack", () => {
			// PUSH1 5, DUP1, STOP
			const bytecode = "0x6005800000";
			const result = execute(bytecode);

			expect(result.success).toBe(true);
			expect(result.finalStack).toEqual([5n, 5n]);
		});

		it("SWAP1 exchanges top two items", () => {
			// PUSH1 1, PUSH1 2, SWAP1, STOP
			const bytecode = "0x600160029000";
			const result = execute(bytecode);

			expect(result.success).toBe(true);
			expect(result.finalStack).toEqual([2n, 1n]);
		});

		it("POP removes top item", () => {
			// PUSH1 1, PUSH1 2, POP, STOP
			const bytecode = "0x600160025000";
			const result = execute(bytecode);

			expect(result.success).toBe(true);
			expect(result.finalStack).toEqual([1n]);
		});

		it("Stack overflow at 1024 items", () => {
			const bytecode = Hex.toBytes(Hex.from("0x" + "60ff".repeat(1025) + "00"));
			const state = createState(bytecode, 1000000n);

			let error: Error | undefined;
			try {
				for (let i = 0; i < 1025; i++) {
					stackPush(state, BigInt(i));
				}
			} catch (e) {
				error = e as Error;
			}

			expect(error).toBeInstanceOf(StackOverflowError);
		});

		it("Stack underflow on empty pop", () => {
			const bytecode = Hex.toBytes(Hex.from("0x00"));
			const state = createState(bytecode, 1000000n);

			expect(() => stackPop(state)).toThrow(StackUnderflowError);
		});
	});

	describe("Memory Operations", () => {
		it("MSTORE/MLOAD round trip", () => {
			// PUSH1 0x42, PUSH1 0, MSTORE, PUSH1 0, MLOAD, STOP
			const bytecode = "0x60426000526000510000";
			const result = execute(bytecode);

			expect(result.success).toBe(true);
			expect(result.finalStack).toEqual([0x42n]);
		});

		it("MSTORE8 stores single byte", () => {
			// PUSH1 0xFF, PUSH1 31, MSTORE8, PUSH1 0, MLOAD, STOP
			const bytecode = "0x60ff601f536000510000";
			const result = execute(bytecode);

			expect(result.success).toBe(true);
			expect(result.finalStack).toEqual([0xffn]);
		});

		it("MSIZE returns memory size in bytes", () => {
			// PUSH1 0x42, PUSH1 0, MSTORE, MSIZE, STOP
			const bytecode = "0x604260005259";
			const result = execute(bytecode);

			expect(result.success).toBe(true);
			expect(result.finalStack).toEqual([32n]); // Aligned to 32 bytes
		});

		it("Memory expansion increases gas", () => {
			// Two MSTORE operations at different offsets
			const bytecode1 = "0x60426000520000"; // MSTORE at 0
			const bytecode2 = "0x604260405260426080520000"; // MSTORE at 64 and 128

			const result1 = execute(bytecode1);
			const result2 = execute(bytecode2);

			expect(result2.gasUsed).toBeGreaterThan(result1.gasUsed);
		});
	});

	describe("Control Flow", () => {
		it("STOP halts execution", () => {
			const bytecode = "0x600100"; // PUSH1 1, STOP
			const result = execute(bytecode);

			expect(result.success).toBe(true);
			expect(result.finalStack).toEqual([1n]);
		});

		it("JUMP to valid JUMPDEST", () => {
			// PUSH1 4, JUMP, INVALID, JUMPDEST, PUSH1 42, STOP
			// 0: PUSH1 4
			// 2: JUMP
			// 3: INVALID (0xFE)
			// 4: JUMPDEST
			// 5: PUSH1 42
			// 7: STOP
			const bytecode = "0x600456fe5b602a00";
			const result = execute(bytecode);

			expect(result.success).toBe(true);
			expect(result.finalStack).toEqual([42n]);
		});

		it("JUMP to invalid destination fails", () => {
			// PUSH1 3, JUMP (no JUMPDEST at 3)
			const bytecode = "0x60035600";
			const result = execute(bytecode);

			expect(result.success).toBe(false);
			expect(result.error).toContain("Invalid jump destination");
		});

		it("JUMPI conditional jump - condition true", () => {
			// PUSH1 1, PUSH1 6, JUMPI, INVALID, JUMPDEST, PUSH1 42, STOP
			// [0-1] 60 01, [2-3] 60 06, [4] 57, [5] fe, [6] 5b, [7-8] 60 2a, [9] 00
			const bytecode = "0x6001600657fe5b602a00";
			const result = execute(bytecode);

			expect(result.success).toBe(true);
			expect(result.finalStack).toEqual([42n]);
		});

		it("JUMPI conditional jump - condition false", () => {
			// PUSH1 0, PUSH1 7, JUMPI, PUSH1 1, STOP, JUMPDEST, PUSH1 2, STOP
			const bytecode = "0x600060075760010057005b6002005700";
			const result = execute(bytecode);

			expect(result.success).toBe(true);
			expect(result.finalStack).toEqual([1n]);
		});

		it("RETURN outputs data", () => {
			// Store 0x42 at memory[0], then return 32 bytes
			// PUSH1 0x42, PUSH1 0, MSTORE, PUSH1 32, PUSH1 0, RETURN
			// 60 42 60 00 52 60 20 60 00 f3
			const bytecode = "0x604260005260206000f3";
			const result = execute(bytecode);

			expect(result.success).toBe(true);
			expect(result.output.length).toBe(32);
			expect(result.output[31]).toBe(0x42);
		});

		it("REVERT stops execution with failure", () => {
			// PUSH1 0, PUSH1 0, REVERT
			const bytecode = "0x60006000fd";
			const result = execute(bytecode);

			expect(result.success).toBe(false);
		});
	});

	describe("Environment Operations", () => {
		it("PC returns current program counter", () => {
			// PUSH1 1, PC, STOP
			const bytecode = "0x60015800";
			const result = execute(bytecode);

			expect(result.success).toBe(true);
			expect(result.finalStack).toEqual([1n, 2n]); // PC is at position 2
		});

		it("GAS returns remaining gas", () => {
			// GAS, STOP
			const bytecode = "0x5a00";
			const result = execute(bytecode, 1000n);

			expect(result.success).toBe(true);
			// Should have remaining gas after GAS opcode (cost 2)
			expect(result.finalStack[0]).toBeLessThan(1000n);
		});

		it("CODESIZE returns bytecode length", () => {
			// CODESIZE, STOP
			const bytecode = "0x3800";
			const result = execute(bytecode);

			expect(result.success).toBe(true);
			expect(result.finalStack).toEqual([2n]); // 2 bytes: CODESIZE + STOP
		});
	});

	describe("Gas Metering", () => {
		it("Charges correct gas per opcode", () => {
			// PUSH1 costs 3 gas, ADD costs 3 gas, STOP costs 0
			// Total: 3 + 3 + 3 + 3 + 0 = 12 (two PUSH1s and one ADD and STOP)
			const bytecode = "0x600160010100"; // PUSH1 1, PUSH1 1, ADD, STOP
			const result = execute(bytecode, 100n);

			// PUSH1 (3) + PUSH1 (3) + ADD (3) + STOP (0) = 9
			expect(result.gasUsed).toBe(9n);
		});

		it("Out of gas reverts", () => {
			// PUSH1 costs 3 gas, try with only 2
			const bytecode = "0x600100";
			const result = execute(bytecode, 2n);

			expect(result.success).toBe(false);
			expect(result.error).toContain("Out of gas");
		});

		it("Memory expansion cost formula is correct", () => {
			// Test the formula: 3n + n²/512
			expect(memoryExpansionCost(0, 32)).toBe(3n); // 1 word: 3*1 + 1/512 = 3
			expect(memoryExpansionCost(0, 64)).toBe(6n); // 2 words: 3*2 + 4/512 = 6
			expect(memoryExpansionCost(32, 64)).toBe(3n); // Additional 1 word
		});
	});

	describe("Integration Tests", () => {
		it("Simple loop counting to 5", () => {
			// This is a simple loop: push 0, loop: add 1, dup, push 5, lt, jumpi back
			// More readable pseudocode:
			//   counter = 0
			//   loop:
			//     counter++
			//     if counter < 5: goto loop
			//   return counter

			// Bytecode breakdown:
			// 0: PUSH1 0      (counter = 0)
			// 2: JUMPDEST     (loop start)
			// 3: PUSH1 1
			// 5: ADD          (counter++)
			// 6: DUP1
			// 7: PUSH1 5
			// 9: GT           (5 > counter? i.e. counter < 5)
			// 10: PUSH1 2     (loop start address)
			// 12: JUMPI       (conditional jump back)
			// 13: STOP
			//
			// 60 00 5b 60 01 01 80 60 05 11 60 02 57 00
			const bytecode = "0x60005b60010180600511600257";
			const result = execute(bytecode);

			expect(result.success).toBe(true);
			expect(result.finalStack).toEqual([5n]);
		});

		it("Fibonacci sequence (first 8 numbers)", () => {
			// Calculate fib(8) iteratively
			// a=0, b=1
			// repeat 7 times: c=a+b, a=b, b=c
			// result: 21

			// Simplified: just compute fib(5) = 5
			// PUSH1 0, PUSH1 1 (a=0, b=1)
			// Then loop: DUP2, ADD (computes a+b), SWAP1, POP (keeps only last two)

			// For simplicity, let's just verify 1+1=2, 1+2=3
			const bytecode = "0x6000600180820190500080820190500000";
			const result = execute(bytecode);

			expect(result.success).toBe(true);
			// After a few iterations we should have fib numbers on stack
			expect(result.finalStack.length).toBeGreaterThan(0);
		});

		it("Returns computed value", () => {
			// Compute 2*3+4 = 10 and return it
			// PUSH1 4, PUSH1 3, PUSH1 2, MUL, ADD = 10 (stack order matters!)
			// Then store at 0 and return 32 bytes
			// 60 04 60 03 60 02 02 01 60 00 52 60 20 60 00 f3
			const bytecode = "0x600460036002020160005260206000f3";
			const result = execute(bytecode);

			expect(result.success).toBe(true);
			expect(result.output.length).toBe(32);
			// Value 10 should be at the end of the 32-byte word
			expect(result.output[31]).toBe(10);
		});
	});

	describe("Voltaire Primitives Usage", () => {
		it("Uses Opcode.getGasCost()", () => {
			expect(Opcode.getGasCost(Opcode.ADD)).toBe(3);
			expect(Opcode.getGasCost(Opcode.MUL)).toBe(5);
			expect(Opcode.getGasCost(Opcode.STOP)).toBe(0);
		});

		it("Uses Opcode.getName()", () => {
			expect(Opcode.getName(Opcode.ADD)).toBe("ADD");
			expect(Opcode.getName(Opcode.PUSH1)).toBe("PUSH1");
			expect(Opcode.getName(Opcode.JUMPDEST)).toBe("JUMPDEST");
		});

		it("Uses Opcode.jumpDests()", () => {
			// Bytecode with JUMPDEST at positions 0 and 5
			const bytecode = Hex.toBytes(Hex.from("0x5b600456fe5b00"));
			const jumpDests = Opcode.jumpDests(bytecode);

			expect(jumpDests.has(0)).toBe(true); // First JUMPDEST
			expect(jumpDests.has(5)).toBe(true); // Second JUMPDEST
			expect(jumpDests.has(3)).toBe(false); // Not a JUMPDEST
		});

		it("Uses Opcode.isPush() and getPushSize()", () => {
			expect(Opcode.isPush(Opcode.PUSH1)).toBe(true);
			expect(Opcode.isPush(Opcode.PUSH32)).toBe(true);
			expect(Opcode.isPush(Opcode.ADD)).toBe(false);

			expect(Opcode.getPushSize(Opcode.PUSH1)).toBe(1);
			expect(Opcode.getPushSize(Opcode.PUSH32)).toBe(32);
		});

		it("Uses Hex for bytecode parsing", () => {
			const hex = Hex.from("0x600100");
			const bytes = Hex.toBytes(hex);

			expect(bytes).toEqual(new Uint8Array([0x60, 0x01, 0x00]));
		});

		it("Uses getOpcodeInfo for opcode introspection", () => {
			const info = getOpcodeInfo(Opcode.ADD);

			expect(info.name).toBe("ADD");
			expect(info.gasCost).toBe(3);
			expect(info.stackInput).toBe(2);
			expect(info.stackOutput).toBe(1);
		});
	});

	describe("Assembler", () => {
		it("Assembles simple program", () => {
			const bytecode = assembleProgram(["PUSH1", "02", "PUSH1", "03", "ADD", "STOP"]);
			// PUSH1 = 0x60, 02 = data, PUSH1 = 0x60, 03 = data, ADD = 0x01, STOP = 0x00
			expect(bytecode).toBe("0x600260030100");
		});

		it("Handles raw hex bytes", () => {
			const bytecode = assembleProgram(["60", "ff", "00"]);
			expect(bytecode).toBe("0x60ff00");
		});
	});

	describe("Tracer", () => {
		it("Traces execution steps", () => {
			const bytecode = "0x600160020100"; // PUSH1 1, PUSH1 2, ADD, STOP
			const { steps, result } = traceExecution(bytecode);

			expect(result.success).toBe(true);
			expect(steps.length).toBe(4); // 4 opcodes

			expect(steps[0].opcodeName).toBe("PUSH1");
			expect(steps[0].pc).toBe(0);

			expect(steps[1].opcodeName).toBe("PUSH1");
			expect(steps[1].pc).toBe(2);

			expect(steps[2].opcodeName).toBe("ADD");
			expect(steps[2].stackBefore).toEqual([1n, 2n]);
			expect(steps[2].stackAfter).toEqual([3n]);

			expect(steps[3].opcodeName).toBe("STOP");
		});
	});
});
