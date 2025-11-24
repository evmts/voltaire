import * as Opcode from "../../../primitives/Opcode/index.js";

// Example: Arithmetic opcodes - ADD, SUB, MUL, DIV, MOD, EXP

console.log("=== Basic Arithmetic Opcodes ===");

// ADD (0x01) - Addition
const addInfo = Opcode.info(Opcode.ADD);
console.log("\nADD (0x01):", {
	name: addInfo?.name,
	hex: "0x01",
	gasCost: addInfo?.gasCost,
	stackInputs: addInfo?.stackInputs, // takes 2 values
	stackOutputs: addInfo?.stackOutputs, // returns 1 value
	category: Opcode.getCategory(Opcode.ADD),
});

// SUB (0x03) - Subtraction
const subInfo = Opcode.info(Opcode.SUB);
console.log("\nSUB (0x03):", {
	name: subInfo?.name,
	hex: "0x03",
	gasCost: subInfo?.gasCost,
	stackInputs: subInfo?.stackInputs,
	stackOutputs: subInfo?.stackOutputs,
	category: Opcode.getCategory(Opcode.SUB),
});

// MUL (0x02) - Multiplication
const mulInfo = Opcode.info(Opcode.MUL);
console.log("\nMUL (0x02):", {
	name: mulInfo?.name,
	hex: "0x02",
	gasCost: mulInfo?.gasCost,
	stackInputs: mulInfo?.stackInputs,
	stackOutputs: mulInfo?.stackOutputs,
	category: Opcode.getCategory(Opcode.MUL),
});

// DIV (0x04) - Division
const divInfo = Opcode.info(Opcode.DIV);
console.log("\nDIV (0x04):", {
	name: divInfo?.name,
	hex: "0x04",
	gasCost: divInfo?.gasCost,
	stackInputs: divInfo?.stackInputs,
	stackOutputs: divInfo?.stackOutputs,
	category: Opcode.getCategory(Opcode.DIV),
});

// MOD (0x06) - Modulo
const modInfo = Opcode.info(Opcode.MOD);
console.log("\nMOD (0x06):", {
	name: modInfo?.name,
	hex: "0x06",
	gasCost: modInfo?.gasCost,
	stackInputs: modInfo?.stackInputs,
	stackOutputs: modInfo?.stackOutputs,
	category: Opcode.getCategory(Opcode.MOD),
});

console.log("\n=== Advanced Arithmetic Opcodes ===");

// EXP (0x0a) - Exponentiation
const expInfo = Opcode.info(Opcode.EXP);
console.log("\nEXP (0x0a):", {
	name: expInfo?.name,
	hex: "0x0a",
	gasCost: `${expInfo?.gasCost} (+ dynamic cost)`,
	stackInputs: expInfo?.stackInputs,
	stackOutputs: expInfo?.stackOutputs,
	category: Opcode.getCategory(Opcode.EXP),
});

// ADDMOD (0x08) - Modular addition
const addmodInfo = Opcode.info(Opcode.ADDMOD);
console.log("\nADDMOD (0x08):", {
	name: addmodInfo?.name,
	hex: "0x08",
	gasCost: addmodInfo?.gasCost,
	stackInputs: addmodInfo?.stackInputs, // takes 3 values: (a + b) % N
	stackOutputs: addmodInfo?.stackOutputs,
	category: Opcode.getCategory(Opcode.ADDMOD),
});

// MULMOD (0x09) - Modular multiplication
const mulmodInfo = Opcode.info(Opcode.MULMOD);
console.log("\nMULMOD (0x09):", {
	name: mulmodInfo?.name,
	hex: "0x09",
	gasCost: mulmodInfo?.gasCost,
	stackInputs: mulmodInfo?.stackInputs, // takes 3 values: (a * b) % N
	stackOutputs: mulmodInfo?.stackOutputs,
	category: Opcode.getCategory(Opcode.MULMOD),
});

// SIGNEXTEND (0x0b) - Sign extension
const signextendInfo = Opcode.info(Opcode.SIGNEXTEND);
console.log("\nSIGNEXTEND (0x0b):", {
	name: signextendInfo?.name,
	hex: "0x0b",
	gasCost: signextendInfo?.gasCost,
	stackInputs: signextendInfo?.stackInputs,
	stackOutputs: signextendInfo?.stackOutputs,
	category: Opcode.getCategory(Opcode.SIGNEXTEND),
});

console.log("\n=== Signed Arithmetic ===");

// SDIV (0x05) - Signed division
const sdivInfo = Opcode.info(Opcode.SDIV);
console.log("\nSDIV (0x05):", {
	name: sdivInfo?.name,
	hex: "0x05",
	gasCost: sdivInfo?.gasCost,
	stackInputs: sdivInfo?.stackInputs,
	stackOutputs: sdivInfo?.stackOutputs,
	category: Opcode.getCategory(Opcode.SDIV),
});

// SMOD (0x07) - Signed modulo
const smodInfo = Opcode.info(Opcode.SMOD);
console.log("\nSMOD (0x07):", {
	name: smodInfo?.name,
	hex: "0x07",
	gasCost: smodInfo?.gasCost,
	stackInputs: smodInfo?.stackInputs,
	stackOutputs: smodInfo?.stackOutputs,
	category: Opcode.getCategory(Opcode.SMOD),
});
