/**
 * Tests for EVM Opcode module
 */

import { describe, expect, it } from "vitest";
import * as Opcode from "./Opcode.js";

// ============================================================================
// Opcode Info Tests
// ============================================================================

describe("Opcode.getInfo", () => {
	it("returns info for valid opcodes", () => {
		const addInfo = Opcode.getInfo(Opcode.Code.ADD);
		expect(addInfo).toBeDefined();
		expect(addInfo?.name).toBe("ADD");
		expect(addInfo?.gasCost).toBe(3);
		expect(addInfo?.stackInputs).toBe(2);
		expect(addInfo?.stackOutputs).toBe(1);
	});

	it("returns info for STOP", () => {
		const stopInfo = Opcode.getInfo(Opcode.Code.STOP);
		expect(stopInfo).toBeDefined();
		expect(stopInfo?.name).toBe("STOP");
		expect(stopInfo?.gasCost).toBe(0);
		expect(stopInfo?.stackInputs).toBe(0);
		expect(stopInfo?.stackOutputs).toBe(0);
	});

	it("returns info for complex opcodes", () => {
		const callInfo = Opcode.getInfo(Opcode.Code.CALL);
		expect(callInfo).toBeDefined();
		expect(callInfo?.name).toBe("CALL");
		expect(callInfo?.stackInputs).toBe(7);
		expect(callInfo?.stackOutputs).toBe(1);
	});

	it("returns undefined for invalid opcodes", () => {
		const invalid = Opcode.getInfo(0x0c as Opcode.Code);
		expect(invalid).toBeUndefined();
	});

	it("works with this: pattern", () => {
		const opcode = Opcode.Code.MUL;
		const info = Opcode.info.call(opcode);
		expect(info).toBeDefined();
		expect(info?.name).toBe("MUL");
	});
});

describe("Opcode.getName", () => {
	it("returns correct names for opcodes", () => {
		expect(Opcode.getName(Opcode.Code.ADD)).toBe("ADD");
		expect(Opcode.getName(Opcode.Code.PUSH1)).toBe("PUSH1");
		expect(Opcode.getName(Opcode.Code.JUMPDEST)).toBe("JUMPDEST");
	});

	it("returns UNKNOWN for invalid opcodes", () => {
		expect(Opcode.getName(0x0c as Opcode.Code)).toBe("UNKNOWN");
	});

	it("works with this: pattern", () => {
		expect(Opcode.name.call(Opcode.Code.SUB)).toBe("SUB");
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
		expect(Opcode.valid.call(0x01)).toBe(true);
		expect(Opcode.valid.call(0x0c)).toBe(false);
	});
});

// ============================================================================
// Category Tests
// ============================================================================

describe("Opcode.isPush", () => {
	it("identifies PUSH0", () => {
		expect(Opcode.isPush(Opcode.Code.PUSH0)).toBe(true);
	});

	it("identifies PUSH1-PUSH32", () => {
		expect(Opcode.isPush(Opcode.Code.PUSH1)).toBe(true);
		expect(Opcode.isPush(Opcode.Code.PUSH16)).toBe(true);
		expect(Opcode.isPush(Opcode.Code.PUSH32)).toBe(true);
	});

	it("rejects non-PUSH opcodes", () => {
		expect(Opcode.isPush(Opcode.Code.ADD)).toBe(false);
		expect(Opcode.isPush(Opcode.Code.DUP1)).toBe(false);
		expect(Opcode.isPush(Opcode.Code.SWAP1)).toBe(false);
	});

	it("works with this: pattern", () => {
		expect(Opcode.push.call(Opcode.Code.PUSH1)).toBe(true);
		expect(Opcode.push.call(Opcode.Code.ADD)).toBe(false);
	});
});

describe("Opcode.isDup", () => {
	it("identifies DUP1-DUP16", () => {
		expect(Opcode.isDup(Opcode.Code.DUP1)).toBe(true);
		expect(Opcode.isDup(Opcode.Code.DUP8)).toBe(true);
		expect(Opcode.isDup(Opcode.Code.DUP16)).toBe(true);
	});

	it("rejects non-DUP opcodes", () => {
		expect(Opcode.isDup(Opcode.Code.ADD)).toBe(false);
		expect(Opcode.isDup(Opcode.Code.PUSH1)).toBe(false);
		expect(Opcode.isDup(Opcode.Code.SWAP1)).toBe(false);
	});

	it("works with this: pattern", () => {
		expect(Opcode.dup.call(Opcode.Code.DUP1)).toBe(true);
		expect(Opcode.dup.call(Opcode.Code.ADD)).toBe(false);
	});
});

describe("Opcode.isSwap", () => {
	it("identifies SWAP1-SWAP16", () => {
		expect(Opcode.isSwap(Opcode.Code.SWAP1)).toBe(true);
		expect(Opcode.isSwap(Opcode.Code.SWAP8)).toBe(true);
		expect(Opcode.isSwap(Opcode.Code.SWAP16)).toBe(true);
	});

	it("rejects non-SWAP opcodes", () => {
		expect(Opcode.isSwap(Opcode.Code.ADD)).toBe(false);
		expect(Opcode.isSwap(Opcode.Code.PUSH1)).toBe(false);
		expect(Opcode.isSwap(Opcode.Code.DUP1)).toBe(false);
	});

	it("works with this: pattern", () => {
		expect(Opcode.swap.call(Opcode.Code.SWAP1)).toBe(true);
		expect(Opcode.swap.call(Opcode.Code.ADD)).toBe(false);
	});
});

describe("Opcode.isLog", () => {
	it("identifies LOG0-LOG4", () => {
		expect(Opcode.isLog(Opcode.Code.LOG0)).toBe(true);
		expect(Opcode.isLog(Opcode.Code.LOG1)).toBe(true);
		expect(Opcode.isLog(Opcode.Code.LOG4)).toBe(true);
	});

	it("rejects non-LOG opcodes", () => {
		expect(Opcode.isLog(Opcode.Code.ADD)).toBe(false);
		expect(Opcode.isLog(Opcode.Code.PUSH1)).toBe(false);
	});

	it("works with this: pattern", () => {
		expect(Opcode.log.call(Opcode.Code.LOG1)).toBe(true);
		expect(Opcode.log.call(Opcode.Code.ADD)).toBe(false);
	});
});

describe("Opcode.isTerminating", () => {
	it("identifies terminating opcodes", () => {
		expect(Opcode.isTerminating(Opcode.Code.STOP)).toBe(true);
		expect(Opcode.isTerminating(Opcode.Code.RETURN)).toBe(true);
		expect(Opcode.isTerminating(Opcode.Code.REVERT)).toBe(true);
		expect(Opcode.isTerminating(Opcode.Code.INVALID)).toBe(true);
		expect(Opcode.isTerminating(Opcode.Code.SELFDESTRUCT)).toBe(true);
	});

	it("rejects non-terminating opcodes", () => {
		expect(Opcode.isTerminating(Opcode.Code.ADD)).toBe(false);
		expect(Opcode.isTerminating(Opcode.Code.JUMP)).toBe(false);
	});

	it("works with this: pattern", () => {
		expect(Opcode.terminating.call(Opcode.Code.RETURN)).toBe(true);
		expect(Opcode.terminating.call(Opcode.Code.ADD)).toBe(false);
	});
});

describe("Opcode.isJump", () => {
	it("identifies JUMP and JUMPI", () => {
		expect(Opcode.isJump(Opcode.Code.JUMP)).toBe(true);
		expect(Opcode.isJump(Opcode.Code.JUMPI)).toBe(true);
	});

	it("rejects non-jump opcodes", () => {
		expect(Opcode.isJump(Opcode.Code.JUMPDEST)).toBe(false);
		expect(Opcode.isJump(Opcode.Code.ADD)).toBe(false);
	});

	it("works with this: pattern", () => {
		expect(Opcode.jump.call(Opcode.Code.JUMP)).toBe(true);
		expect(Opcode.jump.call(Opcode.Code.ADD)).toBe(false);
	});
});

// ============================================================================
// PUSH Operations Tests
// ============================================================================

describe("Opcode.getPushBytes", () => {
	it("returns 0 for PUSH0", () => {
		expect(Opcode.getPushBytes(Opcode.Code.PUSH0)).toBe(0);
	});

	it("returns correct byte counts for PUSH1-PUSH32", () => {
		expect(Opcode.getPushBytes(Opcode.Code.PUSH1)).toBe(1);
		expect(Opcode.getPushBytes(Opcode.Code.PUSH2)).toBe(2);
		expect(Opcode.getPushBytes(Opcode.Code.PUSH16)).toBe(16);
		expect(Opcode.getPushBytes(Opcode.Code.PUSH32)).toBe(32);
	});

	it("returns undefined for non-PUSH opcodes", () => {
		expect(Opcode.getPushBytes(Opcode.Code.ADD)).toBeUndefined();
		expect(Opcode.getPushBytes(Opcode.Code.DUP1)).toBeUndefined();
	});

	it("works with this: pattern", () => {
		expect(Opcode.pushBytes.call(Opcode.Code.PUSH1)).toBe(1);
		expect(Opcode.pushBytes.call(Opcode.Code.ADD)).toBeUndefined();
	});
});

describe("Opcode.getPushOpcode", () => {
	it("returns PUSH0 for 0 bytes", () => {
		expect(Opcode.getPushOpcode(0)).toBe(Opcode.Code.PUSH0);
	});

	it("returns correct PUSH opcodes for byte counts", () => {
		expect(Opcode.getPushOpcode(1)).toBe(Opcode.Code.PUSH1);
		expect(Opcode.getPushOpcode(2)).toBe(Opcode.Code.PUSH2);
		expect(Opcode.getPushOpcode(16)).toBe(Opcode.Code.PUSH16);
		expect(Opcode.getPushOpcode(32)).toBe(Opcode.Code.PUSH32);
	});

	it("throws for invalid byte counts", () => {
		expect(() => Opcode.getPushOpcode(-1)).toThrow("Invalid PUSH size");
		expect(() => Opcode.getPushOpcode(33)).toThrow("Invalid PUSH size");
	});

	it("works with this: pattern", () => {
		expect(Opcode.pushOpcode.call(1)).toBe(Opcode.Code.PUSH1);
	});
});

// ============================================================================
// DUP/SWAP/LOG Operations Tests
// ============================================================================

describe("Opcode.getDupPosition", () => {
	it("returns correct positions for DUP opcodes", () => {
		expect(Opcode.getDupPosition(Opcode.Code.DUP1)).toBe(1);
		expect(Opcode.getDupPosition(Opcode.Code.DUP8)).toBe(8);
		expect(Opcode.getDupPosition(Opcode.Code.DUP16)).toBe(16);
	});

	it("returns undefined for non-DUP opcodes", () => {
		expect(Opcode.getDupPosition(Opcode.Code.ADD)).toBeUndefined();
	});

	it("works with this: pattern", () => {
		expect(Opcode.dupPosition.call(Opcode.Code.DUP1)).toBe(1);
	});
});

describe("Opcode.getSwapPosition", () => {
	it("returns correct positions for SWAP opcodes", () => {
		expect(Opcode.getSwapPosition(Opcode.Code.SWAP1)).toBe(1);
		expect(Opcode.getSwapPosition(Opcode.Code.SWAP8)).toBe(8);
		expect(Opcode.getSwapPosition(Opcode.Code.SWAP16)).toBe(16);
	});

	it("returns undefined for non-SWAP opcodes", () => {
		expect(Opcode.getSwapPosition(Opcode.Code.ADD)).toBeUndefined();
	});

	it("works with this: pattern", () => {
		expect(Opcode.swapPosition.call(Opcode.Code.SWAP1)).toBe(1);
	});
});

describe("Opcode.getLogTopics", () => {
	it("returns correct topic counts for LOG opcodes", () => {
		expect(Opcode.getLogTopics(Opcode.Code.LOG0)).toBe(0);
		expect(Opcode.getLogTopics(Opcode.Code.LOG1)).toBe(1);
		expect(Opcode.getLogTopics(Opcode.Code.LOG4)).toBe(4);
	});

	it("returns undefined for non-LOG opcodes", () => {
		expect(Opcode.getLogTopics(Opcode.Code.ADD)).toBeUndefined();
	});

	it("works with this: pattern", () => {
		expect(Opcode.logTopics.call(Opcode.Code.LOG1)).toBe(1);
	});
});

// ============================================================================
// Bytecode Parsing Tests
// ============================================================================

describe("Opcode.parseBytecode", () => {
	it("parses simple bytecode", () => {
		const bytecode = new Uint8Array([0x60, 0x01, 0x60, 0x02, 0x01]);
		const instructions = Opcode.parseBytecode(bytecode);

		expect(instructions).toHaveLength(3);
		expect(instructions[0]!.opcode).toBe(Opcode.Code.PUSH1);
		expect(instructions[0]!.offset).toBe(0);
		expect(instructions[0]!.immediate).toEqual(new Uint8Array([0x01]));

		expect(instructions[1]!.opcode).toBe(Opcode.Code.PUSH1);
		expect(instructions[1]!.offset).toBe(2);
		expect(instructions[1]!.immediate).toEqual(new Uint8Array([0x02]));

		expect(instructions[2]!.opcode).toBe(Opcode.Code.ADD);
		expect(instructions[2]!.offset).toBe(4);
		expect(instructions[2]!.immediate).toBeUndefined();
	});

	it("parses PUSH0", () => {
		const bytecode = new Uint8Array([0x5f, 0x01]);
		const instructions = Opcode.parseBytecode(bytecode);

		expect(instructions).toHaveLength(2);
		expect(instructions[0]!.opcode).toBe(Opcode.Code.PUSH0);
		expect(instructions[0]!.immediate).toBeUndefined();
	});

	it("parses PUSH32", () => {
		const bytecode = new Uint8Array([0x7f, ...new Array(32).fill(0xff)]);
		const instructions = Opcode.parseBytecode(bytecode);

		expect(instructions).toHaveLength(1);
		expect(instructions[0]!.opcode).toBe(Opcode.Code.PUSH32);
		expect(instructions[0]!.immediate).toHaveLength(32);
	});

	it("handles truncated PUSH data", () => {
		const bytecode = new Uint8Array([0x60]); // PUSH1 without data
		const instructions = Opcode.parseBytecode(bytecode);

		expect(instructions).toHaveLength(1);
		expect(instructions[0]!.opcode).toBe(Opcode.Code.PUSH1);
		expect(instructions[0]!.immediate).toHaveLength(0);
	});

	it("parses empty bytecode", () => {
		const bytecode = new Uint8Array([]);
		const instructions = Opcode.parseBytecode(bytecode);
		expect(instructions).toHaveLength(0);
	});

	it("works with this: pattern", () => {
		const bytecode = new Uint8Array([0x60, 0x01, 0x01]);
		const instructions = Opcode.parse.call(bytecode);
		expect(instructions).toHaveLength(2);
	});
});

describe("Opcode.formatInstruction", () => {
	it("formats simple opcodes", () => {
		const inst: Opcode.Instruction = {
			offset: 0,
			opcode: Opcode.Code.ADD,
		};
		expect(Opcode.formatInstruction(inst)).toBe("0x0000: ADD");
	});

	it("formats PUSH with immediate data", () => {
		const inst: Opcode.Instruction = {
			offset: 10,
			opcode: Opcode.Code.PUSH1,
			immediate: new Uint8Array([0x42]),
		};
		expect(Opcode.formatInstruction(inst)).toBe("0x000a: PUSH1 0x42");
	});

	it("formats PUSH32 with full data", () => {
		const inst: Opcode.Instruction = {
			offset: 0,
			opcode: Opcode.Code.PUSH32,
			immediate: new Uint8Array(32).fill(0xff),
		};
		const result = Opcode.formatInstruction(inst);
		expect(result).toContain("PUSH32");
		expect(result).toContain("ff".repeat(32));
	});

	it("works with this: pattern", () => {
		const inst: Opcode.Instruction = {
			offset: 0,
			opcode: Opcode.Code.ADD,
		};
		expect(Opcode.format.call(inst)).toBe("0x0000: ADD");
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

describe("Opcode.findJumpDests", () => {
	it("finds JUMPDEST opcodes", () => {
		const bytecode = new Uint8Array([0x5b, 0x60, 0x01, 0x5b]);
		const dests = Opcode.findJumpDests(bytecode);

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
		const dests = Opcode.findJumpDests(bytecode);

		expect(dests.size).toBe(1);
		expect(dests.has(2)).toBe(true);
		expect(dests.has(1)).toBe(false);
	});

	it("handles bytecode with no JUMPDESTs", () => {
		const bytecode = new Uint8Array([0x60, 0x01, 0x60, 0x02, 0x01]);
		const dests = Opcode.findJumpDests(bytecode);
		expect(dests.size).toBe(0);
	});

	it("works with this: pattern", () => {
		const bytecode = new Uint8Array([0x5b]);
		const dests = Opcode.jumpDests.call(bytecode);
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
		expect(Opcode.validJumpDest.call(bytecode, 0)).toBe(true);
	});
});

// ============================================================================
// Edge Cases and Comprehensive Tests
// ============================================================================

describe("Opcode edge cases", () => {
	it("validates all arithmetic opcodes", () => {
		const ops = [
			Opcode.Code.ADD,
			Opcode.Code.MUL,
			Opcode.Code.SUB,
			Opcode.Code.DIV,
			Opcode.Code.SDIV,
			Opcode.Code.MOD,
			Opcode.Code.SMOD,
			Opcode.Code.ADDMOD,
			Opcode.Code.MULMOD,
			Opcode.Code.EXP,
			Opcode.Code.SIGNEXTEND,
		];

		for (const op of ops) {
			expect(Opcode.isValid(op)).toBe(true);
			expect(Opcode.getInfo(op)).toBeDefined();
		}
	});

	it("validates all comparison opcodes", () => {
		const ops = [
			Opcode.Code.LT,
			Opcode.Code.GT,
			Opcode.Code.SLT,
			Opcode.Code.SGT,
			Opcode.Code.EQ,
			Opcode.Code.ISZERO,
		];

		for (const op of ops) {
			expect(Opcode.isValid(op)).toBe(true);
			expect(Opcode.getInfo(op)).toBeDefined();
		}
	});

	it("validates all bitwise opcodes", () => {
		const ops = [
			Opcode.Code.AND,
			Opcode.Code.OR,
			Opcode.Code.XOR,
			Opcode.Code.NOT,
			Opcode.Code.BYTE,
			Opcode.Code.SHL,
			Opcode.Code.SHR,
			Opcode.Code.SAR,
		];

		for (const op of ops) {
			expect(Opcode.isValid(op)).toBe(true);
			expect(Opcode.getInfo(op)).toBeDefined();
		}
	});

	it("validates all storage/memory opcodes", () => {
		const ops = [
			Opcode.Code.MLOAD,
			Opcode.Code.MSTORE,
			Opcode.Code.MSTORE8,
			Opcode.Code.SLOAD,
			Opcode.Code.SSTORE,
			Opcode.Code.TLOAD,
			Opcode.Code.TSTORE,
			Opcode.Code.MCOPY,
		];

		for (const op of ops) {
			expect(Opcode.isValid(op)).toBe(true);
			expect(Opcode.getInfo(op)).toBeDefined();
		}
	});

	it("validates all block information opcodes", () => {
		const ops = [
			Opcode.Code.BLOCKHASH,
			Opcode.Code.COINBASE,
			Opcode.Code.TIMESTAMP,
			Opcode.Code.NUMBER,
			Opcode.Code.DIFFICULTY,
			Opcode.Code.GASLIMIT,
			Opcode.Code.CHAINID,
			Opcode.Code.SELFBALANCE,
			Opcode.Code.BASEFEE,
			Opcode.Code.BLOBHASH,
			Opcode.Code.BLOBBASEFEE,
		];

		for (const op of ops) {
			expect(Opcode.isValid(op)).toBe(true);
			expect(Opcode.getInfo(op)).toBeDefined();
		}
	});

	it("validates all system opcodes", () => {
		const ops = [
			Opcode.Code.CREATE,
			Opcode.Code.CALL,
			Opcode.Code.CALLCODE,
			Opcode.Code.RETURN,
			Opcode.Code.DELEGATECALL,
			Opcode.Code.CREATE2,
			Opcode.Code.STATICCALL,
			Opcode.Code.REVERT,
			Opcode.Code.SELFDESTRUCT,
		];

		for (const op of ops) {
			expect(Opcode.isValid(op)).toBe(true);
			expect(Opcode.getInfo(op)).toBeDefined();
		}
	});

	it("validates EIP-3074 opcodes", () => {
		expect(Opcode.isValid(Opcode.Code.AUTH)).toBe(true);
		expect(Opcode.isValid(Opcode.Code.AUTHCALL)).toBe(true);
	});

	it("correctly identifies stack requirements for DUP opcodes", () => {
		for (let i = 0; i < 16; i++) {
			const dupCode = (0x80 + i) as Opcode.Code;
			const info = Opcode.getInfo(dupCode);
			expect(info?.stackInputs).toBe(i + 1);
			expect(info?.stackOutputs).toBe(i + 2);
		}
	});

	it("correctly identifies stack requirements for SWAP opcodes", () => {
		for (let i = 0; i < 16; i++) {
			const swapCode = (0x90 + i) as Opcode.Code;
			const info = Opcode.getInfo(swapCode);
			expect(info?.stackInputs).toBe(i + 2);
			expect(info?.stackOutputs).toBe(i + 2);
		}
	});

	it("correctly calculates gas for LOG opcodes", () => {
		expect(Opcode.getInfo(Opcode.Code.LOG0)?.gasCost).toBe(375);
		expect(Opcode.getInfo(Opcode.Code.LOG1)?.gasCost).toBe(750);
		expect(Opcode.getInfo(Opcode.Code.LOG2)?.gasCost).toBe(1125);
		expect(Opcode.getInfo(Opcode.Code.LOG3)?.gasCost).toBe(1500);
		expect(Opcode.getInfo(Opcode.Code.LOG4)?.gasCost).toBe(1875);
	});
});

describe("Opcode stack analysis", () => {
	it("detects potential stack underflow", () => {
		const info = Opcode.getInfo(Opcode.Code.ADD);
		const stackSize = 1;

		expect(info).toBeDefined();
		if (info) {
			const wouldUnderflow = stackSize < info.stackInputs;
			expect(wouldUnderflow).toBe(true);
		}
	});

	it("calculates stack change", () => {
		const addInfo = Opcode.getInfo(Opcode.Code.ADD);
		expect(addInfo).toBeDefined();
		if (addInfo) {
			const stackChange = addInfo.stackOutputs - addInfo.stackInputs;
			expect(stackChange).toBe(-1); // 2 inputs, 1 output
		}

		const push1Info = Opcode.getInfo(Opcode.Code.PUSH1);
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

		const instructions = Opcode.parseBytecode(bytecode);
		let totalGas = 0;

		for (const inst of instructions) {
			const info = Opcode.getInfo(inst.opcode);
			if (info) {
				totalGas += info.gasCost;
			}
		}

		expect(totalGas).toBe(9); // 3 + 3 + 3
	});

	it("accounts for complex operations", () => {
		const info = Opcode.getInfo(Opcode.Code.SSTORE);
		expect(info?.gasCost).toBe(100); // Base cost
	});
});
