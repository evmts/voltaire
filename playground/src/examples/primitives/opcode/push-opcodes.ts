import { Opcode } from "voltaire";
// PUSH0 (0x5f) - Push 0 onto stack
const push0Info = Opcode.info(Opcode.PUSH0);

// PUSH1 (0x60) - Push 1 byte
const push1Info = Opcode.info(Opcode.PUSH1);

// PUSH2 (0x61) - Push 2 bytes
const push2Info = Opcode.info(Opcode.PUSH2);

// PUSH16 (0x6f) - Push 16 bytes
const push16Info = Opcode.info(Opcode.PUSH16);

// PUSH32 (0x7f) - Push 32 bytes
const push32Info = Opcode.info(Opcode.PUSH32);
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
}
// Manually construct PUSH instructions
const push1Bytecode = new Uint8Array([Opcode.PUSH1, 0x42]);

const push2Bytecode = new Uint8Array([Opcode.PUSH2, 0x12, 0x34]);

const push4Bytecode = new Uint8Array([Opcode.PUSH4, 0xaa, 0xbb, 0xcc, 0xdd]);
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
