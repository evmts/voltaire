/**
 * Tests for EVM Opcode module
 */

import { describe, expect, it } from "vitest";
import * as Opcode from "../Opcode.js";

// ============================================================================
// Opcode Info Tests
// ============================================================================

describe("Opcode.info", () => {
	it("returns info for valid opcodes", () => {
		const addInfo = Opcode.info(Opcode.ADD);
		expect(addInfo).toBeDefined();
		expect(addInfo?.name).toBe("ADD");
		expect(addInfo?.gasCost).toBe(3);
		expect(addInfo?.stackInputs).toBe(2);
		expect(addInfo?.stackOutputs).toBe(1);
	});

	it("returns info for STOP", () => {
		const stopInfo = Opcode.info(Opcode.STOP);
		expect(stopInfo).toBeDefined();
		expect(stopInfo?.name).toBe("STOP");
		expect(stopInfo?.gasCost).toBe(0);
		expect(stopInfo?.stackInputs).toBe(0);
		expect(stopInfo?.stackOutputs).toBe(0);
	});

	it("returns info for complex opcodes", () => {
		const callInfo = Opcode.info(Opcode.CALL);
		expect(callInfo).toBeDefined();
		expect(callInfo?.name).toBe("CALL");
		expect(callInfo?.stackInputs).toBe(7);
		expect(callInfo?.stackOutputs).toBe(1);
	});

	it("returns undefined for invalid opcodes", () => {
		const invalid = Opcode.info(0x0c as any);
		expect(invalid).toBeUndefined();
	});
});

describe("Opcode.name", () => {
	it("returns correct names for opcodes", () => {
		expect(Opcode.name(Opcode.ADD)).toBe("ADD");
		expect(Opcode.name(Opcode.PUSH1)).toBe("PUSH1");
		expect(Opcode.name(Opcode.JUMPDEST)).toBe("JUMPDEST");
	});

	it("returns UNKNOWN for invalid opcodes", () => {
		expect(Opcode.name(0x0c as any)).toBe("UNKNOWN");
	});

	it("works with this: pattern", () => {
		expect(Opcode.name(Opcode.SUB)).toBe("SUB");
	});
});

describe("Opcode.isValid", () => {
	it("validates defined opcodes", () => {
		expect(Opcode.isValid(0x01)).toBe(true); // ADD
		expect(Opcode.isValid(0x60)).toBe(true); // PUSH1
		expect(Opcode.isValid(0xff)).toBe(true); // SELFDESTRUCT
	});

	it("rejects undefined opcodes", () => {
		expect(Opcode.isValid(0x0c)).toBe(false);
		expect(Opcode.isValid(0x0d)).toBe(false);
		expect(Opcode.isValid(0x21)).toBe(false);
	});

	it("works with this: pattern", () => {
		expect(Opcode.isValid(0x01)).toBe(true);
		expect(Opcode.isValid(0x0c)).toBe(false);
	});
});

// ============================================================================
// Category Tests
// ============================================================================

describe("Opcode.isPush", () => {
	it("identifies PUSH0", () => {
		expect(Opcode.isPush(Opcode.PUSH0)).toBe(true);
	});

	it("identifies PUSH1-PUSH32", () => {
		expect(Opcode.isPush(Opcode.PUSH1)).toBe(true);
		expect(Opcode.isPush(Opcode.PUSH16)).toBe(true);
		expect(Opcode.isPush(Opcode.PUSH32)).toBe(true);
	});

	it("rejects non-PUSH opcodes", () => {
		expect(Opcode.isPush(Opcode.ADD)).toBe(false);
		expect(Opcode.isPush(Opcode.DUP1)).toBe(false);
		expect(Opcode.isPush(Opcode.SWAP1)).toBe(false);
	});

	it("works with this: pattern", () => {
		expect(Opcode.isPush(Opcode.PUSH1)).toBe(true);
		expect(Opcode.isPush(Opcode.ADD)).toBe(false);
	});
});

describe("Opcode.isDup", () => {
	it("identifies DUP1-DUP16", () => {
		expect(Opcode.isDup(Opcode.DUP1)).toBe(true);
		expect(Opcode.isDup(Opcode.DUP8)).toBe(true);
		expect(Opcode.isDup(Opcode.DUP16)).toBe(true);
	});

	it("rejects non-DUP opcodes", () => {
		expect(Opcode.isDup(Opcode.ADD)).toBe(false);
		expect(Opcode.isDup(Opcode.PUSH1)).toBe(false);
		expect(Opcode.isDup(Opcode.SWAP1)).toBe(false);
	});

	it("works with this: pattern", () => {
		expect(Opcode.isDup(Opcode.DUP1)).toBe(true);
		expect(Opcode.isDup(Opcode.ADD)).toBe(false);
	});
});

describe("Opcode.isSwap", () => {
	it("identifies SWAP1-SWAP16", () => {
		expect(Opcode.isSwap(Opcode.SWAP1)).toBe(true);
		expect(Opcode.isSwap(Opcode.SWAP8)).toBe(true);
		expect(Opcode.isSwap(Opcode.SWAP16)).toBe(true);
	});

	it("rejects non-SWAP opcodes", () => {
		expect(Opcode.isSwap(Opcode.ADD)).toBe(false);
		expect(Opcode.isSwap(Opcode.PUSH1)).toBe(false);
		expect(Opcode.isSwap(Opcode.DUP1)).toBe(false);
	});

	it("works with this: pattern", () => {
		expect(Opcode.isSwap(Opcode.SWAP1)).toBe(true);
		expect(Opcode.isSwap(Opcode.ADD)).toBe(false);
	});
});

describe("Opcode.isLog", () => {
	it("identifies LOG0-LOG4", () => {
		expect(Opcode.isLog(Opcode.LOG0)).toBe(true);
		expect(Opcode.isLog(Opcode.LOG1)).toBe(true);
		expect(Opcode.isLog(Opcode.LOG4)).toBe(true);
	});

	it("rejects non-LOG opcodes", () => {
		expect(Opcode.isLog(Opcode.ADD)).toBe(false);
		expect(Opcode.isLog(Opcode.PUSH1)).toBe(false);
	});

	it("works with this: pattern", () => {
		expect(Opcode.isLog(Opcode.LOG1)).toBe(true);
		expect(Opcode.isLog(Opcode.ADD)).toBe(false);
	});
});

describe("Opcode.isTerminating", () => {
	it("identifies terminating opcodes", () => {
		expect(Opcode.isTerminating(Opcode.STOP)).toBe(true);
		expect(Opcode.isTerminating(Opcode.RETURN)).toBe(true);
		expect(Opcode.isTerminating(Opcode.REVERT)).toBe(true);
		expect(Opcode.isTerminating(Opcode.INVALID)).toBe(true);
		expect(Opcode.isTerminating(Opcode.SELFDESTRUCT)).toBe(true);
	});

	it("rejects non-terminating opcodes", () => {
		expect(Opcode.isTerminating(Opcode.ADD)).toBe(false);
		expect(Opcode.isTerminating(Opcode.JUMP)).toBe(false);
	});

	it("works with this: pattern", () => {
		expect(Opcode.isTerminating(Opcode.RETURN)).toBe(true);
		expect(Opcode.isTerminating(Opcode.ADD)).toBe(false);
	});
});

describe("Opcode.isJump", () => {
	it("identifies JUMP and JUMPI", () => {
		expect(Opcode.isJump(Opcode.JUMP)).toBe(true);
		expect(Opcode.isJump(Opcode.JUMPI)).toBe(true);
	});

	it("rejects non-jump opcodes", () => {
		expect(Opcode.isJump(Opcode.JUMPDEST)).toBe(false);
		expect(Opcode.isJump(Opcode.ADD)).toBe(false);
	});

	it("works with this: pattern", () => {
		expect(Opcode.isJump(Opcode.JUMP)).toBe(true);
		expect(Opcode.isJump(Opcode.ADD)).toBe(false);
	});
});

// ============================================================================
// PUSH Operations Tests
// ============================================================================

describe("Opcode.pushBytes", () => {
	it("returns 0 for PUSH0", () => {
		expect(Opcode.pushBytes(Opcode.PUSH0)).toBe(0);
	});

	it("returns correct byte counts for PUSH1-PUSH32", () => {
		expect(Opcode.pushBytes(Opcode.PUSH1)).toBe(1);
		expect(Opcode.pushBytes(Opcode.PUSH2)).toBe(2);
		expect(Opcode.pushBytes(Opcode.PUSH16)).toBe(16);
		expect(Opcode.pushBytes(Opcode.PUSH32)).toBe(32);
	});

	it("returns undefined for non-PUSH opcodes", () => {
		expect(Opcode.pushBytes(Opcode.ADD)).toBeUndefined();
		expect(Opcode.pushBytes(Opcode.DUP1)).toBeUndefined();
	});

	it("works with this: pattern", () => {
		expect(Opcode.pushBytes(Opcode.PUSH1)).toBe(1);
		expect(Opcode.pushBytes(Opcode.ADD)).toBeUndefined();
	});
});

describe("Opcode.pushOpcode", () => {
	it("returns PUSH0 for 0 bytes", () => {
		expect(Opcode.pushOpcode(0)).toBe(Opcode.PUSH0);
	});

	it("returns correct PUSH opcodes for byte counts", () => {
		expect(Opcode.pushOpcode(1)).toBe(Opcode.PUSH1);
		expect(Opcode.pushOpcode(2)).toBe(Opcode.PUSH2);
		expect(Opcode.pushOpcode(16)).toBe(Opcode.PUSH16);
		expect(Opcode.pushOpcode(32)).toBe(Opcode.PUSH32);
	});

	it("throws for invalid byte counts", () => {
		expect(() => Opcode.pushOpcode(-1)).toThrow("Invalid PUSH size");
		expect(() => Opcode.pushOpcode(33)).toThrow("Invalid PUSH size");
	});

	it("works with this: pattern", () => {
		expect(Opcode.pushOpcode(1)).toBe(Opcode.PUSH1);
	});
});

// ============================================================================
// DUP/SWAP/LOG Operations Tests
// ============================================================================

describe("Opcode.dupPosition", () => {
	it("returns correct positions for DUP opcodes", () => {
		expect(Opcode.dupPosition(Opcode.DUP1)).toBe(1);
		expect(Opcode.dupPosition(Opcode.DUP8)).toBe(8);
		expect(Opcode.dupPosition(Opcode.DUP16)).toBe(16);
	});

	it("returns undefined for non-DUP opcodes", () => {
		expect(Opcode.dupPosition(Opcode.ADD)).toBeUndefined();
	});

	it("works with this: pattern", () => {
		expect(Opcode.dupPosition(Opcode.DUP1)).toBe(1);
	});
});

describe("Opcode.swapPosition", () => {
	it("returns correct positions for SWAP opcodes", () => {
		expect(Opcode.swapPosition(Opcode.SWAP1)).toBe(1);
		expect(Opcode.swapPosition(Opcode.SWAP8)).toBe(8);
		expect(Opcode.swapPosition(Opcode.SWAP16)).toBe(16);
	});

	it("returns undefined for non-SWAP opcodes", () => {
		expect(Opcode.swapPosition(Opcode.ADD)).toBeUndefined();
	});

	it("works with this: pattern", () => {
		expect(Opcode.swapPosition(Opcode.SWAP1)).toBe(1);
	});
});

describe("Opcode.logTopics", () => {
	it("returns correct topic counts for LOG opcodes", () => {
		expect(Opcode.logTopics(Opcode.LOG0)).toBe(0);
		expect(Opcode.logTopics(Opcode.LOG1)).toBe(1);
		expect(Opcode.logTopics(Opcode.LOG4)).toBe(4);
	});

	it("returns undefined for non-LOG opcodes", () => {
		expect(Opcode.logTopics(Opcode.ADD)).toBeUndefined();
	});

	it("works with this: pattern", () => {
		expect(Opcode.logTopics(Opcode.LOG1)).toBe(1);
	});
});

// ============================================================================
// Bytecode Parsing Tests
// ============================================================================

describe("Opcode.parse", () => {
	it("parses simple bytecode", () => {
		const bytecode = new Uint8Array([0x60, 0x01, 0x60, 0x02, 0x01]);
		const instructions = Opcode.parse(bytecode);

		expect(instructions).toHaveLength(3);
		expect(instructions[0]!.opcode).toBe(Opcode.PUSH1);
		expect(instructions[0]!.offset).toBe(0);
		expect(instructions[0]!.immediate).toEqual(new Uint8Array([0x01]));

		expect(instructions[1]!.opcode).toBe(Opcode.PUSH1);
		expect(instructions[1]!.offset).toBe(2);
		expect(instructions[1]!.immediate).toEqual(new Uint8Array([0x02]));

		expect(instructions[2]!.opcode).toBe(Opcode.ADD);
		expect(instructions[2]!.offset).toBe(4);
		expect(instructions[2]!.immediate).toBeUndefined();
	});

	it("parses PUSH0", () => {
		const bytecode = new Uint8Array([0x5f, 0x01]);
		const instructions = Opcode.parse(bytecode);

		expect(instructions).toHaveLength(2);
		expect(instructions[0]!.opcode).toBe(Opcode.PUSH0);
		expect(instructions[0]!.immediate).toBeUndefined();
	});

	it("parses PUSH32", () => {
		const bytecode = new Uint8Array([0x7f, ...new Array(32).fill(0xff)]);
		const instructions = Opcode.parse(bytecode);

		expect(instructions).toHaveLength(1);
		expect(instructions[0]!.opcode).toBe(Opcode.PUSH32);
		expect(instructions[0]!.immediate).toHaveLength(32);
	});

	it("handles truncated PUSH data", () => {
		const bytecode = new Uint8Array([0x60]); // PUSH1 without data
		const instructions = Opcode.parse(bytecode);

		expect(instructions).toHaveLength(1);
		expect(instructions[0]!.opcode).toBe(Opcode.PUSH1);
		expect(instructions[0]!.immediate).toHaveLength(0);
	});

	it("parses empty bytecode", () => {
		const bytecode = new Uint8Array([]);
		const instructions = Opcode.parse(bytecode);
		expect(instructions).toHaveLength(0);
	});

	it("works with this: pattern", () => {
		const bytecode = new Uint8Array([0x60, 0x01, 0x01]);
		const instructions = Opcode.parse(bytecode);
		expect(instructions).toHaveLength(2);
	});
});

describe("Opcode.format", () => {
	it("formats simple opcodes", () => {
		const inst: Opcode.Instruction = {
			offset: 0,
			opcode: Opcode.ADD,
		};
		expect(Opcode.format(inst)).toBe("0x0000: ADD");
	});

	it("formats PUSH with immediate data", () => {
		const inst: Opcode.Instruction = {
			offset: 10,
			opcode: Opcode.PUSH1,
			immediate: new Uint8Array([0x42]),
		};
		expect(Opcode.format(inst)).toBe("0x000a: PUSH1 0x42");
	});

	it("formats PUSH32 with full data", () => {
		const inst: Opcode.Instruction = {
			offset: 0,
			opcode: Opcode.PUSH32,
			immediate: new Uint8Array(32).fill(0xff),
		};
		const result = Opcode.format(inst);
		expect(result).toContain("PUSH32");
		expect(result).toContain("ff".repeat(32));
	});

	it("works with this: pattern", () => {
		const inst: Opcode.Instruction = {
			offset: 0,
			opcode: Opcode.ADD,
		};
		expect(Opcode.format(inst)).toBe("0x0000: ADD");
	});
});

describe("Opcode.disassemble", () => {
	it("disassembles bytecode to strings", () => {
		const bytecode = new Uint8Array([0x60, 0x01, 0x60, 0x02, 0x01]);
		const asm = Opcode.disassemble(bytecode);

		expect(asm).toHaveLength(3);
		expect(asm[0]).toBe("0x0000: PUSH1 0x01");
		expect(asm[1]).toBe("0x0002: PUSH1 0x02");
		expect(asm[2]).toBe("0x0004: ADD");
	});

	it("handles complex bytecode", () => {
		const bytecode = new Uint8Array([
			0x60,
			0x80, // PUSH1 0x80
			0x60,
			0x40, // PUSH1 0x40
			0x52, // MSTORE
		]);
		const asm = Opcode.disassemble(bytecode);

		expect(asm).toHaveLength(3);
		expect(asm[0]).toBe("0x0000: PUSH1 0x80");
		expect(asm[1]).toBe("0x0002: PUSH1 0x40");
		expect(asm[2]).toBe("0x0004: MSTORE");
	});
});

// ============================================================================
// Jump Destination Analysis Tests
// ============================================================================

describe("Opcode.jumpDests", () => {
	it("finds JUMPDEST opcodes", () => {
		const bytecode = new Uint8Array([0x5b, 0x60, 0x01, 0x5b]);
		const dests = Opcode.jumpDests(bytecode);

		expect(dests.size).toBe(2);
		expect(dests.has(0)).toBe(true);
		expect(dests.has(3)).toBe(true);
	});

	it("ignores JUMPDEST in immediate data", () => {
		const bytecode = new Uint8Array([
			0x60,
			0x5b, // PUSH1 0x5b (JUMPDEST value, but in data)
			0x5b, // JUMPDEST (real)
		]);
		const dests = Opcode.jumpDests(bytecode);

		expect(dests.size).toBe(1);
		expect(dests.has(2)).toBe(true);
		expect(dests.has(1)).toBe(false);
	});

	it("handles bytecode with no JUMPDESTs", () => {
		const bytecode = new Uint8Array([0x60, 0x01, 0x60, 0x02, 0x01]);
		const dests = Opcode.jumpDests(bytecode);
		expect(dests.size).toBe(0);
	});

	it("works with this: pattern", () => {
		const bytecode = new Uint8Array([0x5b]);
		const dests = Opcode.jumpDests(bytecode);
		expect(dests.has(0)).toBe(true);
	});
});

describe("Opcode.isValidJumpDest", () => {
	it("validates JUMPDEST locations", () => {
		const bytecode = new Uint8Array([0x5b, 0x60, 0x01, 0x5b]);

		expect(Opcode.isValidJumpDest(bytecode, 0)).toBe(true);
		expect(Opcode.isValidJumpDest(bytecode, 3)).toBe(true);
	});

	it("rejects non-JUMPDEST locations", () => {
		const bytecode = new Uint8Array([0x5b, 0x60, 0x01, 0x5b]);

		expect(Opcode.isValidJumpDest(bytecode, 1)).toBe(false);
		expect(Opcode.isValidJumpDest(bytecode, 2)).toBe(false);
	});

	it("rejects JUMPDEST in immediate data", () => {
		const bytecode = new Uint8Array([0x60, 0x5b]);
		expect(Opcode.isValidJumpDest(bytecode, 1)).toBe(false);
	});

	it("works with this: pattern", () => {
		const bytecode = new Uint8Array([0x5b]);
		expect(Opcode.isValidJumpDest(bytecode, 0)).toBe(true);
	});
});

// ============================================================================
// Edge Cases and Comprehensive Tests
// ============================================================================

describe("Opcode edge cases", () => {
	it("validates all arithmetic opcodes", () => {
		const ops = [
			Opcode.ADD,
			Opcode.MUL,
			Opcode.SUB,
			Opcode.DIV,
			Opcode.SDIV,
			Opcode.MOD,
			Opcode.SMOD,
			Opcode.ADDMOD,
			Opcode.MULMOD,
			Opcode.EXP,
			Opcode.SIGNEXTEND,
		];

		for (const op of ops) {
			expect(Opcode.isValid(op)).toBe(true);
			expect(Opcode.info(op)).toBeDefined();
		}
	});

	it("validates all comparison opcodes", () => {
		const ops = [
			Opcode.LT,
			Opcode.GT,
			Opcode.SLT,
			Opcode.SGT,
			Opcode.EQ,
			Opcode.ISZERO,
		];

		for (const op of ops) {
			expect(Opcode.isValid(op)).toBe(true);
			expect(Opcode.info(op)).toBeDefined();
		}
	});

	it("validates all bitwise opcodes", () => {
		const ops = [
			Opcode.AND,
			Opcode.OR,
			Opcode.XOR,
			Opcode.NOT,
			Opcode.BYTE,
			Opcode.SHL,
			Opcode.SHR,
			Opcode.SAR,
		];

		for (const op of ops) {
			expect(Opcode.isValid(op)).toBe(true);
			expect(Opcode.info(op)).toBeDefined();
		}
	});

	it("validates all storage/memory opcodes", () => {
		const ops = [
			Opcode.MLOAD,
			Opcode.MSTORE,
			Opcode.MSTORE8,
			Opcode.SLOAD,
			Opcode.SSTORE,
			Opcode.TLOAD,
			Opcode.TSTORE,
			Opcode.MCOPY,
		];

		for (const op of ops) {
			expect(Opcode.isValid(op)).toBe(true);
			expect(Opcode.info(op)).toBeDefined();
		}
	});

	it("validates all block information opcodes", () => {
		const ops = [
			Opcode.BLOCKHASH,
			Opcode.COINBASE,
			Opcode.TIMESTAMP,
			Opcode.NUMBER,
			Opcode.DIFFICULTY,
			Opcode.GASLIMIT,
			Opcode.CHAINID,
			Opcode.SELFBALANCE,
			Opcode.BASEFEE,
			Opcode.BLOBHASH,
			Opcode.BLOBBASEFEE,
		];

		for (const op of ops) {
			expect(Opcode.isValid(op)).toBe(true);
			expect(Opcode.info(op)).toBeDefined();
		}
	});

	it("validates all system opcodes", () => {
		const ops = [
			Opcode.CREATE,
			Opcode.CALL,
			Opcode.CALLCODE,
			Opcode.RETURN,
			Opcode.DELEGATECALL,
			Opcode.CREATE2,
			Opcode.STATICCALL,
			Opcode.REVERT,
			Opcode.SELFDESTRUCT,
		];

		for (const op of ops) {
			expect(Opcode.isValid(op)).toBe(true);
			expect(Opcode.info(op)).toBeDefined();
		}
	});

	it("validates EIP-3074 opcodes", () => {
		expect(Opcode.isValid(Opcode.AUTH)).toBe(true);
		expect(Opcode.isValid(Opcode.AUTHCALL)).toBe(true);
	});

	it("correctly identifies stack requirements for DUP opcodes", () => {
		for (let i = 0; i < 16; i++) {
			const dupCode = (0x80 + i) as any;
			const info = Opcode.info(dupCode);
			expect(info?.stackInputs).toBe(i + 1);
			expect(info?.stackOutputs).toBe(i + 2);
		}
	});

	it("correctly identifies stack requirements for SWAP opcodes", () => {
		for (let i = 0; i < 16; i++) {
			const swapCode = (0x90 + i) as any;
			const info = Opcode.info(swapCode);
			expect(info?.stackInputs).toBe(i + 2);
			expect(info?.stackOutputs).toBe(i + 2);
		}
	});

	it("correctly calculates gas for LOG opcodes", () => {
		expect(Opcode.info(Opcode.LOG0)?.gasCost).toBe(375);
		expect(Opcode.info(Opcode.LOG1)?.gasCost).toBe(750);
		expect(Opcode.info(Opcode.LOG2)?.gasCost).toBe(1125);
		expect(Opcode.info(Opcode.LOG3)?.gasCost).toBe(1500);
		expect(Opcode.info(Opcode.LOG4)?.gasCost).toBe(1875);
	});
});

describe("Opcode stack analysis", () => {
	it("detects potential stack underflow", () => {
		const info = Opcode.info(Opcode.ADD);
		const stackSize = 1;

		expect(info).toBeDefined();
		if (info) {
			const wouldUnderflow = stackSize < info.stackInputs;
			expect(wouldUnderflow).toBe(true);
		}
	});

	it("calculates stack change", () => {
		const addInfo = Opcode.info(Opcode.ADD);
		expect(addInfo).toBeDefined();
		if (addInfo) {
			const stackChange = addInfo.stackOutputs - addInfo.stackInputs;
			expect(stackChange).toBe(-1); // 2 inputs, 1 output
		}

		const push1Info = Opcode.info(Opcode.PUSH1);
		expect(push1Info).toBeDefined();
		if (push1Info) {
			const stackChange = push1Info.stackOutputs - push1Info.stackInputs;
			expect(stackChange).toBe(1); // 0 inputs, 1 output
		}
	});
});

describe("Opcode gas estimation", () => {
	it("estimates gas for simple sequence", () => {
		const bytecode = new Uint8Array([
			0x60,
			0x01, // PUSH1 0x01
			0x60,
			0x02, // PUSH1 0x02
			0x01, // ADD
		]);

		const instructions = Opcode.parse(bytecode);
		let totalGas = 0;

		for (const inst of instructions) {
			const info = Opcode.info(inst.opcode);
			if (info) {
				totalGas += info.gasCost;
			}
		}

		expect(totalGas).toBe(9); // 3 + 3 + 3
	});

	it("accounts for complex operations", () => {
		const info = Opcode.info(Opcode.SSTORE);
		expect(info?.gasCost).toBe(100); // Base cost
	});
});

// ============================================================================
// Gas Cost Analysis Tests
// ============================================================================

describe("Opcode.getGasCost", () => {
	it("returns gas cost for valid opcodes", () => {
		expect(Opcode.getGasCost(Opcode.ADD)).toBe(3);
		expect(Opcode.getGasCost(Opcode.MUL)).toBe(5);
		expect(Opcode.getGasCost(Opcode.SSTORE)).toBe(100);
		expect(Opcode.getGasCost(Opcode.STOP)).toBe(0);
	});

	it("returns undefined for invalid opcodes", () => {
		expect(Opcode.getGasCost(0x0c as any)).toBeUndefined();
	});
});

// ============================================================================
// Stack Effect Analysis Tests
// ============================================================================

describe("Opcode.getStackEffect", () => {
	it("returns stack effect for arithmetic opcodes", () => {
		const effect = Opcode.getStackEffect(Opcode.ADD);
		expect(effect).toEqual({ pop: 2, push: 1 });
	});

	it("returns stack effect for PUSH opcodes", () => {
		const effect = Opcode.getStackEffect(Opcode.PUSH1);
		expect(effect).toEqual({ pop: 0, push: 1 });
	});

	it("returns stack effect for DUP opcodes", () => {
		const effect = Opcode.getStackEffect(Opcode.DUP1);
		expect(effect).toEqual({ pop: 1, push: 2 });
	});

	it("returns undefined for invalid opcodes", () => {
		expect(Opcode.getStackEffect(0x0c as any)).toBeUndefined();
	});
});

describe("Opcode.getStackInput", () => {
	it("returns input count for opcodes", () => {
		expect(Opcode.getStackInput(Opcode.ADD)).toBe(2);
		expect(Opcode.getStackInput(Opcode.PUSH1)).toBe(0);
		expect(Opcode.getStackInput(Opcode.CALL)).toBe(7);
	});

	it("returns undefined for invalid opcodes", () => {
		expect(Opcode.getStackInput(0x0c as any)).toBeUndefined();
	});
});

describe("Opcode.getStackOutput", () => {
	it("returns output count for opcodes", () => {
		expect(Opcode.getStackOutput(Opcode.ADD)).toBe(1);
		expect(Opcode.getStackOutput(Opcode.PUSH1)).toBe(1);
		expect(Opcode.getStackOutput(Opcode.STOP)).toBe(0);
	});

	it("returns undefined for invalid opcodes", () => {
		expect(Opcode.getStackOutput(0x0c as any)).toBeUndefined();
	});
});

// ============================================================================
// Bytecode Analysis Tests
// ============================================================================

describe("Opcode.isJumpDestination", () => {
	it("identifies JUMPDEST", () => {
		expect(Opcode.isJumpDestination(Opcode.JUMPDEST)).toBe(true);
	});

	it("rejects non-JUMPDEST opcodes", () => {
		expect(Opcode.isJumpDestination(Opcode.JUMP)).toBe(false);
		expect(Opcode.isJumpDestination(Opcode.JUMPI)).toBe(false);
		expect(Opcode.isJumpDestination(Opcode.ADD)).toBe(false);
	});
});

describe("Opcode.getPushSize", () => {
	it("returns 0 for PUSH0", () => {
		expect(Opcode.getPushSize(Opcode.PUSH0)).toBe(0);
	});

	it("returns correct size for PUSH1-PUSH32", () => {
		expect(Opcode.getPushSize(Opcode.PUSH1)).toBe(1);
		expect(Opcode.getPushSize(Opcode.PUSH2)).toBe(2);
		expect(Opcode.getPushSize(Opcode.PUSH16)).toBe(16);
		expect(Opcode.getPushSize(Opcode.PUSH32)).toBe(32);
	});

	it("returns 0 for non-PUSH opcodes", () => {
		expect(Opcode.getPushSize(Opcode.ADD)).toBe(0);
		expect(Opcode.getPushSize(Opcode.DUP1)).toBe(0);
	});
});

describe("Opcode.isTerminator", () => {
	it("identifies terminating opcodes", () => {
		expect(Opcode.isTerminator(Opcode.STOP)).toBe(true);
		expect(Opcode.isTerminator(Opcode.RETURN)).toBe(true);
		expect(Opcode.isTerminator(Opcode.REVERT)).toBe(true);
		expect(Opcode.isTerminator(Opcode.INVALID)).toBe(true);
		expect(Opcode.isTerminator(Opcode.SELFDESTRUCT)).toBe(true);
	});

	it("rejects non-terminating opcodes", () => {
		expect(Opcode.isTerminator(Opcode.ADD)).toBe(false);
		expect(Opcode.isTerminator(Opcode.JUMP)).toBe(false);
	});
});

// ============================================================================
// Metadata Tests
// ============================================================================

describe("Opcode.getName", () => {
	it("returns correct names", () => {
		expect(Opcode.getName(Opcode.ADD)).toBe("ADD");
		expect(Opcode.getName(Opcode.PUSH1)).toBe("PUSH1");
		expect(Opcode.getName(Opcode.SELFDESTRUCT)).toBe("SELFDESTRUCT");
	});

	it("returns UNKNOWN for invalid opcodes", () => {
		expect(Opcode.getName(0x0c as any)).toBe("UNKNOWN");
	});
});

describe("Opcode.getCategory", () => {
	it("categorizes arithmetic opcodes", () => {
		expect(Opcode.getCategory(Opcode.ADD)).toBe("arithmetic");
		expect(Opcode.getCategory(Opcode.MUL)).toBe("arithmetic");
		expect(Opcode.getCategory(Opcode.EXP)).toBe("arithmetic");
	});

	it("categorizes control flow opcodes", () => {
		expect(Opcode.getCategory(Opcode.STOP)).toBe("control");
		expect(Opcode.getCategory(Opcode.JUMP)).toBe("control");
		expect(Opcode.getCategory(Opcode.JUMPDEST)).toBe("control");
	});

	it("categorizes stack opcodes", () => {
		expect(Opcode.getCategory(Opcode.PUSH1)).toBe("stack");
		expect(Opcode.getCategory(Opcode.DUP1)).toBe("stack");
		expect(Opcode.getCategory(Opcode.SWAP1)).toBe("stack");
		expect(Opcode.getCategory(Opcode.POP)).toBe("stack");
	});

	it("categorizes storage opcodes", () => {
		expect(Opcode.getCategory(Opcode.SLOAD)).toBe("storage");
		expect(Opcode.getCategory(Opcode.SSTORE)).toBe("storage");
		expect(Opcode.getCategory(Opcode.TLOAD)).toBe("storage");
		expect(Opcode.getCategory(Opcode.TSTORE)).toBe("storage");
	});

	it("categorizes memory opcodes", () => {
		expect(Opcode.getCategory(Opcode.MLOAD)).toBe("memory");
		expect(Opcode.getCategory(Opcode.MSTORE)).toBe("memory");
		expect(Opcode.getCategory(Opcode.MCOPY)).toBe("memory");
	});

	it("categorizes logic opcodes", () => {
		expect(Opcode.getCategory(Opcode.LT)).toBe("logic");
		expect(Opcode.getCategory(Opcode.AND)).toBe("logic");
		expect(Opcode.getCategory(Opcode.XOR)).toBe("logic");
	});

	it("categorizes crypto opcodes", () => {
		expect(Opcode.getCategory(Opcode.KECCAK256)).toBe("crypto");
	});

	it("categorizes environment opcodes", () => {
		expect(Opcode.getCategory(Opcode.ADDRESS)).toBe("environment");
		expect(Opcode.getCategory(Opcode.CALLER)).toBe("environment");
	});

	it("categorizes block opcodes", () => {
		expect(Opcode.getCategory(Opcode.BLOCKHASH)).toBe("block");
		expect(Opcode.getCategory(Opcode.TIMESTAMP)).toBe("block");
	});

	it("categorizes log opcodes", () => {
		expect(Opcode.getCategory(Opcode.LOG0)).toBe("log");
		expect(Opcode.getCategory(Opcode.LOG4)).toBe("log");
	});

	it("categorizes system opcodes", () => {
		expect(Opcode.getCategory(Opcode.CALL)).toBe("system");
		expect(Opcode.getCategory(Opcode.CREATE)).toBe("system");
		expect(Opcode.getCategory(Opcode.REVERT)).toBe("system");
	});
});

describe("Opcode.isValidOpcode", () => {
	it("validates defined opcodes", () => {
		expect(Opcode.isValidOpcode(0x01)).toBe(true);
		expect(Opcode.isValidOpcode(0x60)).toBe(true);
		expect(Opcode.isValidOpcode(0xff)).toBe(true);
	});

	it("rejects undefined opcodes", () => {
		expect(Opcode.isValidOpcode(0x0c)).toBe(false);
		expect(Opcode.isValidOpcode(0x21)).toBe(false);
	});
});

describe("Opcode.getDescription", () => {
	it("returns descriptions for opcodes", () => {
		expect(Opcode.getDescription(Opcode.ADD)).toBe("Addition operation");
		expect(Opcode.getDescription(Opcode.STOP)).toBe("Halt execution");
		expect(Opcode.getDescription(Opcode.KECCAK256)).toBe(
			"Compute Keccak-256 hash",
		);
	});

	it("generates descriptions for PUSH opcodes", () => {
		expect(Opcode.getDescription(Opcode.PUSH0)).toBe("Place 0 on stack");
		expect(Opcode.getDescription(Opcode.PUSH1)).toBe(
			"Place 1-byte item on stack",
		);
		expect(Opcode.getDescription(Opcode.PUSH32)).toBe(
			"Place 32-byte item on stack",
		);
	});

	it("generates descriptions for DUP opcodes", () => {
		expect(Opcode.getDescription(Opcode.DUP1)).toBe("Duplicate 1st stack item");
		expect(Opcode.getDescription(Opcode.DUP2)).toBe("Duplicate 2nd stack item");
		expect(Opcode.getDescription(Opcode.DUP3)).toBe("Duplicate 3rd stack item");
	});

	it("generates descriptions for SWAP opcodes", () => {
		expect(Opcode.getDescription(Opcode.SWAP1)).toBe(
			"Exchange 1st and 2nd stack items",
		);
		expect(Opcode.getDescription(Opcode.SWAP2)).toBe(
			"Exchange 1st and 3rd stack items",
		);
	});

	it("returns unknown for invalid opcodes", () => {
		expect(Opcode.getDescription(0x0c as any)).toBe("Unknown opcode");
	});
});
