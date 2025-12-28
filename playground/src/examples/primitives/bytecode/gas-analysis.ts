import { Bytecode } from "voltaire";
// Example: Gas analysis and cost calculation

// Simple bytecode with known gas costs
const simple = Bytecode.fromHex("0x6001600201"); // PUSH1 1, PUSH1 2, ADD

const simpleAnalysis = simple.analyzeGas();

// Show per-instruction costs
const instructions = simple.parseInstructions();
for (const inst of instructions) {
}

// Storage operations (high gas cost)
const storage = Bytecode.fromHex("0x602a600055"); // PUSH1 42, PUSH1 0, SSTORE

const storageAnalysis = storage.analyzeGas();
if (storageAnalysis.expensive.length > 0) {
}

// Memory operations
const memory = Bytecode.fromHex("0x602a60005260206000f3"); // PUSH1 42, PUSH1 0, MSTORE, PUSH1 32, PUSH1 0, RETURN

const memoryAnalysis = memory.analyzeGas();
for (const inst of memoryAnalysis.byInstruction.slice(0, 3)) {
}

// Complex bytecode with jumps
const withJumps = Bytecode.fromHex("0x60055660005b6001005b600200");

const jumpAnalysis = withJumps.analyzeGas();
for (const block of jumpAnalysis.byBlock) {
}

// Function dispatcher (realistic contract)
const dispatcher = Bytecode.fromHex(
	"0x6080604052600436106100405760003560e01c8063a413686214610045",
);

const dispatcherAnalysis = dispatcher.analyzeGas();
const codes = [
	{ name: "Simple arithmetic", code: simple, analysis: simpleAnalysis },
	{ name: "Storage write", code: storage, analysis: storageAnalysis },
	{ name: "Memory + return", code: memory, analysis: memoryAnalysis },
	{ name: "With jumps", code: withJumps, analysis: jumpAnalysis },
	{ name: "Dispatcher", code: dispatcher, analysis: dispatcherAnalysis },
];
for (const { name, analysis } of codes) {
}
for (const { name, analysis } of codes) {
	if (analysis.expensive.length > 0) {
	}
}
const stackHeavy = Bytecode.fromHex("0x6001600260036004600501010101"); // Multiple PUSH + ADD
const stackAnalysis = stackHeavy.analyzeStack();

const gasAnalysis = stackHeavy.analyzeGas();
