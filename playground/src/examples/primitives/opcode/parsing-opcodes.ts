import { Opcode, Bytes } from "@tevm/voltaire";
// Simple bytecode: PUSH1 0x60 PUSH1 0x40 MSTORE
const simpleBytecode = Bytes([
	Opcode.PUSH1,
	0x60, // PUSH1 0x60
	Opcode.PUSH1,
	0x40, // PUSH1 0x40
	Opcode.MSTORE, // MSTORE
	Opcode.STOP, // STOP
]);

// Parse bytecode into instructions
const instructions = Opcode.parse(simpleBytecode);
for (const inst of instructions) {
	const name = Opcode.name(inst.opcode);
	const immediate = inst.immediate
		? ` 0x${Array.from(inst.immediate)
				.map((b) => b.toString(16).padStart(2, "0"))
				.join("")}`
		: "";
}
const disassembly = Opcode.disassemble(simpleBytecode);

// Bytecode with conditional jump
const jumpBytecode = Bytes([
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

// Find all valid jump destinations
const dests = Opcode.jumpDests(jumpBytecode);

// Bytecode with various PUSH sizes
const pushBytecode = Bytes([
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

const parsedInstructions = Opcode.parse(pushBytecode);
for (const inst of parsedInstructions) {
	const formatted = Opcode.format(inst);
}

// Bytecode with undefined opcodes
const invalidBytecode = Bytes([
	Opcode.PUSH1,
	0x01, // Valid
	0x0c, // Invalid opcode
	Opcode.STOP, // Valid
	0x21, // Invalid opcode
]);

// Common Solidity constructor pattern
const constructorPattern = Bytes([
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
