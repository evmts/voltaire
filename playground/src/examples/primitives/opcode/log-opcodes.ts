import * as Opcode from "../../../primitives/Opcode/index.js";

// Example: LOG opcodes - LOG0, LOG1, LOG2, LOG3, LOG4

console.log("=== Event Logging Opcodes ===");

// LOG0 (0xa0) - Log with no topics
const log0Info = Opcode.info(Opcode.LOG0);
console.log("\nLOG0 (0xa0):", {
	name: log0Info?.name,
	hex: "0xa0",
	gasCost: `${log0Info?.gasCost} (base + 8 per byte)`,
	stackInputs: log0Info?.stackInputs, // offset, length
	stackOutputs: log0Info?.stackOutputs, // none
	category: Opcode.getCategory(Opcode.LOG0),
	isLog: Opcode.isLog(Opcode.LOG0),
	topics: Opcode.logTopics(Opcode.LOG0),
});

// LOG1 (0xa1) - Log with 1 topic
const log1Info = Opcode.info(Opcode.LOG1);
console.log("\nLOG1 (0xa1):", {
	name: log1Info?.name,
	hex: "0xa1",
	gasCost: `${log1Info?.gasCost} (base + 8 per byte + 375 per topic)`,
	stackInputs: log1Info?.stackInputs, // offset, length, topic1
	stackOutputs: log1Info?.stackOutputs,
	category: Opcode.getCategory(Opcode.LOG1),
	isLog: Opcode.isLog(Opcode.LOG1),
	topics: Opcode.logTopics(Opcode.LOG1),
});

// LOG2 (0xa2) - Log with 2 topics
const log2Info = Opcode.info(Opcode.LOG2);
console.log("\nLOG2 (0xa2):", {
	name: log2Info?.name,
	hex: "0xa2",
	gasCost: `${log2Info?.gasCost} (base + 8 per byte + 375 per topic)`,
	stackInputs: log2Info?.stackInputs, // offset, length, topic1, topic2
	stackOutputs: log2Info?.stackOutputs,
	category: Opcode.getCategory(Opcode.LOG2),
	isLog: Opcode.isLog(Opcode.LOG2),
	topics: Opcode.logTopics(Opcode.LOG2),
});

// LOG3 (0xa3) - Log with 3 topics
const log3Info = Opcode.info(Opcode.LOG3);
console.log("\nLOG3 (0xa3):", {
	name: log3Info?.name,
	hex: "0xa3",
	gasCost: `${log3Info?.gasCost} (base + 8 per byte + 375 per topic)`,
	stackInputs: log3Info?.stackInputs, // offset, length, topic1, topic2, topic3
	stackOutputs: log3Info?.stackOutputs,
	category: Opcode.getCategory(Opcode.LOG3),
	isLog: Opcode.isLog(Opcode.LOG3),
	topics: Opcode.logTopics(Opcode.LOG3),
});

// LOG4 (0xa4) - Log with 4 topics
const log4Info = Opcode.info(Opcode.LOG4);
console.log("\nLOG4 (0xa4):", {
	name: log4Info?.name,
	hex: "0xa4",
	gasCost: `${log4Info?.gasCost} (base + 8 per byte + 375 per topic)`,
	stackInputs: log4Info?.stackInputs, // offset, length, topic1, topic2, topic3, topic4
	stackOutputs: log4Info?.stackOutputs,
	category: Opcode.getCategory(Opcode.LOG4),
	isLog: Opcode.isLog(Opcode.LOG4),
	topics: Opcode.logTopics(Opcode.LOG4),
});

console.log("\n=== LOG Topic Counts ===");
const logOpcodes = [
	Opcode.LOG0,
	Opcode.LOG1,
	Opcode.LOG2,
	Opcode.LOG3,
	Opcode.LOG4,
];

for (const op of logOpcodes) {
	const topicCount = Opcode.logTopics(op);
	console.log(`${Opcode.name(op)}: ${topicCount} topics`);
}

console.log("\n=== Solidity Event Mapping ===");
console.log(`
Solidity events map to LOG opcodes:

event MyEvent();                          → LOG0 (no indexed params)
event Transfer(address indexed to);       → LOG1 (event sig)
event Approval(                           → LOG3 (event sig + 2 indexed)
  address indexed owner,
  address indexed spender
);
event CustomEvent(                        → LOG4 (event sig + 3 indexed)
  uint indexed id,
  address indexed sender,
  address indexed receiver
);

Topic slots:
- Topic 0: Always event signature hash (keccak256 of event name+types)
- Topics 1-3: Indexed parameters (max 3 indexed params)
- Data: Non-indexed parameters (ABI-encoded)

Example: event Transfer(address indexed from, address indexed to, uint amount)
- Uses LOG3 opcode
- Topic 0: keccak256("Transfer(address,address,uint256)")
- Topic 1: from address
- Topic 2: to address
- Data: amount (ABI-encoded uint256)
`);

console.log("=== LOG Gas Costs ===");
console.log(`
Base costs:
- LOG0-LOG4: 375 gas base
- + 375 gas per topic (0-4 topics)
- + 8 gas per byte of data

Examples:
- LOG0 with 32 bytes data: 375 + (8 * 32) = 631 gas
- LOG1 with 32 bytes data: 375 + 375 + (8 * 32) = 1006 gas
- LOG3 with 64 bytes data: 375 + (3 * 375) + (8 * 64) = 2012 gas
`);

console.log("\n=== LOG Type Checking ===");
const opcodes = [Opcode.LOG0, Opcode.LOG4, Opcode.ADD, Opcode.SSTORE];

console.log("Check which opcodes are LOG opcodes:");
for (const op of opcodes) {
	const name = Opcode.name(op);
	const isLog = Opcode.isLog(op);
	console.log(`${name}: ${isLog}`);
}

console.log("\n=== LOG in Bytecode ===");
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

console.log("Example LOG1 bytecode:");
console.log(Opcode.disassemble(logBytecode));
