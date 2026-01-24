/**
 * Example 5: Bytecode Analysis
 *
 * Demonstrates:
 * - Analyzing jump destinations in bytecode
 * - Validating bytecode structure
 * - Checking opcode boundaries
 * - Working with PUSH instructions
 */

import { Bytecode, Opcode } from "@tevm/voltaire";

// PUSH1 0x05, PUSH1 0x03, ADD, JUMPDEST, STOP
const simpleBytecode = "0x6005600301" + "5b" + "00";

const code = Bytecode.fromHex(simpleBytecode);
const simpleJumps = Bytecode.analyzeJumpDestinations(code);

// Validate bytecode structure
const isValid = Bytecode.validate(code);

// PUSH1 0xff, PUSH2 0xabcd, PUSH32 (32 bytes), JUMPDEST
const pushBytecode = `0x60ff61abcd7f${"00".repeat(32)}5b`; // JUMPDEST
const pushCode = Bytecode.fromHex(pushBytecode);
const pushJumps = Bytecode.analyzeJumpDestinations(pushCode);

// Check if position is a valid jump destination
const pos2Valid = Bytecode.isValidJumpDest(pushCode, 2);

// Simplified ERC20-like constructor
const contractBytecode =
	"0x" +
	"608060405234801561001057600080fd5b50" + // Constructor setup
	"336000806101000a81548173ffffffffffff" + // Store owner
	"021916908373ffffffffffffffffffff1602" +
	"179055506101e08061005c6000396000f3" + // Return runtime code
	"60806040" + // Runtime begins
	"5b"; // JUMPDEST

const contractCode = Bytecode.fromHex(contractBytecode);
const valid = Bytecode.validate(contractCode);
const jumps = Bytecode.analyzeJumpDestinations(contractCode);

// PUSH2 but only 1 byte of data (should have 2)
const invalidBytecode = "0x6101"; // PUSH2 with incomplete data
const invalidCode = Bytecode.fromHex(invalidBytecode);
const invalidValid = Bytecode.validate(invalidCode);

// Disassemble bytecode
const disasmBytecode = "0x60016002016003015b00";
const disasmCode = Bytecode.fromHex(disasmBytecode);

// Parse instructions
const instructions = Bytecode.parseInstructions(disasmCode);

// Pretty print bytecode
const formatted = Bytecode.prettyPrint(disasmCode);

// Example opcodes
const stopOpcode = Opcode.STOP; // 0x00
const addOpcode = Opcode.ADD; // 0x01
const push1Opcode = Opcode.PUSH1; // 0x60
const jumpdestOpcode = Opcode.JUMPDEST; // 0x5b
