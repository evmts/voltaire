/**
 * Disassembly Example
 *
 * Demonstrates:
 * - Formatting bytecode as human-readable instructions
 * - Formatting individual instructions
 * - Creating disassembly output
 * - Analyzing bytecode with formatted output
 */

import { Bytecode } from "../../../src/primitives/Bytecode/index.js";

const simpleCode = Bytecode.fromHex("0x60016002015b00");

const disassembly = Bytecode.formatInstructions(simpleCode);
disassembly.forEach((line) => {});

// Solidity constructor prefix pattern
const constructorCode = Bytecode.fromHex(
	"0x608060405234801561001057600080fd5b50",
);

const constructorDisasm = Bytecode.formatInstructions(constructorCode);
constructorDisasm.forEach((line) => {});

const instructions = Bytecode.parseInstructions(simpleCode);
instructions.forEach((inst) => {
	const formatted = Bytecode.formatInstruction(inst);
});

function annotatedDisassembly(code: typeof Bytecode.prototype): string[] {
	const analysis = Bytecode.analyze(code);
	const lines: string[] = [];

	analysis.instructions.forEach((inst) => {
		let line = Bytecode.formatInstruction(inst);

		// Add annotations
		const annotations: string[] = [];

		if (analysis.jumpDestinations.has(inst.position)) {
			annotations.push("JUMP TARGET");
		}

		if (Bytecode.isTerminator(inst.opcode)) {
			annotations.push("TERMINATOR");
		}

		if (annotations.length > 0) {
			line += ` ; ${annotations.join(", ")}`;
		}

		lines.push(line);
	});

	return lines;
}

const annotatedCode = Bytecode.fromHex("0x600560565b60016002015b00");

const annotated = annotatedDisassembly(annotatedCode);
annotated.forEach((line) => {});

function sideBySide(code: typeof Bytecode.prototype): void {
	const instructions = Bytecode.parseInstructions(code);

	instructions.forEach((inst) => {
		const pos = inst.position.toString().padStart(4, " ");
		const opcodeHex = `0x${inst.opcode.toString(16).padStart(2, "0")}`;

		let hex = opcodeHex;
		if (inst.pushData) {
			const data = Array.from(inst.pushData)
				.map((b) => b.toString(16).padStart(2, "0"))
				.join("");
			hex += ` ${data}`;
		}

		const hexPadded = hex.padEnd(10, " ");
		const disasm = Bytecode.formatInstruction(inst).split(": ")[1] || "";
	});
}
sideBySide(simpleCode);

const pushCode = Bytecode.fromHex("0x60ff61123463abcdef01627fffffff5b00");

function disassemblyWithValues(code: typeof Bytecode.prototype): void {
	const instructions = Bytecode.parseInstructions(code);

	instructions.forEach((inst) => {
		const formatted = Bytecode.formatInstruction(inst);

		if (inst.pushData) {
			let value = 0n;
			for (const byte of inst.pushData) {
				value = (value << 8n) | BigInt(byte);
			}
		}
	});
}

disassemblyWithValues(pushCode);

const jumpCode = Bytecode.fromHex("0x6005565b60016002015b600a575b00");

function disassemblyWithJumps(code: typeof Bytecode.prototype): void {
	const analysis = Bytecode.analyze(code);
	const jumpdests = analysis.jumpDestinations;
	analysis.instructions.forEach((inst) => {
		let prefix = "  ";

		// Mark jump destinations
		if (jumpdests.has(inst.position)) {
			prefix = "→ ";
		}

		const formatted = Bytecode.formatInstruction(inst);

		// Annotate JUMP/JUMPI with target validation
		if (inst.opcode === 0x56 || inst.opcode === 0x57) {
		}
	});
}

disassemblyWithJumps(jumpCode);

function groupedDisassembly(code: typeof Bytecode.prototype): void {
	const analysis = Bytecode.analyze(code);
	let currentBlock = 0;

	analysis.instructions.forEach((inst, i) => {
		// Start new block at JUMPDEST
		if (analysis.jumpDestinations.has(inst.position) && i > 0) {
			currentBlock++;
		}

		const formatted = Bytecode.formatInstruction(inst);

		// End block at terminator or jump
		if (
			Bytecode.isTerminator(inst.opcode) ||
			inst.opcode === 0x56 ||
			inst.opcode === 0x57
		) {
			if (i < analysis.instructions.length - 1) {
			}
		}
	});
}

const blockedCode = Bytecode.fromHex("0x600160020100600360045b60ff5b00");

groupedDisassembly(blockedCode);

function compactDisassembly(code: typeof Bytecode.prototype): string {
	const instructions = Bytecode.parseInstructions(code);

	return instructions
		.map((inst) => {
			const formatted = Bytecode.formatInstruction(inst);
			// Extract just the opcode and data part
			const parts = formatted.split(": ");
			return parts[1] || formatted;
		})
		.join(" ; ");
}

const compactCode = Bytecode.fromHex("0x60016002015b00");
const compact = compactDisassembly(compactCode);

function disassemblyStats(code: typeof Bytecode.prototype): void {
	const analysis = Bytecode.analyze(code);
	const disasm = Bytecode.formatInstructions(code);
	disasm.forEach((line) => {});
}

const statsCode = Bytecode.fromHex("0x608060405234801561001057600080fd5b");
disassemblyStats(statsCode);

function exportDisassembly(code: typeof Bytecode.prototype): string {
	const lines: string[] = [];

	lines.push("; Bytecode disassembly");
	lines.push(`;   Size: ${Bytecode.size(code)} bytes`);
	lines.push(`;   Hex: ${Bytecode.toHex(code)}`);
	lines.push("");

	const disasm = Bytecode.formatInstructions(code);
	lines.push(...disasm);

	return lines.join("\n");
}

const exportCode = Bytecode.fromHex("0x60016002015b00");
const exported = exportDisassembly(exportCode);
