import { Bytecode, Opcode } from "@tevm/voltaire";

// Bytecode validation and jump destination analysis

// Simple EVM bytecode: PUSH1 0x80, PUSH1 0x40, MSTORE
const code = Bytecode("0x6080604052");
console.log("Bytecode:", Bytecode.toHex(code));

// Validate bytecode structure
const isValid = Bytecode.validate(code);
console.log("Is valid bytecode:", isValid);

// Parse into instructions
const instructions = Bytecode.parseInstructions(code);
console.log("\nParsed instructions:");
for (const inst of instructions) {
	const name = Opcode.getName(inst.opcode);
	const hex = inst.immediate
		? ` 0x${Buffer.from(inst.immediate).toString("hex")}`
		: "";
	console.log(`  ${name}${hex}`);
}

// Analyze jump destinations
const codeWithJumps = Bytecode("0x5b6001600256005b6002");
const jumpDests = Bytecode.analyzeJumpDestinations(codeWithJumps);
console.log("\nJump destinations:", [...jumpDests]);

// Analyze basic blocks
const blocks = Bytecode.analyzeBlocks(code);
console.log("\nBasic blocks:", blocks.length);
for (const block of blocks) {
	console.log(`  Block at ${block.start}-${block.end}`);
}

// Check for Solidity metadata
const hasMetadata = Bytecode.hasMetadata(code);
console.log("\nHas Solidity metadata:", hasMetadata);
