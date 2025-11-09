/**
 * Opcode Reference Example
 *
 * Demonstrates:
 * - Common EVM opcode constants
 * - Opcode classification utilities
 * - PUSH opcode handling
 * - Control flow opcodes
 * - Opcode quick reference
 */

import { Bytecode } from "../../../src/primitives/Bytecode/index.js";
for (let i = 1; i <= 32; i++) {
	const opcode = 0x5f + i; // PUSH1 = 0x60, PUSH2 = 0x61, etc.
	const isPush = Bytecode.isPush(opcode);
	const size = Bytecode.getPushSize(opcode);
}

const opcodes = [
	{ opcode: 0x00, name: "STOP", category: "Control flow" },
	{ opcode: 0x01, name: "ADD", category: "Arithmetic" },
	{ opcode: 0x02, name: "MUL", category: "Arithmetic" },
	{ opcode: 0x50, name: "POP", category: "Stack" },
	{ opcode: 0x51, name: "MLOAD", category: "Memory" },
	{ opcode: 0x52, name: "MSTORE", category: "Memory" },
	{ opcode: 0x54, name: "SLOAD", category: "Storage" },
	{ opcode: 0x55, name: "SSTORE", category: "Storage" },
	{ opcode: 0x56, name: "JUMP", category: "Control flow" },
	{ opcode: 0x57, name: "JUMPI", category: "Control flow" },
	{ opcode: 0x5b, name: "JUMPDEST", category: "Control flow" },
	{ opcode: 0x60, name: "PUSH1", category: "Stack" },
	{ opcode: 0x7f, name: "PUSH32", category: "Stack" },
	{ opcode: 0x80, name: "DUP1", category: "Stack" },
	{ opcode: 0x90, name: "SWAP1", category: "Stack" },
	{ opcode: 0xf0, name: "CREATE", category: "Contract" },
	{ opcode: 0xf1, name: "CALL", category: "Contract" },
	{ opcode: 0xf3, name: "RETURN", category: "Control flow" },
	{ opcode: 0xfd, name: "REVERT", category: "Control flow" },
	{ opcode: 0xfe, name: "INVALID", category: "Control flow" },
];

for (const { opcode, name, category } of opcodes) {
	const isPush = Bytecode.isPush(opcode);
	const pushSize = Bytecode.getPushSize(opcode);
	const isTerminator = Bytecode.isTerminator(opcode);
}

const controlFlowCode = Bytecode.fromHex("0x600556005760085b00f3fd");

const analysis = Bytecode.analyze(controlFlowCode);

// Find terminators
const terminators = analysis.instructions.filter((i) =>
	Bytecode.isTerminator(i.opcode),
);
terminators.forEach((inst) => {
	const name =
		inst.opcode === 0x00
			? "STOP"
			: inst.opcode === 0xf3
				? "RETURN"
				: inst.opcode === 0xfd
					? "REVERT"
					: "INVALID";
});

// Find jumps
const jumps = analysis.instructions.filter(
	(i) => i.opcode === 0x56 || i.opcode === 0x57,
);
jumps.forEach((inst) => {
	const name = inst.opcode === 0x56 ? "JUMP" : "JUMPI";
});
analysis.jumpDestinations.forEach((pos) => {});

const pushCode = Bytecode.fromHex(
	"0x60ff61123463abcdef627fffffff7f1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
);

const pushInstructions = Bytecode.parseInstructions(pushCode).filter((i) =>
	Bytecode.isPush(i.opcode),
);

for (const inst of pushInstructions) {
	const size = Bytecode.getPushSize(inst.opcode);

	let value = 0n;
	if (inst.pushData) {
		for (const byte of inst.pushData) {
			value = (value << 8n) | BigInt(byte);
		}
	}

	const pushName = `PUSH${size}`;
}

const contractCode = Bytecode.fromHex(
	"0x608060405234801561001057600080fd5b50600436106100365760003560e01c8063",
);

const instructions = Bytecode.parseInstructions(contractCode);

// Count opcode occurrences
const opcodeCount = new Map<number, number>();

for (const inst of instructions) {
	opcodeCount.set(inst.opcode, (opcodeCount.get(inst.opcode) || 0) + 1);
}

// Sort by frequency
const sorted = Array.from(opcodeCount.entries()).sort((a, b) => b[1] - a[1]);

const totalInstructions = instructions.length;

for (const [opcode, count] of sorted.slice(0, 10)) {
	const percentage = ((count / totalInstructions) * 100).toFixed(1);
	const isPush = Bytecode.isPush(opcode);
	const label = isPush
		? `PUSH${Bytecode.getPushSize(opcode)}`
		: `0x${opcode.toString(16).padStart(2, "0")}`;
}

// Build simple bytecode using constants
const built = new Uint8Array([
	Bytecode.PUSH1,
	0x80, // PUSH1 0x80
	Bytecode.PUSH1,
	0x40, // PUSH1 0x40
	0x52, // MSTORE
	Bytecode.JUMPDEST, // JUMPDEST
	Bytecode.STOP, // STOP
]);

const builtCode = Bytecode.from(built);
const disasm = Bytecode.formatInstructions(builtCode);
disasm.forEach((line) => {});

const testOpcodes = [
	{ value: 0x00, name: "STOP", defined: true },
	{ value: 0x5b, name: "JUMPDEST", defined: true },
	{ value: 0x60, name: "PUSH1", defined: true },
	{ value: 0xef, name: "Undefined (0xef)", defined: false },
	{ value: 0xff, name: "Unknown", defined: false },
];

for (const test of testOpcodes) {
	const code = Bytecode.from(new Uint8Array([test.value, 0x00]));
	const valid = Bytecode.validate(code);
}

const quickRef = [
	{ range: "0x00-0x0f", category: "Stop and Arithmetic" },
	{ range: "0x10-0x1f", category: "Comparison & Bitwise Logic" },
	{ range: "0x20-0x2f", category: "SHA3" },
	{ range: "0x30-0x3f", category: "Environmental Information" },
	{ range: "0x40-0x4f", category: "Block Information" },
	{ range: "0x50-0x5f", category: "Stack, Memory, Storage and Flow" },
	{ range: "0x60-0x7f", category: "Push Operations (PUSH1-PUSH32)" },
	{ range: "0x80-0x8f", category: "Duplication Operations (DUP1-DUP16)" },
	{ range: "0x90-0x9f", category: "Exchange Operations (SWAP1-SWAP16)" },
	{ range: "0xa0-0xaf", category: "Logging Operations (LOG0-LOG4)" },
	{ range: "0xf0-0xff", category: "System Operations" },
];
for (const { range, category } of quickRef) {
}
