import * as Opcode from "../../../primitives/Opcode/index.js";

// Example: Stack manipulation opcodes - DUP, SWAP, PUSH, POP

console.log("=== Stack Operations ===");

// POP (0x50) - Remove from stack
const popInfo = Opcode.info(Opcode.POP);
console.log("\nPOP (0x50):", {
	name: popInfo?.name,
	hex: "0x50",
	gasCost: popInfo?.gasCost,
	stackInputs: popInfo?.stackInputs, // 1 value removed
	stackOutputs: popInfo?.stackOutputs, // 0 values pushed
	category: Opcode.getCategory(Opcode.POP),
});

console.log("\n=== DUP Opcodes (DUP1-DUP16) ===");
// DUP duplicates stack items

const dupExamples = [
	{ op: Opcode.DUP1, pos: 1 },
	{ op: Opcode.DUP2, pos: 2 },
	{ op: Opcode.DUP8, pos: 8 },
	{ op: Opcode.DUP16, pos: 16 },
];

for (const { op, pos } of dupExamples) {
	const info = Opcode.info(op);
	console.log(`\n${info?.name} (0x${op.toString(16)}):`);
	console.log(`  Duplicates position: ${Opcode.dupPosition(op)}`);
	console.log(`  Gas cost: ${info?.gasCost}`);
	console.log(
		`  Stack effect: ${info?.stackInputs} inputs → ${info?.stackOutputs} outputs`,
	);
	console.log(`  isDup: ${Opcode.isDup(op)}`);
}

console.log("\n=== SWAP Opcodes (SWAP1-SWAP16) ===");
// SWAP swaps top stack item with Nth item

const swapExamples = [
	{ op: Opcode.SWAP1, pos: 1 },
	{ op: Opcode.SWAP2, pos: 2 },
	{ op: Opcode.SWAP8, pos: 8 },
	{ op: Opcode.SWAP16, pos: 16 },
];

for (const { op, pos } of swapExamples) {
	const info = Opcode.info(op);
	console.log(`\n${info?.name} (0x${op.toString(16)}):`);
	console.log(`  Swaps with position: ${Opcode.swapPosition(op)}`);
	console.log(`  Gas cost: ${info?.gasCost}`);
	console.log(
		`  Stack effect: ${info?.stackInputs} inputs → ${info?.stackOutputs} outputs`,
	);
	console.log(`  isSwap: ${Opcode.isSwap(op)}`);
}

console.log("\n=== DUP Position Mapping ===");
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

console.log("DUP opcodes duplicate from these stack positions:");
for (const op of dupOpcodes) {
	console.log(`${Opcode.name(op)}: position ${Opcode.dupPosition(op)}`);
}

console.log("\n=== SWAP Position Mapping ===");
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

console.log("SWAP opcodes swap top with these positions:");
for (const op of swapOpcodes) {
	console.log(`${Opcode.name(op)}: position ${Opcode.swapPosition(op)}`);
}

console.log("\n=== Stack Effects ===");
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
	console.log(
		`${info?.name}: ${inputs} inputs → ${outputs} outputs (net: ${effect >= 0 ? "+" : ""}${effect})`,
	);
}

console.log("\n=== Stack Size Limits ===");
console.log("EVM stack is limited to 1024 items");
console.log("DUP can access up to 16 items deep (DUP1-DUP16)");
console.log("SWAP can access up to 17 items (top + 16 positions)");
