import { Opcode } from "voltaire";
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
}
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
}
const midOps = [
	Opcode.ADDMOD,
	Opcode.MULMOD,
	Opcode.SHL,
	Opcode.SHR,
	Opcode.SAR,
];

for (const op of midOps) {
	const info = Opcode.info(op);
}

// Crypto
const keccak256Info = Opcode.info(Opcode.KECCAK256);

// EXP (dynamic based on exponent size)
const expInfo = Opcode.info(Opcode.EXP);

// Calls (base cost - actual cost is much higher)
const callInfo = Opcode.info(Opcode.CALL);

const delegatecallInfo = Opcode.info(Opcode.DELEGATECALL);

const staticcallInfo = Opcode.info(Opcode.STATICCALL);

// Contract creation
const createInfo = Opcode.info(Opcode.CREATE);

const create2Info = Opcode.info(Opcode.CREATE2);

// Balance
const balanceInfo = Opcode.info(Opcode.BALANCE);
const log0Info = Opcode.info(Opcode.LOG0);
const log4Info = Opcode.info(Opcode.LOG4);
