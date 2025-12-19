import * as Opcode from "../../../primitives/Opcode/index.js";

// LOG0 (0xa0) - Log with no topics
const log0Info = Opcode.info(Opcode.LOG0);

// LOG1 (0xa1) - Log with 1 topic
const log1Info = Opcode.info(Opcode.LOG1);

// LOG2 (0xa2) - Log with 2 topics
const log2Info = Opcode.info(Opcode.LOG2);

// LOG3 (0xa3) - Log with 3 topics
const log3Info = Opcode.info(Opcode.LOG3);

// LOG4 (0xa4) - Log with 4 topics
const log4Info = Opcode.info(Opcode.LOG4);
const logOpcodes = [
	Opcode.LOG0,
	Opcode.LOG1,
	Opcode.LOG2,
	Opcode.LOG3,
	Opcode.LOG4,
];

for (const op of logOpcodes) {
	const topicCount = Opcode.logTopics(op);
}
const opcodes = [Opcode.LOG0, Opcode.LOG4, Opcode.ADD, Opcode.SSTORE];
for (const op of opcodes) {
	const name = Opcode.name(op);
	const isLog = Opcode.isLog(op);
}
// Simple LOG1 example: emit event with one topic
const logBytecode = new Uint8Array([
	Opcode.PUSH1,
	0x00, // PUSH1 0x00 (offset)
	Opcode.PUSH1,
	0x00, // PUSH1 0x00 (length - no data)
	Opcode.PUSH32, // PUSH32 (event signature hash)
	0x12,
	0x34,
	0x56,
	0x78,
	0x9a,
	0xbc,
	0xde,
	0xf0,
	0x12,
	0x34,
	0x56,
	0x78,
	0x9a,
	0xbc,
	0xde,
	0xf0,
	0x12,
	0x34,
	0x56,
	0x78,
	0x9a,
	0xbc,
	0xde,
	0xf0,
	0x12,
	0x34,
	0x56,
	0x78,
	0x9a,
	0xbc,
	0xde,
	0xf0,
	Opcode.LOG1, // LOG1 with 1 topic
	Opcode.STOP,
]);
