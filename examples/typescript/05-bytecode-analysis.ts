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
	validateBytecode,
	isValidJumpDest,
	isBytecodeBoundary,
} from "../../src/typescript/primitives/bytecode";
import { hexToBytes } from "../../src/typescript/utils/hex";
import { Opcode } from "../../src/typescript/primitives/opcode";

console.log("=== Bytecode Analysis ===\n");

// Example 5.1: Simple Bytecode with JUMPDESTs
console.log("5.1: Simple Bytecode Analysis");
// PUSH1 0x05, PUSH1 0x03, ADD, JUMPDEST, STOP
const simpleBytecode = "0x6005600301" + "5b" + "00";
console.log("Bytecode:", simpleBytecode);

const simpleJumps = analyzeJumpDestinations(simpleBytecode);
console.log("Jump destinations:");
for (const jump of simpleJumps) {
	console.log(
		`  Position ${jump.position}: ${jump.valid ? "valid" : "invalid"}`,
	);
}

const isValid = validateBytecode(simpleBytecode);
console.log("Bytecode valid:", isValid);
console.log();

// Example 5.2: Bytecode with PUSH Data
console.log("5.2: Bytecode with PUSH Instructions");
// PUSH1 0xff, PUSH2 0xabcd, PUSH32 (32 bytes), JUMPDEST
const pushBytecode =
	"0x60ff" + // PUSH1 0xff
	"61abcd" + // PUSH2 0xabcd
	"7f" +
	"00".repeat(32) + // PUSH32 (32 zero bytes)
	"5b"; // JUMPDEST

console.log("Bytecode:", pushBytecode.slice(0, 50) + "...");
console.log("Bytecode length:", pushBytecode.length / 2 - 1, "bytes");

const pushJumps = analyzeJumpDestinations(pushBytecode);
console.log("Jump destinations:");
for (const jump of pushJumps) {
	console.log(`  Position ${jump.position}: valid JUMPDEST`);
}

// Check if position 2 (inside PUSH2 data) is a valid jump destination
const bytes = hexToBytes(pushBytecode);
const pos2Valid = isValidJumpDest(bytes, 2);
const pos2Boundary = isBytecodeBoundary(bytes, 2);
console.log("Position 2 (inside PUSH2 data):");
console.log("  Is valid JUMPDEST:", pos2Valid);
console.log("  Is opcode boundary:", pos2Boundary);
console.log();

// Example 5.3: Contract Bytecode (Constructor + Runtime)
console.log("5.3: Real Contract Bytecode");
// Simplified ERC20-like constructor
const contractBytecode =
	"0x" +
	"608060405234801561001057600080fd5b50" + // Constructor setup
	"336000806101000a81548173ffffffffffff" + // Store owner
	"021916908373ffffffffffffffffffff1602" +
	"179055506101e08061005c6000396000f3" + // Return runtime code
	"60806040" + // Runtime begins
	"5b"; // JUMPDEST

console.log(
	"Contract bytecode length:",
	contractBytecode.length / 2 - 1,
	"bytes",
);

const valid = validateBytecode(contractBytecode);
console.log("Bytecode valid:", valid);

const jumps = analyzeJumpDestinations(contractBytecode);
console.log("Total jump destinations found:", jumps.length);
console.log("First 5 jump destinations:");
for (let i = 0; i < Math.min(5, jumps.length); i++) {
	console.log(`  Position ${jumps[i].position}`);
}
console.log();

// Example 5.4: Invalid Bytecode (Truncated PUSH)
console.log("5.4: Invalid Bytecode Detection");
// PUSH2 but only 1 byte of data (should have 2)
const invalidBytecode = "0x6101"; // PUSH2 with incomplete data

const invalidValid = validateBytecode(invalidBytecode);
console.log("Bytecode:", invalidBytecode);
console.log("Valid:", invalidValid);
console.log("Reason: PUSH2 requires 2 bytes but bytecode ends");
console.log();

// Example 5.5: Bytecode Disassembly (Simplified)
console.log("5.5: Simple Bytecode Disassembly");
const disasmBytecode = "0x60016002016003015b00";
console.log("Bytecode:", disasmBytecode);

const disasmBytes = hexToBytes(disasmBytecode);
console.log("Disassembly:");
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
		console.log(
			`  ${pc.toString().padStart(4, "0")}: ${opcodeName} 0x${dataHex}`,
		);
		pc += 1 + pushSize;
	} else {
		console.log(`  ${pc.toString().padStart(4, "0")}: ${opcodeName}`);
		pc += 1;
	}
}
console.log();

// Example 5.6: Finding All PUSH32 Constants
console.log("5.6: Extract PUSH32 Constants");
const searchBytecode =
	"0x7f" +
	"1234567890".repeat(6) +
	"123456" + // PUSH32
	"60ff" + // PUSH1 0xff
	"7f" +
	"abcdefabcd".repeat(6) +
	"abcdef" + // PUSH32
	"00"; // STOP

const searchBytes = hexToBytes(searchBytecode);
console.log("Searching for PUSH32 instructions...");

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
		console.log(`  PUSH32 at position ${pc}:`);
		console.log(`    0x${dataHex.slice(0, 40)}...`);
		push32Count++;
		pc += 33;
	} else if (opcode >= 0x60 && opcode <= 0x7e) {
		// Other PUSH instructions
		pc += opcode - 0x5f + 1;
	} else {
		pc += 1;
	}
}
console.log(`Found ${push32Count} PUSH32 instructions`);

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
