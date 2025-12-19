import * as Opcode from "../../../primitives/Opcode/index.js";

// POP (0x50) - Remove from stack
const popInfo = Opcode.info(Opcode.POP);
// DUP duplicates stack items

const dupExamples = [
	{ op: Opcode.DUP1, pos: 1 },
	{ op: Opcode.DUP2, pos: 2 },
	{ op: Opcode.DUP8, pos: 8 },
	{ op: Opcode.DUP16, pos: 16 },
];

for (const { op, pos } of dupExamples) {
	const info = Opcode.info(op);
}
// SWAP swaps top stack item with Nth item

const swapExamples = [
	{ op: Opcode.SWAP1, pos: 1 },
	{ op: Opcode.SWAP2, pos: 2 },
	{ op: Opcode.SWAP8, pos: 8 },
	{ op: Opcode.SWAP16, pos: 16 },
];

for (const { op, pos } of swapExamples) {
	const info = Opcode.info(op);
}
// Show position for all DUP opcodes
const dupOpcodes = [
	Opcode.DUP1,
	Opcode.DUP2,
	Opcode.DUP3,
	Opcode.DUP4,
	Opcode.DUP5,
	Opcode.DUP6,
	Opcode.DUP7,
	Opcode.DUP8,
	Opcode.DUP9,
	Opcode.DUP10,
	Opcode.DUP11,
	Opcode.DUP12,
	Opcode.DUP13,
	Opcode.DUP14,
	Opcode.DUP15,
	Opcode.DUP16,
];
for (const op of dupOpcodes) {
}
// Show position for all SWAP opcodes
const swapOpcodes = [
	Opcode.SWAP1,
	Opcode.SWAP2,
	Opcode.SWAP3,
	Opcode.SWAP4,
	Opcode.SWAP5,
	Opcode.SWAP6,
	Opcode.SWAP7,
	Opcode.SWAP8,
	Opcode.SWAP9,
	Opcode.SWAP10,
	Opcode.SWAP11,
	Opcode.SWAP12,
	Opcode.SWAP13,
	Opcode.SWAP14,
	Opcode.SWAP15,
	Opcode.SWAP16,
];
for (const op of swapOpcodes) {
}
// Show stack input/output for various opcodes
const stackOps = [
	Opcode.POP, // 1 → 0
	Opcode.PUSH1, // 0 → 1
	Opcode.DUP1, // 1 → 2
	Opcode.SWAP1, // 2 → 2
	Opcode.ADD, // 2 → 1
	Opcode.CALL, // 7 → 1
];

for (const op of stackOps) {
	const info = Opcode.info(op);
	const inputs = Opcode.getStackInput(op);
	const outputs = Opcode.getStackOutput(op);
	const effect = outputs - inputs;
}
