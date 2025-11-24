import * as Opcode from "../../../primitives/Opcode/index.js";

// Example: Opcode basics - EVM opcode operations

console.log("=== Opcode Creation ===");
// Common EVM opcodes (hex values)
const add = Opcode.ADD; // 0x01
const mul = Opcode.MUL; // 0x02
const push1 = Opcode.PUSH1; // 0x60
const sstore = Opcode.SSTORE; // 0x55
const call = Opcode.CALL; // 0xf1

console.log(`ADD: 0x${add.toString(16).padStart(2, "0")}`);
console.log(`MUL: 0x${mul.toString(16).padStart(2, "0")}`);
console.log(`PUSH1: 0x${push1.toString(16).padStart(2, "0")}`);
console.log(`SSTORE: 0x${sstore.toString(16).padStart(2, "0")}`);
console.log(`CALL: 0x${call.toString(16).padStart(2, "0")}`);

console.log("\n=== Opcode Names ===");
// Get opcode names
console.log(`0x01: ${Opcode.name(Opcode.ADD)}`);
console.log(`0x02: ${Opcode.name(Opcode.MUL)}`);
console.log(`0x60: ${Opcode.name(Opcode.PUSH1)}`);
console.log(`0x55: ${Opcode.name(Opcode.SSTORE)}`);
console.log(`0xf1: ${Opcode.name(Opcode.CALL)}`);
console.log(`0x0c (invalid): ${Opcode.name(0x0c)}`);

console.log("\n=== Opcode Metadata ===");
// Get detailed opcode info
const addInfo = Opcode.info(Opcode.ADD);
console.log("ADD info:", {
	name: addInfo?.name,
	gasCost: addInfo?.gasCost,
	stackInputs: addInfo?.stackInputs,
	stackOutputs: addInfo?.stackOutputs,
});

const callInfo = Opcode.info(Opcode.CALL);
console.log("CALL info:", {
	name: callInfo?.name,
	gasCost: callInfo?.gasCost,
	stackInputs: callInfo?.stackInputs,
	stackOutputs: callInfo?.stackOutputs,
});

console.log("\n=== Opcode Categories ===");
// Get opcode categories
console.log(`ADD category: ${Opcode.getCategory(Opcode.ADD)}`);
console.log(`SSTORE category: ${Opcode.getCategory(Opcode.SSTORE)}`);
console.log(`JUMP category: ${Opcode.getCategory(Opcode.JUMP)}`);
console.log(`CALL category: ${Opcode.getCategory(Opcode.CALL)}`);
console.log(`PUSH1 category: ${Opcode.getCategory(Opcode.PUSH1)}`);
console.log(`LOG0 category: ${Opcode.getCategory(Opcode.LOG0)}`);
console.log(`KECCAK256 category: ${Opcode.getCategory(Opcode.KECCAK256)}`);

console.log("\n=== Opcode Type Checks ===");
// Check opcode types
console.log(`PUSH1 isPush: ${Opcode.isPush(Opcode.PUSH1)}`);
console.log(`PUSH32 isPush: ${Opcode.isPush(Opcode.PUSH32)}`);
console.log(`ADD isPush: ${Opcode.isPush(Opcode.ADD)}`);

console.log(`DUP1 isDup: ${Opcode.isDup(Opcode.DUP1)}`);
console.log(`DUP16 isDup: ${Opcode.isDup(Opcode.DUP16)}`);
console.log(`ADD isDup: ${Opcode.isDup(Opcode.ADD)}`);

console.log(`SWAP1 isSwap: ${Opcode.isSwap(Opcode.SWAP1)}`);
console.log(`SWAP16 isSwap: ${Opcode.isSwap(Opcode.SWAP16)}`);
console.log(`ADD isSwap: ${Opcode.isSwap(Opcode.ADD)}`);

console.log(`LOG0 isLog: ${Opcode.isLog(Opcode.LOG0)}`);
console.log(`LOG4 isLog: ${Opcode.isLog(Opcode.LOG4)}`);
console.log(`ADD isLog: ${Opcode.isLog(Opcode.ADD)}`);

console.log("\n=== Opcode Validation ===");
// Validate opcodes
console.log(`0x01 (ADD) isValid: ${Opcode.isValid(0x01)}`);
console.log(`0x60 (PUSH1) isValid: ${Opcode.isValid(0x60)}`);
console.log(`0x0c (undefined) isValid: ${Opcode.isValid(0x0c)}`);
console.log(`0x21 (undefined) isValid: ${Opcode.isValid(0x21)}`);
