import { Bytecode } from "../../../primitives/Bytecode/index.js";

// Example: Opcode analysis and instruction parsing

// Complex bytecode with various opcode types
const complex = Bytecode.fromHex(
	"0x6080604052600436106100405760003560e01c8063a413686214610045578063cfae32171461006e575b600080fd5b",
);
const instructions = complex.parseInstructions();
for (let i = 0; i < Math.min(10, instructions.length); i++) {}
const analysis = complex.analyze();
const pushInstructions = instructions.filter((inst) =>
	Bytecode.isPush(inst.opcode),
);
for (let i = 0; i < Math.min(5, pushInstructions.length); i++) {}
const terminators = instructions.filter((inst) =>
	Bytecode.isTerminator(inst.opcode),
);
for (const inst of terminators) {
}

// Jump destination validation
const codeWithJumps = Bytecode.fromHex("0x60055660005b6001005b600200");

const jumpAnalysis = codeWithJumps.analyze();

// Check if specific offsets are valid jump destinations
for (let offset = 0; offset < codeWithJumps.size(); offset++) {
	if (codeWithJumps.isValidJumpDest(offset)) {
	}
}
const simple = Bytecode.fromHex("0x6001600201");
const blocks = complex.analyzeBlocks();
for (let i = 0; i < Math.min(3, blocks.length); i++) {
	const block = blocks[i];
}
