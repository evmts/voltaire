/**
 * Bytecode Analysis Example
 *
 * Demonstrates:
 * - Complete bytecode analysis (analyze method)
 * - Jump destination analysis
 * - Instruction parsing with PUSH data
 * - Opcode utilities (isPush, getPushSize, isTerminator)
 * - Extracting PUSH values
 */

import { Bytecode } from "../../../src/primitives/Bytecode/index.js";

const code = Bytecode.fromHex("0x60016002015b60ff5b00");

const analysis = Bytecode.analyze(code);
analysis.instructions.forEach((inst) => {
	const hex = `0x${inst.opcode.toString(16).padStart(2, "0")}`;
	let line = `  ${inst.position}: ${hex}`;

	if (inst.pushData) {
		const data = Array.from(inst.pushData)
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("");
		line += ` (PUSH data: 0x${data})`;
	}
});
analysis.jumpDestinations.forEach((pos) => {});

// Bytecode with JUMPDEST that could be confused with PUSH data
const trickCode = Bytecode.fromHex("0x605b5b");

const jumpdests = Bytecode.analyzeJumpDestinations(trickCode);

const complexCode = Bytecode.fromHex("0x608060405234801561001057600080fd5b50");

const instructions = Bytecode.parseInstructions(complexCode);
instructions.slice(0, 10).forEach((inst) => {
	const hex = `0x${inst.opcode.toString(16).padStart(2, "0")}`;
	let line = `  [${inst.position.toString().padStart(2)}] ${hex}`;

	if (inst.pushData) {
		const size = inst.pushData.length;
		const data = Array.from(inst.pushData)
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("");
		line += ` PUSH${size} 0x${data}`;
	}
});

if (instructions.length > 10) {
}

const opcodes = [
	{ value: 0x60, name: "PUSH1" },
	{ value: 0x61, name: "PUSH2" },
	{ value: 0x7f, name: "PUSH32" },
	{ value: 0x5b, name: "JUMPDEST" },
	{ value: 0x00, name: "STOP" },
	{ value: 0xf3, name: "RETURN" },
	{ value: 0xfd, name: "REVERT" },
	{ value: 0xfe, name: "INVALID" },
];
opcodes.forEach(({ value, name }) => {
	const isPush = Bytecode.isPush(value);
	const pushSize = Bytecode.getPushSize(value);
	const isTerminator = Bytecode.isTerminator(value);
});

function extractPushValues(code: typeof Bytecode.prototype): bigint[] {
	const instructions = Bytecode.parseInstructions(code);
	const values: bigint[] = [];

	for (const inst of instructions) {
		if (inst.pushData) {
			let value = 0n;
			for (const byte of inst.pushData) {
				value = (value << 8n) | BigInt(byte);
			}
			values.push(value);
		}
	}

	return values;
}

const pushCode = Bytecode.fromHex("0x60ff61123463abcdef");

const pushValues = extractPushValues(pushCode);
pushValues.forEach((value, i) => {});

function findTerminators(code: typeof Bytecode.prototype): number[] {
	const instructions = Bytecode.parseInstructions(code);
	const positions: number[] = [];

	for (const inst of instructions) {
		if (Bytecode.isTerminator(inst.opcode)) {
			positions.push(inst.position);
		}
	}

	return positions;
}

const terminatorCode = Bytecode.fromHex("0x600160020100600360040200f3");

const terminators = findTerminators(terminatorCode);

terminators.forEach((pos) => {
	const instructions = Bytecode.parseInstructions(terminatorCode);
	const inst = instructions.find((i) => i.position === pos);
	if (inst) {
		const name =
			inst.opcode === 0x00
				? "STOP"
				: inst.opcode === 0xf3
					? "RETURN"
					: "REVERT";
	}
});

function analyzeInstructionTypes(code: typeof Bytecode.prototype) {
	const analysis = Bytecode.analyze(code);

	const pushCount = analysis.instructions.filter((i) =>
		Bytecode.isPush(i.opcode),
	).length;

	const terminatorCount = analysis.instructions.filter((i) =>
		Bytecode.isTerminator(i.opcode),
	).length;

	const jumpdestCount = analysis.jumpDestinations.size;

	return {
		total: analysis.instructions.length,
		push: pushCount,
		terminators: terminatorCount,
		jumpdests: jumpdestCount,
		other:
			analysis.instructions.length -
			pushCount -
			terminatorCount -
			jumpdestCount,
	};
}

const statsCode = Bytecode.fromHex(
	"0x608060405234801561001057600080fd5b5060043610610041",
);

const stats = analyzeInstructionTypes(statsCode);

function findPushInstructions(code: typeof Bytecode.prototype) {
	const instructions = Bytecode.parseInstructions(code);
	return instructions.filter((inst) => Bytecode.isPush(inst.opcode));
}

const pushFindCode = Bytecode.fromHex("0x600160025b60ff5b00");

const pushes = findPushInstructions(pushFindCode);

pushes.forEach((inst) => {
	const size = Bytecode.getPushSize(inst.opcode);
	const data = inst.pushData
		? Array.from(inst.pushData)
				.map((b) => b.toString(16).padStart(2, "0"))
				.join("")
		: "";
});

function analyzeContract(code: typeof Bytecode.prototype) {
	const analysis = Bytecode.analyze(code);

	return {
		valid: analysis.valid,
		size: Bytecode.size(code),
		instructionCount: analysis.instructions.length,
		jumpDestCount: analysis.jumpDestinations.size,
		hasMetadata: Bytecode.hasMetadata(code),
		pushCount: analysis.instructions.filter((i) => Bytecode.isPush(i.opcode))
			.length,
		terminatorCount: analysis.instructions.filter((i) =>
			Bytecode.isTerminator(i.opcode),
		).length,
	};
}

const contractCode = Bytecode.fromHex(
	"0x608060405234801561001057600080fd5b50600436106100415760003560e01c8063",
);

const contractInfo = analyzeContract(contractCode);
