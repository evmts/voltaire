/**
 * EVM opcodes enumeration with comprehensive utilities
 *
 * Provides complete EVM opcode definitions, metadata, and helper functions
 * for bytecode analysis and execution.
 */

/**
 * EVM opcode enumeration
 */
export enum Opcode {
	// 0x00s: Stop and Arithmetic Operations
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

	// 0x10s: Comparison & Bitwise Logic Operations
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

	// 0x20s: Crypto
	KECCAK256 = 0x20,

	// 0x30s: Environmental Information
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

	// 0x40s: Block Information
	BLOCKHASH = 0x40,
	COINBASE = 0x41,
	TIMESTAMP = 0x42,
	NUMBER = 0x43,
	DIFFICULTY = 0x44,
	GASLIMIT = 0x45,
	CHAINID = 0x46,
	SELFBALANCE = 0x47,
	BASEFEE = 0x48,
	BLOBHASH = 0x49,
	BLOBBASEFEE = 0x4a,

	// 0x50s: Stack, Memory, Storage and Flow Operations
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

	// 0x60-0x7f: PUSH1-PUSH32
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

	// 0x80s: DUP1-DUP16
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

	// 0x90s: SWAP1-SWAP16
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

	// 0xa0s: LOG0-LOG4
	LOG0 = 0xa0,
	LOG1 = 0xa1,
	LOG2 = 0xa2,
	LOG3 = 0xa3,
	LOG4 = 0xa4,

	// 0xf0s: System Operations
	CREATE = 0xf0,
	CALL = 0xf1,
	CALLCODE = 0xf2,
	RETURN = 0xf3,
	DELEGATECALL = 0xf4,
	CREATE2 = 0xf5,
	AUTH = 0xf6, // EIP-3074
	AUTHCALL = 0xf7, // EIP-3074
	STATICCALL = 0xfa,
	REVERT = 0xfd,
	INVALID = 0xfe,
	SELFDESTRUCT = 0xff,
}

/**
 * Opcode metadata structure
 *
 * Contains gas cost, stack input/output requirements for each opcode.
 * Note: Some opcodes have dynamic costs calculated at runtime.
 */
export interface OpcodeInfo {
	/** Base gas cost (may be dynamic) */
	gasCost: number;
	/** Number of stack items consumed */
	stackInputs: number;
	/** Number of stack items produced */
	stackOutputs: number;
	/** Opcode name */
	name: string;
}

/**
 * Gas constants for EVM operations
 */
const GAS_FASTEST_STEP = 3;
const GAS_FAST_STEP = 5;
const GAS_MID_STEP = 8;
const GAS_QUICK_STEP = 2;
const LOG_GAS = 375;
const LOG_TOPIC_GAS = 375;

/**
 * Create opcode info lookup table
 */
function createOpcodeInfoTable(): Map<Opcode, OpcodeInfo> {
	const table = new Map<Opcode, OpcodeInfo>();

	// Helper to add opcode info
	const add = (op: Opcode, gasCost: number, stackInputs: number, stackOutputs: number, name: string) => {
		table.set(op, { gasCost, stackInputs, stackOutputs, name });
	};

	// 0x00s: Stop and Arithmetic Operations
	add(Opcode.STOP, 0, 0, 0, "STOP");
	add(Opcode.ADD, GAS_FASTEST_STEP, 2, 1, "ADD");
	add(Opcode.MUL, GAS_FAST_STEP, 2, 1, "MUL");
	add(Opcode.SUB, GAS_FASTEST_STEP, 2, 1, "SUB");
	add(Opcode.DIV, GAS_FAST_STEP, 2, 1, "DIV");
	add(Opcode.SDIV, GAS_FAST_STEP, 2, 1, "SDIV");
	add(Opcode.MOD, GAS_FAST_STEP, 2, 1, "MOD");
	add(Opcode.SMOD, GAS_FAST_STEP, 2, 1, "SMOD");
	add(Opcode.ADDMOD, GAS_MID_STEP, 3, 1, "ADDMOD");
	add(Opcode.MULMOD, GAS_MID_STEP, 3, 1, "MULMOD");
	add(Opcode.EXP, 10, 2, 1, "EXP");
	add(Opcode.SIGNEXTEND, GAS_FAST_STEP, 2, 1, "SIGNEXTEND");

	// 0x10s: Comparison & Bitwise Logic Operations
	add(Opcode.LT, GAS_FASTEST_STEP, 2, 1, "LT");
	add(Opcode.GT, GAS_FASTEST_STEP, 2, 1, "GT");
	add(Opcode.SLT, GAS_FASTEST_STEP, 2, 1, "SLT");
	add(Opcode.SGT, GAS_FASTEST_STEP, 2, 1, "SGT");
	add(Opcode.EQ, GAS_FASTEST_STEP, 2, 1, "EQ");
	add(Opcode.ISZERO, GAS_FASTEST_STEP, 1, 1, "ISZERO");
	add(Opcode.AND, GAS_FASTEST_STEP, 2, 1, "AND");
	add(Opcode.OR, GAS_FASTEST_STEP, 2, 1, "OR");
	add(Opcode.XOR, GAS_FASTEST_STEP, 2, 1, "XOR");
	add(Opcode.NOT, GAS_FASTEST_STEP, 1, 1, "NOT");
	add(Opcode.BYTE, GAS_FASTEST_STEP, 2, 1, "BYTE");
	add(Opcode.SHL, GAS_FASTEST_STEP, 2, 1, "SHL");
	add(Opcode.SHR, GAS_FASTEST_STEP, 2, 1, "SHR");
	add(Opcode.SAR, GAS_FASTEST_STEP, 2, 1, "SAR");

	// 0x20s: Crypto
	add(Opcode.KECCAK256, 30, 2, 1, "KECCAK256");

	// 0x30s: Environmental Information
	add(Opcode.ADDRESS, GAS_QUICK_STEP, 0, 1, "ADDRESS");
	add(Opcode.BALANCE, 100, 1, 1, "BALANCE");
	add(Opcode.ORIGIN, GAS_QUICK_STEP, 0, 1, "ORIGIN");
	add(Opcode.CALLER, GAS_QUICK_STEP, 0, 1, "CALLER");
	add(Opcode.CALLVALUE, GAS_QUICK_STEP, 0, 1, "CALLVALUE");
	add(Opcode.CALLDATALOAD, GAS_FASTEST_STEP, 1, 1, "CALLDATALOAD");
	add(Opcode.CALLDATASIZE, GAS_QUICK_STEP, 0, 1, "CALLDATASIZE");
	add(Opcode.CALLDATACOPY, GAS_FASTEST_STEP, 3, 0, "CALLDATACOPY");
	add(Opcode.CODESIZE, GAS_QUICK_STEP, 0, 1, "CODESIZE");
	add(Opcode.CODECOPY, GAS_FASTEST_STEP, 3, 0, "CODECOPY");
	add(Opcode.GASPRICE, GAS_QUICK_STEP, 0, 1, "GASPRICE");
	add(Opcode.EXTCODESIZE, 100, 1, 1, "EXTCODESIZE");
	add(Opcode.EXTCODECOPY, 100, 4, 0, "EXTCODECOPY");
	add(Opcode.RETURNDATASIZE, GAS_QUICK_STEP, 0, 1, "RETURNDATASIZE");
	add(Opcode.RETURNDATACOPY, GAS_FASTEST_STEP, 3, 0, "RETURNDATACOPY");
	add(Opcode.EXTCODEHASH, 100, 1, 1, "EXTCODEHASH");

	// 0x40s: Block Information
	add(Opcode.BLOCKHASH, 20, 1, 1, "BLOCKHASH");
	add(Opcode.COINBASE, GAS_QUICK_STEP, 0, 1, "COINBASE");
	add(Opcode.TIMESTAMP, GAS_QUICK_STEP, 0, 1, "TIMESTAMP");
	add(Opcode.NUMBER, GAS_QUICK_STEP, 0, 1, "NUMBER");
	add(Opcode.DIFFICULTY, GAS_QUICK_STEP, 0, 1, "DIFFICULTY");
	add(Opcode.GASLIMIT, GAS_QUICK_STEP, 0, 1, "GASLIMIT");
	add(Opcode.CHAINID, GAS_QUICK_STEP, 0, 1, "CHAINID");
	add(Opcode.SELFBALANCE, GAS_FAST_STEP, 0, 1, "SELFBALANCE");
	add(Opcode.BASEFEE, GAS_QUICK_STEP, 0, 1, "BASEFEE");
	add(Opcode.BLOBHASH, GAS_FASTEST_STEP, 1, 1, "BLOBHASH");
	add(Opcode.BLOBBASEFEE, GAS_QUICK_STEP, 0, 1, "BLOBBASEFEE");

	// 0x50s: Stack, Memory, Storage and Flow Operations
	add(Opcode.POP, GAS_QUICK_STEP, 1, 0, "POP");
	add(Opcode.MLOAD, GAS_FASTEST_STEP, 1, 1, "MLOAD");
	add(Opcode.MSTORE, GAS_FASTEST_STEP, 2, 0, "MSTORE");
	add(Opcode.MSTORE8, GAS_FASTEST_STEP, 2, 0, "MSTORE8");
	add(Opcode.SLOAD, 100, 1, 1, "SLOAD");
	add(Opcode.SSTORE, 100, 2, 0, "SSTORE");
	add(Opcode.JUMP, GAS_MID_STEP, 1, 0, "JUMP");
	add(Opcode.JUMPI, 10, 2, 0, "JUMPI");
	add(Opcode.PC, GAS_QUICK_STEP, 0, 1, "PC");
	add(Opcode.MSIZE, GAS_QUICK_STEP, 0, 1, "MSIZE");
	add(Opcode.GAS, GAS_QUICK_STEP, 0, 1, "GAS");
	add(Opcode.JUMPDEST, 1, 0, 0, "JUMPDEST");
	add(Opcode.TLOAD, 100, 1, 1, "TLOAD");
	add(Opcode.TSTORE, 100, 2, 0, "TSTORE");
	add(Opcode.MCOPY, GAS_FASTEST_STEP, 3, 0, "MCOPY");
	add(Opcode.PUSH0, GAS_QUICK_STEP, 0, 1, "PUSH0");

	// 0x60-0x7f: PUSH1-PUSH32
	for (let i = 0; i < 32; i++) {
		add((0x60 + i) as Opcode, GAS_FASTEST_STEP, 0, 1, `PUSH${i + 1}`);
	}

	// 0x80-0x8f: DUP1-DUP16
	for (let i = 0; i < 16; i++) {
		add((0x80 + i) as Opcode, GAS_FASTEST_STEP, 0, 1, `DUP${i + 1}`);
	}

	// 0x90-0x9f: SWAP1-SWAP16
	for (let i = 0; i < 16; i++) {
		add((0x90 + i) as Opcode, GAS_FASTEST_STEP, 0, 0, `SWAP${i + 1}`);
	}

	// 0xa0-0xa4: LOG0-LOG4
	for (let i = 0; i <= 4; i++) {
		add((0xa0 + i) as Opcode, LOG_GAS + i * LOG_TOPIC_GAS, 2 + i, 0, `LOG${i}`);
	}

	// 0xf0s: System Operations
	add(Opcode.CREATE, 32000, 3, 1, "CREATE");
	add(Opcode.CALL, 100, 7, 1, "CALL");
	add(Opcode.CALLCODE, 100, 7, 1, "CALLCODE");
	add(Opcode.RETURN, 0, 2, 0, "RETURN");
	add(Opcode.DELEGATECALL, 100, 6, 1, "DELEGATECALL");
	add(Opcode.CREATE2, 32000, 4, 1, "CREATE2");
	add(Opcode.AUTH, 3100, 3, 1, "AUTH");
	add(Opcode.AUTHCALL, 100, 8, 1, "AUTHCALL");
	add(Opcode.STATICCALL, 100, 6, 1, "STATICCALL");
	add(Opcode.REVERT, 0, 2, 0, "REVERT");
	add(Opcode.INVALID, 0, 0, 0, "INVALID");
	add(Opcode.SELFDESTRUCT, 5000, 1, 0, "SELFDESTRUCT");

	return table;
}

/**
 * Opcode information lookup table
 */
const OPCODE_INFO_TABLE = createOpcodeInfoTable();

/**
 * Get metadata for an opcode
 *
 * @param op Opcode to query
 * @returns OpcodeInfo with gas cost and stack requirements
 */
export function info(op: Opcode): OpcodeInfo | undefined {
	return OPCODE_INFO_TABLE.get(op);
}

/**
 * Opcode namespace with helper methods
 */
export const OpcodeHelper = {
	/**
	 * Get opcode metadata
	 */
	info,
};
