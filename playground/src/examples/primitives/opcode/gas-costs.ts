import * as Opcode from "../../../primitives/Opcode/index.js";

// Example: Gas costs for common opcodes

console.log("=== Very Low Gas Cost (3 gas) ===");
const veryLowOps = [
	Opcode.ADD,
	Opcode.SUB,
	Opcode.NOT,
	Opcode.LT,
	Opcode.GT,
	Opcode.SLT,
	Opcode.SGT,
	Opcode.EQ,
	Opcode.ISZERO,
	Opcode.AND,
	Opcode.OR,
	Opcode.XOR,
	Opcode.BYTE,
	Opcode.CALLDATALOAD,
	Opcode.MLOAD,
	Opcode.MSTORE,
	Opcode.MSTORE8,
	Opcode.PUSH0,
];

for (const op of veryLowOps.slice(0, 5)) {
	const info = Opcode.info(op);
	console.log(`${info?.name}: ${info?.gasCost} gas`);
}

console.log("\n=== Low Gas Cost (5 gas) ===");
const lowOps = [
	Opcode.MUL,
	Opcode.DIV,
	Opcode.SDIV,
	Opcode.MOD,
	Opcode.SMOD,
	Opcode.SIGNEXTEND,
];

for (const op of lowOps) {
	const info = Opcode.info(op);
	console.log(`${info?.name}: ${info?.gasCost} gas`);
}

console.log("\n=== Mid Gas Cost (8 gas) ===");
const midOps = [
	Opcode.ADDMOD,
	Opcode.MULMOD,
	Opcode.SHL,
	Opcode.SHR,
	Opcode.SAR,
];

for (const op of midOps) {
	const info = Opcode.info(op);
	console.log(`${info?.name}: ${info?.gasCost} gas`);
}

console.log("\n=== Base Gas Costs (static portion) ===");

// JUMP operations
console.log("\nJumps:");
console.log(`JUMP: ${Opcode.getGasCost(Opcode.JUMP)} gas`);
console.log(`JUMPI: ${Opcode.getGasCost(Opcode.JUMPI)} gas`);
console.log(`JUMPDEST: ${Opcode.getGasCost(Opcode.JUMPDEST)} gas`);

// Memory operations
console.log("\nMemory:");
console.log(`MLOAD: ${Opcode.getGasCost(Opcode.MLOAD)} gas`);
console.log(`MSTORE: ${Opcode.getGasCost(Opcode.MSTORE)} gas`);
console.log(`MSTORE8: ${Opcode.getGasCost(Opcode.MSTORE8)} gas`);
console.log(`MSIZE: ${Opcode.getGasCost(Opcode.MSIZE)} gas`);

// Storage operations (base cost - actual cost varies)
console.log("\nStorage (base cost only):");
console.log(
	`SLOAD: ${Opcode.getGasCost(Opcode.SLOAD)} gas (warm: 100, cold: 2100)`,
);
console.log(
	`SSTORE: ${Opcode.getGasCost(Opcode.SSTORE)} gas (varies: 100-20000)`,
);
console.log(`TLOAD: ${Opcode.getGasCost(Opcode.TLOAD)} gas`);
console.log(`TSTORE: ${Opcode.getGasCost(Opcode.TSTORE)} gas`);

// Stack operations
console.log("\nStack:");
console.log(`POP: ${Opcode.getGasCost(Opcode.POP)} gas`);
console.log(`DUP1: ${Opcode.getGasCost(Opcode.DUP1)} gas`);
console.log(`SWAP1: ${Opcode.getGasCost(Opcode.SWAP1)} gas`);
console.log(`PUSH1: ${Opcode.getGasCost(Opcode.PUSH1)} gas`);

console.log("\n=== High Gas Cost Operations ===");

// Crypto
const keccak256Info = Opcode.info(Opcode.KECCAK256);
console.log(`KECCAK256: ${keccak256Info?.gasCost} gas (+ 6 per word)`);

// EXP (dynamic based on exponent size)
const expInfo = Opcode.info(Opcode.EXP);
console.log(`EXP: ${expInfo?.gasCost} gas (+ 50 per byte of exponent)`);

// Calls (base cost - actual cost is much higher)
const callInfo = Opcode.info(Opcode.CALL);
console.log(
	`CALL: ${callInfo?.gasCost} gas (base - can be 9000+ with value/cold)`,
);

const delegatecallInfo = Opcode.info(Opcode.DELEGATECALL);
console.log(
	`DELEGATECALL: ${delegatecallInfo?.gasCost} gas (base - can be 2600+ cold)`,
);

const staticcallInfo = Opcode.info(Opcode.STATICCALL);
console.log(
	`STATICCALL: ${staticcallInfo?.gasCost} gas (base - can be 2600+ cold)`,
);

// Contract creation
const createInfo = Opcode.info(Opcode.CREATE);
console.log(
	`CREATE: ${createInfo?.gasCost} gas (base - actual cost much higher)`,
);

const create2Info = Opcode.info(Opcode.CREATE2);
console.log(
	`CREATE2: ${create2Info?.gasCost} gas (base - actual cost much higher)`,
);

// Balance
const balanceInfo = Opcode.info(Opcode.BALANCE);
console.log(`BALANCE: ${balanceInfo?.gasCost} gas (warm: 100, cold: 2600)`);

// Logs
console.log("\nLogs:");
const log0Info = Opcode.info(Opcode.LOG0);
const log4Info = Opcode.info(Opcode.LOG4);
console.log(`LOG0: ${log0Info?.gasCost} gas (+ 8 per byte)`);
console.log(
	`LOG1: ${Opcode.getGasCost(Opcode.LOG1)} gas (+ 8 per byte + 375 per topic)`,
);
console.log(`LOG4: ${log4Info?.gasCost} gas (+ 8 per byte + 375 per topic)`);

console.log("\n=== Zero Gas Cost ===");
console.log(`STOP: ${Opcode.getGasCost(Opcode.STOP)} gas`);

console.log("\n=== Dynamic Gas Costs ===");
console.log(`
Note: Many opcodes have dynamic gas costs that depend on:

SLOAD/SSTORE:
- Warm vs cold storage access
- Storage state changes (zero → non-zero, etc)
- EIP-2929 access lists

CALL variants:
- Warm vs cold account access
- Value transfer
- Account creation
- Memory expansion

CREATE/CREATE2:
- Init code size
- Memory expansion
- Execution of init code

KECCAK256:
- Input size (6 gas per word)

EXP:
- Exponent size (50 gas per byte)

Memory operations:
- Memory expansion costs
`);
