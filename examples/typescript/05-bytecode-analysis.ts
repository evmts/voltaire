/**
 * Example 5: Bytecode Analysis
 *
 * Demonstrates:
 * - Analyzing jump destinations in bytecode
 * - Validating bytecode structure
 * - Checking opcode boundaries
 * - Working with PUSH instructions
 */

import {
	analyzeJumpDestinations,
	isBytecodeBoundary,
	isValidJumpDest,
	validateBytecode,
} from "../../src/typescript/primitives/bytecode";
import { Opcode } from "../../src/typescript/primitives/opcode";
import { hexToBytes } from "../../src/typescript/utils/hex";
// PUSH1 0x05, PUSH1 0x03, ADD, JUMPDEST, STOP
const simpleBytecode = "0x6005600301" + "5b" + "00";

const simpleJumps = analyzeJumpDestinations(simpleBytecode);
for (const jump of simpleJumps) {
}

const isValid = validateBytecode(simpleBytecode);
// PUSH1 0xff, PUSH2 0xabcd, PUSH32 (32 bytes), JUMPDEST
const pushBytecode = `0x60ff61abcd7f${"00".repeat(32)}5b`; // JUMPDEST

const pushJumps = analyzeJumpDestinations(pushBytecode);
for (const jump of pushJumps) {
}

// Check if position 2 (inside PUSH2 data) is a valid jump destination
const bytes = hexToBytes(pushBytecode);
const pos2Valid = isValidJumpDest(bytes, 2);
const pos2Boundary = isBytecodeBoundary(bytes, 2);
// Simplified ERC20-like constructor
const contractBytecode =
	"0x" +
	"608060405234801561001057600080fd5b50" + // Constructor setup
	"336000806101000a81548173ffffffffffff" + // Store owner
	"021916908373ffffffffffffffffffff1602" +
	"179055506101e08061005c6000396000f3" + // Return runtime code
	"60806040" + // Runtime begins
	"5b"; // JUMPDEST

const valid = validateBytecode(contractBytecode);

const jumps = analyzeJumpDestinations(contractBytecode);
for (let i = 0; i < Math.min(5, jumps.length); i++) {}
// PUSH2 but only 1 byte of data (should have 2)
const invalidBytecode = "0x6101"; // PUSH2 with incomplete data

const invalidValid = validateBytecode(invalidBytecode);
const disasmBytecode = "0x60016002016003015b00";

const disasmBytes = hexToBytes(disasmBytecode);
let pc = 0;
while (pc < disasmBytes.length) {
	const opcode = disasmBytes[pc];
	const opcodeName = getOpcodeName(opcode);

	if (opcode >= 0x60 && opcode <= 0x7f) {
		// PUSH1-PUSH32
		const pushSize = opcode - 0x5f;
		const data = disasmBytes.slice(pc + 1, pc + 1 + pushSize);
		const dataHex = Array.from(data)
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("");
		pc += 1 + pushSize;
	} else {
		pc += 1;
	}
}
const searchBytecode = `0x7f${"1234567890".repeat(6)}12345660ff7f${"abcdefabcd".repeat(6)}abcdef00`; // STOP

const searchBytes = hexToBytes(searchBytecode);

pc = 0;
let push32Count = 0;
while (pc < searchBytes.length) {
	const opcode = searchBytes[pc];

	if (opcode === 0x7f) {
		// PUSH32
		const data = searchBytes.slice(pc + 1, pc + 33);
		const dataHex = Array.from(data)
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("");
		push32Count++;
		pc += 33;
	} else if (opcode >= 0x60 && opcode <= 0x7e) {
		// Other PUSH instructions
		pc += opcode - 0x5f + 1;
	} else {
		pc += 1;
	}
}

// Helper function to get opcode name
function getOpcodeName(opcode: number): string {
	// Simplified - just handle examples
	const names: { [key: number]: string } = {
		[Opcode.STOP]: "STOP",
		[Opcode.ADD]: "ADD",
		[Opcode.MUL]: "MUL",
		[Opcode.SUB]: "SUB",
		[Opcode.JUMPDEST]: "JUMPDEST",
	};

	if (opcode >= 0x60 && opcode <= 0x7f) {
		return `PUSH${opcode - 0x5f}`;
	}

	return names[opcode] || `UNKNOWN(0x${opcode.toString(16)})`;
}
