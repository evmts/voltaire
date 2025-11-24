import { Bytecode } from "../../../primitives/Bytecode/index.js";

// Example: Runtime bytecode (code stored on-chain after deployment)

// Simple runtime bytecode: returns 42
// PUSH1 0x2a, PUSH1 0x00, MSTORE, PUSH1 0x20, PUSH1 0x00, RETURN
const returnFortyTwo = Bytecode.fromHex("0x602a60005260206000f3");

const instructions = returnFortyTwo.parseInstructions();
for (const inst of instructions) {
}

// Storage operations
// Read from slot 0: PUSH1 0x00, SLOAD, PUSH1 0x00, MSTORE, PUSH1 0x20, PUSH1 0x00, RETURN
const storageRead = Bytecode.fromHex("0x60005460005260206000f3");

// Write to storage: PUSH1 0x2a, PUSH1 0x00, SSTORE
const storageWrite = Bytecode.fromHex("0x602a600055");

// Function dispatcher (simplified)
// PUSH1 0x00, CALLDATALOAD, PUSH1 0xe0, SHR (extracts function selector)
const dispatcher = Bytecode.fromHex("0x60003560e01c");

const dispatcherInstructions = dispatcher.parseInstructions();
for (const inst of dispatcherInstructions) {
}

// Analyze runtime code for jump destinations
const withJumps = Bytecode.fromHex("0x6005565b600100");

const analysis = withJumps.analyze();
