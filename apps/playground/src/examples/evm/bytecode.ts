import { Bytecode, Opcode } from "@tevm/voltaire";

// Bytecode validation and jump destination analysis

// Simple EVM bytecode: PUSH1 0x80, PUSH1 0x40, MSTORE
const code = Bytecode("0x6080604052");

// Validate bytecode structure
const isValid = Bytecode.validate(code);

// Parse into instructions
const instructions = Bytecode.parseInstructions(code);
for (const inst of instructions) {
	const name = Opcode.getName(inst.opcode);
	const hex = inst.immediate
		? ` 0x${Buffer.from(inst.immediate).toString("hex")}`
		: "";
}

// Analyze jump destinations
const codeWithJumps = Bytecode("0x5b6001600256005b6002");
const jumpDests = Bytecode.analyzeJumpDestinations(codeWithJumps);

// Analyze basic blocks
const blocks = Bytecode.analyzeBlocks(code);
for (const block of blocks) {
}

// Check for Solidity metadata
const hasMetadata = Bytecode.hasMetadata(code);
