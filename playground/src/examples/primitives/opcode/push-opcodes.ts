import * as Opcode from "../../../primitives/Opcode/index.js";

// Example: PUSH opcodes - PUSH0, PUSH1-PUSH32

console.log("=== PUSH0 (EIP-3855) ===");

// PUSH0 (0x5f) - Push 0 onto stack
const push0Info = Opcode.info(Opcode.PUSH0);
console.log("\nPUSH0 (0x5f):", {
	name: push0Info?.name,
	hex: "0x5f",
	gasCost: push0Info?.gasCost,
	stackInputs: push0Info?.stackInputs,
	stackOutputs: push0Info?.stackOutputs,
	category: Opcode.getCategory(Opcode.PUSH0),
	isPush: Opcode.isPush(Opcode.PUSH0),
	pushSize: Opcode.getPushSize(Opcode.PUSH0),
});

console.log("\n=== PUSH1-PUSH32 ===");

// PUSH1 (0x60) - Push 1 byte
const push1Info = Opcode.info(Opcode.PUSH1);
console.log("\nPUSH1 (0x60):", {
	name: push1Info?.name,
	hex: "0x60",
	gasCost: push1Info?.gasCost,
	stackInputs: push1Info?.stackInputs,
	stackOutputs: push1Info?.stackOutputs,
	category: Opcode.getCategory(Opcode.PUSH1),
	isPush: Opcode.isPush(Opcode.PUSH1),
	pushSize: Opcode.getPushSize(Opcode.PUSH1), // 1 byte
});

// PUSH2 (0x61) - Push 2 bytes
const push2Info = Opcode.info(Opcode.PUSH2);
console.log("\nPUSH2 (0x61):", {
	name: push2Info?.name,
	hex: "0x61",
	gasCost: push2Info?.gasCost,
	isPush: Opcode.isPush(Opcode.PUSH2),
	pushSize: Opcode.getPushSize(Opcode.PUSH2), // 2 bytes
});

// PUSH16 (0x6f) - Push 16 bytes
const push16Info = Opcode.info(Opcode.PUSH16);
console.log("\nPUSH16 (0x6f):", {
	name: push16Info?.name,
	hex: "0x6f",
	gasCost: push16Info?.gasCost,
	isPush: Opcode.isPush(Opcode.PUSH16),
	pushSize: Opcode.getPushSize(Opcode.PUSH16), // 16 bytes
});

// PUSH32 (0x7f) - Push 32 bytes
const push32Info = Opcode.info(Opcode.PUSH32);
console.log("\nPUSH32 (0x7f):", {
	name: push32Info?.name,
	hex: "0x7f",
	gasCost: push32Info?.gasCost,
	isPush: Opcode.isPush(Opcode.PUSH32),
	pushSize: Opcode.getPushSize(Opcode.PUSH32), // 32 bytes (max)
});

console.log("\n=== PUSH Size Lookup ===");
// Show push sizes for all PUSH opcodes
const pushOpcodes = [
	Opcode.PUSH1,
	Opcode.PUSH2,
	Opcode.PUSH4,
	Opcode.PUSH8,
	Opcode.PUSH16,
	Opcode.PUSH20,
	Opcode.PUSH32,
];

for (const op of pushOpcodes) {
	console.log(`${Opcode.name(op)}: ${Opcode.getPushSize(op)} bytes`);
}

console.log("\n=== Get PUSH Opcode for Size ===");
// Get the correct PUSH opcode for a given byte size
console.log(`1 byte → ${Opcode.name(Opcode.pushOpcode(1))}`);
console.log(`2 bytes → ${Opcode.name(Opcode.pushOpcode(2))}`);
console.log(`4 bytes → ${Opcode.name(Opcode.pushOpcode(4))}`);
console.log(`20 bytes (address) → ${Opcode.name(Opcode.pushOpcode(20))}`);
console.log(`32 bytes (word) → ${Opcode.name(Opcode.pushOpcode(32))}`);

console.log("\n=== Reverse Lookup: Size from Opcode ===");
// Get byte size from PUSH opcode
console.log(`PUSH1 pushes: ${Opcode.pushBytes(Opcode.PUSH1)} bytes`);
console.log(`PUSH2 pushes: ${Opcode.pushBytes(Opcode.PUSH2)} bytes`);
console.log(`PUSH4 pushes: ${Opcode.pushBytes(Opcode.PUSH4)} bytes`);
console.log(`PUSH20 pushes: ${Opcode.pushBytes(Opcode.PUSH20)} bytes`);
console.log(`PUSH32 pushes: ${Opcode.pushBytes(Opcode.PUSH32)} bytes`);
console.log(`PUSH0 pushes: ${Opcode.pushBytes(Opcode.PUSH0)} bytes`);

console.log("\n=== Manual PUSH Bytecode Construction ===");
// Manually construct PUSH instructions
const push1Bytecode = new Uint8Array([Opcode.PUSH1, 0x42]);
console.log(
	"PUSH1 0x42:",
	Array.from(push1Bytecode)
		.map((b) => `0x${b.toString(16).padStart(2, "0")}`)
		.join(" "),
);

const push2Bytecode = new Uint8Array([Opcode.PUSH2, 0x12, 0x34]);
console.log(
	"PUSH2 0x1234:",
	Array.from(push2Bytecode)
		.map((b) => `0x${b.toString(16).padStart(2, "0")}`)
		.join(" "),
);

const push4Bytecode = new Uint8Array([Opcode.PUSH4, 0xaa, 0xbb, 0xcc, 0xdd]);
console.log(
	"PUSH4 0xaabbccdd:",
	Array.from(push4Bytecode)
		.map((b) => `0x${b.toString(16).padStart(2, "0")}`)
		.join(" "),
);

console.log("\n=== All PUSH Opcodes ===");
// Show all 33 PUSH opcodes (PUSH0 + PUSH1-PUSH32)
const allPushOpcodes = [
	Opcode.PUSH0,
	Opcode.PUSH1,
	Opcode.PUSH2,
	Opcode.PUSH3,
	Opcode.PUSH4,
	Opcode.PUSH5,
	Opcode.PUSH6,
	Opcode.PUSH7,
	Opcode.PUSH8,
	Opcode.PUSH9,
	Opcode.PUSH10,
	Opcode.PUSH11,
	Opcode.PUSH12,
	Opcode.PUSH13,
	Opcode.PUSH14,
	Opcode.PUSH15,
	Opcode.PUSH16,
	Opcode.PUSH17,
	Opcode.PUSH18,
	Opcode.PUSH19,
	Opcode.PUSH20,
	Opcode.PUSH21,
	Opcode.PUSH22,
	Opcode.PUSH23,
	Opcode.PUSH24,
	Opcode.PUSH25,
	Opcode.PUSH26,
	Opcode.PUSH27,
	Opcode.PUSH28,
	Opcode.PUSH29,
	Opcode.PUSH30,
	Opcode.PUSH31,
	Opcode.PUSH32,
];

console.log(`Total PUSH opcodes: ${allPushOpcodes.length}`);
console.log(
	"Range:",
	`0x${allPushOpcodes[0].toString(16)} - 0x${allPushOpcodes[allPushOpcodes.length - 1].toString(16)}`,
);
