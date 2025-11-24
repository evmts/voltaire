import * as Opcode from "../../../primitives/Opcode/index.js";

// Example: Parsing and disassembling bytecode

console.log("=== Simple Bytecode Parsing ===");

// Simple bytecode: PUSH1 0x60 PUSH1 0x40 MSTORE
const simpleBytecode = new Uint8Array([
	Opcode.PUSH1,
	0x60, // PUSH1 0x60
	Opcode.PUSH1,
	0x40, // PUSH1 0x40
	Opcode.MSTORE, // MSTORE
	Opcode.STOP, // STOP
]);

console.log(
	"\nBytecode:",
	Array.from(simpleBytecode)
		.map((b) => `0x${b.toString(16).padStart(2, "0")}`)
		.join(" "),
);

// Parse bytecode into instructions
const instructions = Opcode.parse(simpleBytecode);
console.log("\nParsed instructions:");
for (const inst of instructions) {
	const name = Opcode.name(inst.opcode);
	const immediate = inst.immediate
		? ` 0x${Array.from(inst.immediate)
				.map((b) => b.toString(16).padStart(2, "0"))
				.join("")}`
		: "";
	console.log(`  [${inst.offset}] ${name}${immediate}`);
}

console.log("\n=== Disassembly ===");
const disassembly = Opcode.disassemble(simpleBytecode);
console.log(disassembly);

console.log("\n=== Complex Bytecode with Jumps ===");

// Bytecode with conditional jump
const jumpBytecode = new Uint8Array([
	Opcode.PUSH1,
	0x01, // PUSH1 0x01
	Opcode.PUSH1,
	0x09, // PUSH1 0x09 (jump dest offset)
	Opcode.JUMPI, // JUMPI
	Opcode.PUSH1,
	0x42, // PUSH1 0x42 (skipped if jump taken)
	Opcode.STOP, // STOP (skipped if jump taken)
	Opcode.JUMPDEST, // JUMPDEST at offset 9
	Opcode.PUSH1,
	0xff, // PUSH1 0xff
	Opcode.STOP, // STOP
]);

console.log(
	"\nBytecode:",
	Array.from(jumpBytecode)
		.map((b) => `0x${b.toString(16).padStart(2, "0")}`)
		.join(" "),
);
console.log("\nDisassembly:");
console.log(Opcode.disassemble(jumpBytecode));

// Find all valid jump destinations
const dests = Opcode.jumpDests(jumpBytecode);
console.log("\nValid JUMPDEST offsets:", Array.from(dests));

// Validate specific offsets
console.log(
	`Offset 9 is valid JUMPDEST: ${Opcode.isValidJumpDest(jumpBytecode, 9)}`,
);
console.log(
	`Offset 5 is valid JUMPDEST: ${Opcode.isValidJumpDest(jumpBytecode, 5)}`,
);

console.log("\n=== PUSH Immediate Data ===");

// Bytecode with various PUSH sizes
const pushBytecode = new Uint8Array([
	Opcode.PUSH1,
	0x01, // PUSH1
	Opcode.PUSH2,
	0x12,
	0x34, // PUSH2
	Opcode.PUSH4,
	0xaa,
	0xbb,
	0xcc,
	0xdd, // PUSH4
	Opcode.STOP,
]);

console.log(
	"\nBytecode:",
	Array.from(pushBytecode)
		.map((b) => `0x${b.toString(16).padStart(2, "0")}`)
		.join(" "),
);
console.log("\nDisassembly:");
console.log(Opcode.disassemble(pushBytecode));

console.log("\n=== Instruction Formatting ===");

const parsedInstructions = Opcode.parse(pushBytecode);
console.log("\nFormatted instructions:");
for (const inst of parsedInstructions) {
	const formatted = Opcode.format(inst);
	console.log(`  ${formatted}`);
}

console.log("\n=== Bytecode with Invalid Opcodes ===");

// Bytecode with undefined opcodes
const invalidBytecode = new Uint8Array([
	Opcode.PUSH1,
	0x01, // Valid
	0x0c, // Invalid opcode
	Opcode.STOP, // Valid
	0x21, // Invalid opcode
]);

console.log(
	"\nBytecode:",
	Array.from(invalidBytecode)
		.map((b) => `0x${b.toString(16).padStart(2, "0")}`)
		.join(" "),
);
console.log("\nDisassembly:");
console.log(Opcode.disassemble(invalidBytecode));

console.log("\n=== Real Contract Pattern ===");

// Common Solidity constructor pattern
const constructorPattern = new Uint8Array([
	Opcode.PUSH1,
	0x80, // PUSH1 0x80 (free memory pointer)
	Opcode.PUSH1,
	0x40, // PUSH1 0x40 (free memory pointer slot)
	Opcode.MSTORE, // MSTORE (initialize free memory pointer)
	Opcode.CALLVALUE, // CALLVALUE
	Opcode.DUP1, // DUP1
	Opcode.ISZERO, // ISZERO
	Opcode.PUSH1,
	0x0e, // PUSH1 0x0e (jump dest)
	Opcode.JUMPI, // JUMPI (jump if no value sent)
	Opcode.PUSH1,
	0x00, // PUSH1 0x00
	Opcode.DUP1, // DUP1
	Opcode.REVERT, // REVERT (revert if value sent)
	Opcode.JUMPDEST, // JUMPDEST at offset 14
	Opcode.POP, // POP
	Opcode.STOP, // STOP
]);

console.log("\nSolidity constructor pattern (reject ETH):");
console.log(Opcode.disassemble(constructorPattern));
