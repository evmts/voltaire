/**
 * EVM Opcode enumeration and utilities
 */

export enum Opcode {
	STOP = 0x00,
	ADD = 0x01,
	MUL = 0x02,
	SUB = 0x03,
	DIV = 0x04,
	SDIV = 0x05,
	MOD = 0x06,
	SMOD = 0x07,
	ADDMOD = 0x08,
	MULMOD = 0x09,
	EXP = 0x0a,
	SIGNEXTEND = 0x0b,

	LT = 0x10,
	GT = 0x11,
	SLT = 0x12,
	SGT = 0x13,
	EQ = 0x14,
	ISZERO = 0x15,
	AND = 0x16,
	OR = 0x17,
	XOR = 0x18,
	NOT = 0x19,
	BYTE = 0x1a,
	SHL = 0x1b,
	SHR = 0x1c,
	SAR = 0x1d,

	KECCAK256 = 0x20,

	ADDRESS = 0x30,
	BALANCE = 0x31,
	ORIGIN = 0x32,
	CALLER = 0x33,
	CALLVALUE = 0x34,
	CALLDATALOAD = 0x35,
	CALLDATASIZE = 0x36,
	CALLDATACOPY = 0x37,
	CODESIZE = 0x38,
	CODECOPY = 0x39,
	GASPRICE = 0x3a,
	EXTCODESIZE = 0x3b,
	EXTCODECOPY = 0x3c,
	RETURNDATASIZE = 0x3d,
	RETURNDATACOPY = 0x3e,
	EXTCODEHASH = 0x3f,

	BLOCKHASH = 0x40,
	COINBASE = 0x41,
	TIMESTAMP = 0x42,
	NUMBER = 0x43,
	PREVRANDAO = 0x44, // Previously DIFFICULTY
	GASLIMIT = 0x45,
	CHAINID = 0x46,
	SELFBALANCE = 0x47,
	BASEFEE = 0x48,
	BLOBHASH = 0x49,
	BLOBBASEFEE = 0x4a,

	POP = 0x50,
	MLOAD = 0x51,
	MSTORE = 0x52,
	MSTORE8 = 0x53,
	SLOAD = 0x54,
	SSTORE = 0x55,
	JUMP = 0x56,
	JUMPI = 0x57,
	PC = 0x58,
	MSIZE = 0x59,
	GAS = 0x5a,
	JUMPDEST = 0x5b,
	TLOAD = 0x5c,
	TSTORE = 0x5d,
	MCOPY = 0x5e,

	PUSH0 = 0x5f,
	PUSH1 = 0x60,
	PUSH2 = 0x61,
	PUSH3 = 0x62,
	PUSH4 = 0x63,
	PUSH5 = 0x64,
	PUSH6 = 0x65,
	PUSH7 = 0x66,
	PUSH8 = 0x67,
	PUSH9 = 0x68,
	PUSH10 = 0x69,
	PUSH11 = 0x6a,
	PUSH12 = 0x6b,
	PUSH13 = 0x6c,
	PUSH14 = 0x6d,
	PUSH15 = 0x6e,
	PUSH16 = 0x6f,
	PUSH17 = 0x70,
	PUSH18 = 0x71,
	PUSH19 = 0x72,
	PUSH20 = 0x73,
	PUSH21 = 0x74,
	PUSH22 = 0x75,
	PUSH23 = 0x76,
	PUSH24 = 0x77,
	PUSH25 = 0x78,
	PUSH26 = 0x79,
	PUSH27 = 0x7a,
	PUSH28 = 0x7b,
	PUSH29 = 0x7c,
	PUSH30 = 0x7d,
	PUSH31 = 0x7e,
	PUSH32 = 0x7f,

	DUP1 = 0x80,
	DUP2 = 0x81,
	DUP3 = 0x82,
	DUP4 = 0x83,
	DUP5 = 0x84,
	DUP6 = 0x85,
	DUP7 = 0x86,
	DUP8 = 0x87,
	DUP9 = 0x88,
	DUP10 = 0x89,
	DUP11 = 0x8a,
	DUP12 = 0x8b,
	DUP13 = 0x8c,
	DUP14 = 0x8d,
	DUP15 = 0x8e,
	DUP16 = 0x8f,

	SWAP1 = 0x90,
	SWAP2 = 0x91,
	SWAP3 = 0x92,
	SWAP4 = 0x93,
	SWAP5 = 0x94,
	SWAP6 = 0x95,
	SWAP7 = 0x96,
	SWAP8 = 0x97,
	SWAP9 = 0x98,
	SWAP10 = 0x99,
	SWAP11 = 0x9a,
	SWAP12 = 0x9b,
	SWAP13 = 0x9c,
	SWAP14 = 0x9d,
	SWAP15 = 0x9e,
	SWAP16 = 0x9f,

	LOG0 = 0xa0,
	LOG1 = 0xa1,
	LOG2 = 0xa2,
	LOG3 = 0xa3,
	LOG4 = 0xa4,

	CREATE = 0xf0,
	CALL = 0xf1,
	CALLCODE = 0xf2,
	RETURN = 0xf3,
	DELEGATECALL = 0xf4,
	CREATE2 = 0xf5,

	STATICCALL = 0xfa,

	REVERT = 0xfd,
	INVALID = 0xfe,
	SELFDESTRUCT = 0xff,
}

const OPCODE_NAMES: Record<number, string> = {
	[Opcode.STOP]: "STOP",
	[Opcode.ADD]: "ADD",
	[Opcode.MUL]: "MUL",
	[Opcode.SUB]: "SUB",
	[Opcode.DIV]: "DIV",
	[Opcode.SDIV]: "SDIV",
	[Opcode.MOD]: "MOD",
	[Opcode.SMOD]: "SMOD",
	[Opcode.ADDMOD]: "ADDMOD",
	[Opcode.MULMOD]: "MULMOD",
	[Opcode.EXP]: "EXP",
	[Opcode.SIGNEXTEND]: "SIGNEXTEND",
	[Opcode.LT]: "LT",
	[Opcode.GT]: "GT",
	[Opcode.SLT]: "SLT",
	[Opcode.SGT]: "SGT",
	[Opcode.EQ]: "EQ",
	[Opcode.ISZERO]: "ISZERO",
	[Opcode.AND]: "AND",
	[Opcode.OR]: "OR",
	[Opcode.XOR]: "XOR",
	[Opcode.NOT]: "NOT",
	[Opcode.BYTE]: "BYTE",
	[Opcode.SHL]: "SHL",
	[Opcode.SHR]: "SHR",
	[Opcode.SAR]: "SAR",
	[Opcode.KECCAK256]: "KECCAK256",
	[Opcode.ADDRESS]: "ADDRESS",
	[Opcode.BALANCE]: "BALANCE",
	[Opcode.ORIGIN]: "ORIGIN",
	[Opcode.CALLER]: "CALLER",
	[Opcode.CALLVALUE]: "CALLVALUE",
	[Opcode.CALLDATALOAD]: "CALLDATALOAD",
	[Opcode.CALLDATASIZE]: "CALLDATASIZE",
	[Opcode.CALLDATACOPY]: "CALLDATACOPY",
	[Opcode.CODESIZE]: "CODESIZE",
	[Opcode.CODECOPY]: "CODECOPY",
	[Opcode.GASPRICE]: "GASPRICE",
	[Opcode.EXTCODESIZE]: "EXTCODESIZE",
	[Opcode.EXTCODECOPY]: "EXTCODECOPY",
	[Opcode.RETURNDATASIZE]: "RETURNDATASIZE",
	[Opcode.RETURNDATACOPY]: "RETURNDATACOPY",
	[Opcode.EXTCODEHASH]: "EXTCODEHASH",
	[Opcode.BLOCKHASH]: "BLOCKHASH",
	[Opcode.COINBASE]: "COINBASE",
	[Opcode.TIMESTAMP]: "TIMESTAMP",
	[Opcode.NUMBER]: "NUMBER",
	[Opcode.PREVRANDAO]: "PREVRANDAO",
	[Opcode.GASLIMIT]: "GASLIMIT",
	[Opcode.CHAINID]: "CHAINID",
	[Opcode.SELFBALANCE]: "SELFBALANCE",
	[Opcode.BASEFEE]: "BASEFEE",
	[Opcode.BLOBHASH]: "BLOBHASH",
	[Opcode.BLOBBASEFEE]: "BLOBBASEFEE",
	[Opcode.POP]: "POP",
	[Opcode.MLOAD]: "MLOAD",
	[Opcode.MSTORE]: "MSTORE",
	[Opcode.MSTORE8]: "MSTORE8",
	[Opcode.SLOAD]: "SLOAD",
	[Opcode.SSTORE]: "SSTORE",
	[Opcode.JUMP]: "JUMP",
	[Opcode.JUMPI]: "JUMPI",
	[Opcode.PC]: "PC",
	[Opcode.MSIZE]: "MSIZE",
	[Opcode.GAS]: "GAS",
	[Opcode.JUMPDEST]: "JUMPDEST",
	[Opcode.TLOAD]: "TLOAD",
	[Opcode.TSTORE]: "TSTORE",
	[Opcode.MCOPY]: "MCOPY",
	[Opcode.PUSH0]: "PUSH0",
	[Opcode.PUSH1]: "PUSH1",
	[Opcode.PUSH2]: "PUSH2",
	[Opcode.PUSH3]: "PUSH3",
	[Opcode.PUSH4]: "PUSH4",
	[Opcode.PUSH5]: "PUSH5",
	[Opcode.PUSH6]: "PUSH6",
	[Opcode.PUSH7]: "PUSH7",
	[Opcode.PUSH8]: "PUSH8",
	[Opcode.PUSH9]: "PUSH9",
	[Opcode.PUSH10]: "PUSH10",
	[Opcode.PUSH11]: "PUSH11",
	[Opcode.PUSH12]: "PUSH12",
	[Opcode.PUSH13]: "PUSH13",
	[Opcode.PUSH14]: "PUSH14",
	[Opcode.PUSH15]: "PUSH15",
	[Opcode.PUSH16]: "PUSH16",
	[Opcode.PUSH17]: "PUSH17",
	[Opcode.PUSH18]: "PUSH18",
	[Opcode.PUSH19]: "PUSH19",
	[Opcode.PUSH20]: "PUSH20",
	[Opcode.PUSH21]: "PUSH21",
	[Opcode.PUSH22]: "PUSH22",
	[Opcode.PUSH23]: "PUSH23",
	[Opcode.PUSH24]: "PUSH24",
	[Opcode.PUSH25]: "PUSH25",
	[Opcode.PUSH26]: "PUSH26",
	[Opcode.PUSH27]: "PUSH27",
	[Opcode.PUSH28]: "PUSH28",
	[Opcode.PUSH29]: "PUSH29",
	[Opcode.PUSH30]: "PUSH30",
	[Opcode.PUSH31]: "PUSH31",
	[Opcode.PUSH32]: "PUSH32",
	[Opcode.DUP1]: "DUP1",
	[Opcode.DUP2]: "DUP2",
	[Opcode.DUP3]: "DUP3",
	[Opcode.DUP4]: "DUP4",
	[Opcode.DUP5]: "DUP5",
	[Opcode.DUP6]: "DUP6",
	[Opcode.DUP7]: "DUP7",
	[Opcode.DUP8]: "DUP8",
	[Opcode.DUP9]: "DUP9",
	[Opcode.DUP10]: "DUP10",
	[Opcode.DUP11]: "DUP11",
	[Opcode.DUP12]: "DUP12",
	[Opcode.DUP13]: "DUP13",
	[Opcode.DUP14]: "DUP14",
	[Opcode.DUP15]: "DUP15",
	[Opcode.DUP16]: "DUP16",
	[Opcode.SWAP1]: "SWAP1",
	[Opcode.SWAP2]: "SWAP2",
	[Opcode.SWAP3]: "SWAP3",
	[Opcode.SWAP4]: "SWAP4",
	[Opcode.SWAP5]: "SWAP5",
	[Opcode.SWAP6]: "SWAP6",
	[Opcode.SWAP7]: "SWAP7",
	[Opcode.SWAP8]: "SWAP8",
	[Opcode.SWAP9]: "SWAP9",
	[Opcode.SWAP10]: "SWAP10",
	[Opcode.SWAP11]: "SWAP11",
	[Opcode.SWAP12]: "SWAP12",
	[Opcode.SWAP13]: "SWAP13",
	[Opcode.SWAP14]: "SWAP14",
	[Opcode.SWAP15]: "SWAP15",
	[Opcode.SWAP16]: "SWAP16",
	[Opcode.LOG0]: "LOG0",
	[Opcode.LOG1]: "LOG1",
	[Opcode.LOG2]: "LOG2",
	[Opcode.LOG3]: "LOG3",
	[Opcode.LOG4]: "LOG4",
	[Opcode.CREATE]: "CREATE",
	[Opcode.CALL]: "CALL",
	[Opcode.CALLCODE]: "CALLCODE",
	[Opcode.RETURN]: "RETURN",
	[Opcode.DELEGATECALL]: "DELEGATECALL",
	[Opcode.CREATE2]: "CREATE2",
	[Opcode.STATICCALL]: "STATICCALL",
	[Opcode.REVERT]: "REVERT",
	[Opcode.INVALID]: "INVALID",
	[Opcode.SELFDESTRUCT]: "SELFDESTRUCT",
};

/**
 * Get the name of an opcode
 */
export function name(opcode: Opcode): string {
	return OPCODE_NAMES[opcode] || "UNKNOWN";
}

/**
 * Check if a byte value is a valid opcode
 */
export function isValid(byte: number): boolean {
	return byte in OPCODE_NAMES;
}

/**
 * Check if opcode is at a bytecode boundary (for JUMPDEST analysis)
 */
export function isBytecodeBoundary(opcode: Opcode): boolean {
	return opcode === Opcode.JUMPDEST;
}

/**
 * Get gas cost for an opcode (base cost only, no dynamic costs)
 */
export function getGasCost(opcode: Opcode): number {
	// Simplified gas costs - actual costs depend on context
	if (opcode === Opcode.STOP) return 0;
	if (opcode >= Opcode.PUSH1 && opcode <= Opcode.PUSH32) return 3;
	if (opcode >= Opcode.DUP1 && opcode <= Opcode.DUP16) return 3;
	if (opcode >= Opcode.SWAP1 && opcode <= Opcode.SWAP16) return 3;
	if (opcode === Opcode.SSTORE) return 20000;
	if (opcode === Opcode.SLOAD) return 800;
	if (opcode === Opcode.CALL) return 700;
	if (opcode === Opcode.CREATE) return 32000;
	if (opcode === Opcode.CREATE2) return 32000;
	if (opcode === Opcode.SELFDESTRUCT) return 5000;
	if (opcode >= Opcode.LOG0 && opcode <= Opcode.LOG4) return 375;
	if (opcode === Opcode.KECCAK256) return 30;
	if (opcode === Opcode.EXP) return 10;
	return 3; // Default gas cost
}

/**
 * Check if opcode is a PUSH instruction
 */
export function isPush(opcode: Opcode): boolean {
	return opcode >= Opcode.PUSH0 && opcode <= Opcode.PUSH32;
}

/**
 * Get the number of bytes pushed by a PUSH instruction
 */
export function pushSize(opcode: Opcode): number {
	if (opcode === Opcode.PUSH0) return 0;
	if (opcode >= Opcode.PUSH1 && opcode <= Opcode.PUSH32) {
		return opcode - Opcode.PUSH1 + 1;
	}
	return 0;
}

/**
 * Check if opcode is a DUP instruction
 */
export function isDup(opcode: Opcode): boolean {
	return opcode >= Opcode.DUP1 && opcode <= Opcode.DUP16;
}

/**
 * Check if opcode is a SWAP instruction
 */
export function isSwap(opcode: Opcode): boolean {
	return opcode >= Opcode.SWAP1 && opcode <= Opcode.SWAP16;
}

/**
 * Check if opcode is a LOG instruction
 */
export function isLog(opcode: Opcode): boolean {
	return opcode >= Opcode.LOG0 && opcode <= Opcode.LOG4;
}

/**
 * Check if opcode terminates execution
 */
export function isTerminating(opcode: Opcode): boolean {
	return (
		opcode === Opcode.STOP ||
		opcode === Opcode.RETURN ||
		opcode === Opcode.REVERT ||
		opcode === Opcode.INVALID ||
		opcode === Opcode.SELFDESTRUCT
	);
}

/**
 * Check if opcode modifies state
 */
export function isStateModifying(opcode: Opcode): boolean {
	return (
		opcode === Opcode.SSTORE ||
		opcode === Opcode.TSTORE ||
		opcode === Opcode.CREATE ||
		opcode === Opcode.CREATE2 ||
		opcode === Opcode.CALL ||
		opcode === Opcode.SELFDESTRUCT ||
		isLog(opcode)
	);
}
