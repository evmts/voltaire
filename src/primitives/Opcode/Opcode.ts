/**
 * EVM Opcode Types and Utilities
 *
 * Complete EVM opcode definitions with metadata and helper functions
 * for bytecode analysis. Import as namespace with `import * as Opcode`.
 *
 * @example
 * ```typescript
 * import * as Opcode from './opcode.js';
 *
 * // Types
 * const op: Opcode.Code = Opcode.Code.ADD;
 * const info = getInfo(op);
 *
 * // Operations
 * const name = getName(op);
 * const isPush = isPush(op);
 * const pushBytes = getPushBytes(op);
 * ```
 */

// ============================================================================
// Core Types
// ============================================================================

/**
 * EVM opcode byte values
 */
export enum Code {
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
 */
export type Info = {
	/** Base gas cost (may be dynamic at runtime) */
	gasCost: number;
	/** Number of stack items consumed */
	stackInputs: number;
	/** Number of stack items produced */
	stackOutputs: number;
	/** Opcode name */
	name: string;
};

/**
 * Bytecode instruction with opcode and optional immediate data
 */
export type Instruction = {
	/** Program counter offset */
	offset: number;
	/** The opcode */
	opcode: Code;
	/** Immediate data for PUSH operations */
	immediate?: Uint8Array;
};

// ============================================================================
// Constants
// ============================================================================

const GAS_FASTEST_STEP = 3;
const GAS_FAST_STEP = 5;
const GAS_MID_STEP = 8;
const GAS_QUICK_STEP = 2;
const LOG_GAS = 375;
const LOG_TOPIC_GAS = 375;

// ============================================================================
// Opcode Info Table
// ============================================================================

function createInfoTable(): Map<Code, Info> {
	const table = new Map<Code, Info>();

	const add = (
		op: Code,
		gasCost: number,
		stackInputs: number,
		stackOutputs: number,
		name: string,
	) => {
		table.set(op, { gasCost, stackInputs, stackOutputs, name });
	};

	// 0x00s: Stop and Arithmetic Operations
	add(Code.STOP, 0, 0, 0, "STOP");
	add(Code.ADD, GAS_FASTEST_STEP, 2, 1, "ADD");
	add(Code.MUL, GAS_FAST_STEP, 2, 1, "MUL");
	add(Code.SUB, GAS_FASTEST_STEP, 2, 1, "SUB");
	add(Code.DIV, GAS_FAST_STEP, 2, 1, "DIV");
	add(Code.SDIV, GAS_FAST_STEP, 2, 1, "SDIV");
	add(Code.MOD, GAS_FAST_STEP, 2, 1, "MOD");
	add(Code.SMOD, GAS_FAST_STEP, 2, 1, "SMOD");
	add(Code.ADDMOD, GAS_MID_STEP, 3, 1, "ADDMOD");
	add(Code.MULMOD, GAS_MID_STEP, 3, 1, "MULMOD");
	add(Code.EXP, 10, 2, 1, "EXP");
	add(Code.SIGNEXTEND, GAS_FAST_STEP, 2, 1, "SIGNEXTEND");

	// 0x10s: Comparison & Bitwise Logic Operations
	add(Code.LT, GAS_FASTEST_STEP, 2, 1, "LT");
	add(Code.GT, GAS_FASTEST_STEP, 2, 1, "GT");
	add(Code.SLT, GAS_FASTEST_STEP, 2, 1, "SLT");
	add(Code.SGT, GAS_FASTEST_STEP, 2, 1, "SGT");
	add(Code.EQ, GAS_FASTEST_STEP, 2, 1, "EQ");
	add(Code.ISZERO, GAS_FASTEST_STEP, 1, 1, "ISZERO");
	add(Code.AND, GAS_FASTEST_STEP, 2, 1, "AND");
	add(Code.OR, GAS_FASTEST_STEP, 2, 1, "OR");
	add(Code.XOR, GAS_FASTEST_STEP, 2, 1, "XOR");
	add(Code.NOT, GAS_FASTEST_STEP, 1, 1, "NOT");
	add(Code.BYTE, GAS_FASTEST_STEP, 2, 1, "BYTE");
	add(Code.SHL, GAS_FASTEST_STEP, 2, 1, "SHL");
	add(Code.SHR, GAS_FASTEST_STEP, 2, 1, "SHR");
	add(Code.SAR, GAS_FASTEST_STEP, 2, 1, "SAR");

	// 0x20s: Crypto
	add(Code.KECCAK256, 30, 2, 1, "KECCAK256");

	// 0x30s: Environmental Information
	add(Code.ADDRESS, GAS_QUICK_STEP, 0, 1, "ADDRESS");
	add(Code.BALANCE, 100, 1, 1, "BALANCE");
	add(Code.ORIGIN, GAS_QUICK_STEP, 0, 1, "ORIGIN");
	add(Code.CALLER, GAS_QUICK_STEP, 0, 1, "CALLER");
	add(Code.CALLVALUE, GAS_QUICK_STEP, 0, 1, "CALLVALUE");
	add(Code.CALLDATALOAD, GAS_FASTEST_STEP, 1, 1, "CALLDATALOAD");
	add(Code.CALLDATASIZE, GAS_QUICK_STEP, 0, 1, "CALLDATASIZE");
	add(Code.CALLDATACOPY, GAS_FASTEST_STEP, 3, 0, "CALLDATACOPY");
	add(Code.CODESIZE, GAS_QUICK_STEP, 0, 1, "CODESIZE");
	add(Code.CODECOPY, GAS_FASTEST_STEP, 3, 0, "CODECOPY");
	add(Code.GASPRICE, GAS_QUICK_STEP, 0, 1, "GASPRICE");
	add(Code.EXTCODESIZE, 100, 1, 1, "EXTCODESIZE");
	add(Code.EXTCODECOPY, 100, 4, 0, "EXTCODECOPY");
	add(Code.RETURNDATASIZE, GAS_QUICK_STEP, 0, 1, "RETURNDATASIZE");
	add(Code.RETURNDATACOPY, GAS_FASTEST_STEP, 3, 0, "RETURNDATACOPY");
	add(Code.EXTCODEHASH, 100, 1, 1, "EXTCODEHASH");

	// 0x40s: Block Information
	add(Code.BLOCKHASH, 20, 1, 1, "BLOCKHASH");
	add(Code.COINBASE, GAS_QUICK_STEP, 0, 1, "COINBASE");
	add(Code.TIMESTAMP, GAS_QUICK_STEP, 0, 1, "TIMESTAMP");
	add(Code.NUMBER, GAS_QUICK_STEP, 0, 1, "NUMBER");
	add(Code.DIFFICULTY, GAS_QUICK_STEP, 0, 1, "DIFFICULTY");
	add(Code.GASLIMIT, GAS_QUICK_STEP, 0, 1, "GASLIMIT");
	add(Code.CHAINID, GAS_QUICK_STEP, 0, 1, "CHAINID");
	add(Code.SELFBALANCE, GAS_FAST_STEP, 0, 1, "SELFBALANCE");
	add(Code.BASEFEE, GAS_QUICK_STEP, 0, 1, "BASEFEE");
	add(Code.BLOBHASH, GAS_FASTEST_STEP, 1, 1, "BLOBHASH");
	add(Code.BLOBBASEFEE, GAS_QUICK_STEP, 0, 1, "BLOBBASEFEE");

	// 0x50s: Stack, Memory, Storage and Flow Operations
	add(Code.POP, GAS_QUICK_STEP, 1, 0, "POP");
	add(Code.MLOAD, GAS_FASTEST_STEP, 1, 1, "MLOAD");
	add(Code.MSTORE, GAS_FASTEST_STEP, 2, 0, "MSTORE");
	add(Code.MSTORE8, GAS_FASTEST_STEP, 2, 0, "MSTORE8");
	add(Code.SLOAD, 100, 1, 1, "SLOAD");
	add(Code.SSTORE, 100, 2, 0, "SSTORE");
	add(Code.JUMP, GAS_MID_STEP, 1, 0, "JUMP");
	add(Code.JUMPI, 10, 2, 0, "JUMPI");
	add(Code.PC, GAS_QUICK_STEP, 0, 1, "PC");
	add(Code.MSIZE, GAS_QUICK_STEP, 0, 1, "MSIZE");
	add(Code.GAS, GAS_QUICK_STEP, 0, 1, "GAS");
	add(Code.JUMPDEST, 1, 0, 0, "JUMPDEST");
	add(Code.TLOAD, 100, 1, 1, "TLOAD");
	add(Code.TSTORE, 100, 2, 0, "TSTORE");
	add(Code.MCOPY, GAS_FASTEST_STEP, 3, 0, "MCOPY");
	add(Code.PUSH0, GAS_QUICK_STEP, 0, 1, "PUSH0");

	// 0x60-0x7f: PUSH1-PUSH32
	for (let i = 0; i < 32; i++) {
		add((0x60 + i) as Code, GAS_FASTEST_STEP, 0, 1, `PUSH${i + 1}`);
	}

	// 0x80-0x8f: DUP1-DUP16
	for (let i = 0; i < 16; i++) {
		add((0x80 + i) as Code, GAS_FASTEST_STEP, i + 1, i + 2, `DUP${i + 1}`);
	}

	// 0x90-0x9f: SWAP1-SWAP16
	for (let i = 0; i < 16; i++) {
		add((0x90 + i) as Code, GAS_FASTEST_STEP, i + 2, i + 2, `SWAP${i + 1}`);
	}

	// 0xa0-0xa4: LOG0-LOG4
	for (let i = 0; i <= 4; i++) {
		add((0xa0 + i) as Code, LOG_GAS + i * LOG_TOPIC_GAS, 2 + i, 0, `LOG${i}`);
	}

	// 0xf0s: System Operations
	add(Code.CREATE, 32000, 3, 1, "CREATE");
	add(Code.CALL, 100, 7, 1, "CALL");
	add(Code.CALLCODE, 100, 7, 1, "CALLCODE");
	add(Code.RETURN, 0, 2, 0, "RETURN");
	add(Code.DELEGATECALL, 100, 6, 1, "DELEGATECALL");
	add(Code.CREATE2, 32000, 4, 1, "CREATE2");
	add(Code.AUTH, 3100, 3, 1, "AUTH");
	add(Code.AUTHCALL, 100, 8, 1, "AUTHCALL");
	add(Code.STATICCALL, 100, 6, 1, "STATICCALL");
	add(Code.REVERT, 0, 2, 0, "REVERT");
	add(Code.INVALID, 0, 0, 0, "INVALID");
	add(Code.SELFDESTRUCT, 5000, 1, 0, "SELFDESTRUCT");

	return table;
}

const INFO_TABLE = createInfoTable();

// ============================================================================
// Basic Operations
// ============================================================================

/**
 * Get metadata for an opcode (internal method, use with .call)
 *
 * @example
 * ```typescript
 * const add = Code.ADD;
 * const info = Opcode.info.call(add);
 * ```
 */
function info_internal(this: Code): Info | undefined {
	return INFO_TABLE.get(this);
}
export { info_internal as info };

/**
 * Get name of an opcode (internal method, use with .call)
 *
 * @example
 * ```typescript
 * const name = Opcode.name.call(Code.ADD); // "ADD"
 * ```
 */
function name_internal(this: Code): string {
	return INFO_TABLE.get(this)?.name ?? "UNKNOWN";
}
export { name_internal as name };

/**
 * Check if opcode is valid (internal method, use with .call)
 *
 * @example
 * ```typescript
 * const valid = Opcode.valid.call(0x01); // true
 * ```
 */
function valid_internal(this: number): this is Code {
	return INFO_TABLE.has(this as Code);
}
export { valid_internal as valid };

// ============================================================================
// Category Checks
// ============================================================================

/**
 * Check if opcode is a PUSH instruction (internal method, use with .call)
 *
 * @example
 * ```typescript
 * const isPushOp = Opcode.push.call(Code.PUSH1); // true
 * ```
 */
function push_internal(this: Code): boolean {
	return this === Code.PUSH0 || (this >= Code.PUSH1 && this <= Code.PUSH32);
}
export { push_internal as push };

/**
 * Check if opcode is a DUP instruction (internal method, use with .call)
 *
 * @example
 * ```typescript
 * const isDupOp = Opcode.dup.call(Code.DUP1); // true
 * ```
 */
function dup_internal(this: Code): boolean {
	return this >= Code.DUP1 && this <= Code.DUP16;
}
export { dup_internal as dup };

/**
 * Check if opcode is a SWAP instruction (internal method, use with .call)
 *
 * @example
 * ```typescript
 * const isSwapOp = Opcode.swap.call(Code.SWAP1); // true
 * ```
 */
function swap_internal(this: Code): boolean {
	return this >= Code.SWAP1 && this <= Code.SWAP16;
}
export { swap_internal as swap };

/**
 * Check if opcode is a LOG instruction (internal method, use with .call)
 *
 * @example
 * ```typescript
 * const isLogOp = Opcode.log.call(Code.LOG1); // true
 * ```
 */
function log_internal(this: Code): boolean {
	return this >= Code.LOG0 && this <= Code.LOG4;
}
export { log_internal as log };

/**
 * Check if opcode terminates execution (internal method, use with .call)
 *
 * @example
 * ```typescript
 * const terminates = Opcode.terminating.call(Code.RETURN); // true
 * ```
 */
function terminating_internal(this: Code): boolean {
	return (
		this === Code.STOP ||
		this === Code.RETURN ||
		this === Code.REVERT ||
		this === Code.INVALID ||
		this === Code.SELFDESTRUCT
	);
}
export { terminating_internal as terminating };

/**
 * Check if opcode is a jump (internal method, use with .call)
 *
 * @example
 * ```typescript
 * const isJumpOp = Opcode.jump.call(Code.JUMP); // true
 * ```
 */
function jump_internal(this: Code): boolean {
	return this === Code.JUMP || this === Code.JUMPI;
}
export { jump_internal as jump };

// ============================================================================
// PUSH Operations
// ============================================================================

/**
 * Get number of bytes pushed by PUSH instruction (internal method, use with .call)
 *
 * @example
 * ```typescript
 * const bytes = Opcode.pushBytes.call(Code.PUSH1); // 1
 * ```
 */
function pushBytes_internal(this: Code): number | undefined {
	if (this === Code.PUSH0) return 0;
	if (this >= Code.PUSH1 && this <= Code.PUSH32) {
		return this - Code.PUSH1 + 1;
	}
	return undefined;
}
export { pushBytes_internal as pushBytes };

/**
 * Get PUSH opcode for given byte count (internal method, use with .call)
 *
 * @example
 * ```typescript
 * const pushOp = Opcode.pushOpcode.call(1); // Code.PUSH1
 * ```
 */
function pushOpcode_internal(this: number): Code {
	if (this === 0) return Code.PUSH0;
	if (this < 1 || this > 32) {
		throw new Error(`Invalid PUSH size: ${this} (must be 0-32)`);
	}
	return (Code.PUSH1 + this - 1) as Code;
}
export { pushOpcode_internal as pushOpcode };

// ============================================================================
// DUP/SWAP Operations
// ============================================================================

/**
 * Get position for DUP instruction (internal method, use with .call)
 *
 * @example
 * ```typescript
 * const pos = Opcode.dupPosition.call(Code.DUP1); // 1
 * ```
 */
function dupPosition_internal(this: Code): number | undefined {
	if (this >= Code.DUP1 && this <= Code.DUP16) {
		return this - Code.DUP1 + 1;
	}
	return undefined;
}
export { dupPosition_internal as dupPosition };

/**
 * Get position for SWAP instruction (internal method, use with .call)
 *
 * @example
 * ```typescript
 * const pos = Opcode.swapPosition.call(Code.SWAP1); // 1
 * ```
 */
function swapPosition_internal(this: Code): number | undefined {
	if (this >= Code.SWAP1 && this <= Code.SWAP16) {
		return this - Code.SWAP1 + 1;
	}
	return undefined;
}
export { swapPosition_internal as swapPosition };

/**
 * Get number of topics for LOG instruction (internal method, use with .call)
 *
 * @example
 * ```typescript
 * const topics = Opcode.logTopics.call(Code.LOG1); // 1
 * ```
 */
function logTopics_internal(this: Code): number | undefined {
	if (this >= Code.LOG0 && this <= Code.LOG4) {
		return this - Code.LOG0;
	}
	return undefined;
}
export { logTopics_internal as logTopics };

// ============================================================================
// Bytecode Parsing
// ============================================================================

/**
 * Parse bytecode into instructions (internal method, use with .call)
 *
 * @example
 * ```typescript
 * const bytecode = new Uint8Array([0x60, 0x01, 0x60, 0x02, 0x01]);
 * const instructions = Opcode.parse.call(bytecode);
 * ```
 */
function parse_internal(this: Uint8Array): Instruction[] {
	const instructions: Instruction[] = [];
	let offset = 0;

	while (offset < this.length) {
		const opcode = this[offset] as Code;
		const pushBytesCount = pushBytes_internal.call(opcode);

		if (pushBytesCount !== undefined && pushBytesCount > 0) {
			const immediateEnd = Math.min(offset + 1 + pushBytesCount, this.length);
			const immediate = this.slice(offset + 1, immediateEnd);
			instructions.push({ offset, opcode, immediate });
			offset = immediateEnd;
		} else {
			instructions.push({ offset, opcode });
			offset++;
		}
	}

	return instructions;
}
export { parse_internal as parse };

/**
 * Format instruction to human-readable string (internal method, use with .call)
 *
 * @example
 * ```typescript
 * const formatted = Opcode.format.call(instruction);
 * ```
 */
function format_internal(this: Instruction): string {
	const offsetHex = this.offset.toString(16).padStart(4, "0");
	const nameStr = name_internal.call(this.opcode);

	if (this.immediate && this.immediate.length > 0) {
		const hex = Array.from(this.immediate)
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("");
		return `0x${offsetHex}: ${nameStr} 0x${hex}`;
	}

	return `0x${offsetHex}: ${nameStr}`;
}
export { format_internal as format };

// ============================================================================
// Jump Destination Analysis
// ============================================================================

/**
 * Find all valid JUMPDEST locations (internal method, use with .call)
 *
 * @example
 * ```typescript
 * const dests = Opcode.jumpDests.call(bytecode);
 * ```
 */
function jumpDests_internal(this: Uint8Array): Set<number> {
	const dests = new Set<number>();
	const instructions = parse_internal.call(this);

	for (const inst of instructions) {
		if (inst.opcode === Code.JUMPDEST) {
			dests.add(inst.offset);
		}
	}

	return dests;
}
export { jumpDests_internal as jumpDests };

/**
 * Check if offset is a valid jump destination (internal method, use with .call)
 *
 * @example
 * ```typescript
 * const valid = Opcode.validJumpDest.call(bytecode, offset);
 * ```
 */
function validJumpDest_internal(this: Uint8Array, offset: number): boolean {
	const dests = jumpDests_internal.call(this);
	return dests.has(offset);
}
export { validJumpDest_internal as validJumpDest };

// ============================================================================
// Branded Types
// ============================================================================

/**
 * Opcode type alias
 */
export type Opcode = Code;

// ============================================================================
// Public Wrapper Functions (Namespace+Type Overloading Pattern)
// ============================================================================

/**
 * Get metadata for an opcode
 *
 * @param opcode - Opcode to query
 * @returns Metadata with gas cost and stack requirements, or undefined if invalid
 *
 * @example
 * ```typescript
 * const info = Opcode.getInfo(Code.ADD);
 * console.log(info?.name); // "ADD"
 * console.log(info?.gasCost); // 3
 * ```
 */
export function getInfo(opcode: Code): Info | undefined {
	return info_internal.call(opcode);
}

/**
 * Get name of an opcode
 *
 * @param opcode - Opcode to query
 * @returns Opcode name or "UNKNOWN" if invalid
 *
 * @example
 * ```typescript
 * const name = Opcode.getName(Code.ADD); // "ADD"
 * ```
 */
export function getName(opcode: Code): string {
	return name_internal.call(opcode);
}

/**
 * Check if opcode is valid
 *
 * @param opcode - Byte value to check
 * @returns True if opcode is defined in the EVM
 *
 * @example
 * ```typescript
 * Opcode.isValid(0x01); // true (ADD)
 * Opcode.isValid(0x0c); // false (undefined)
 * ```
 */
export function isValid(opcode: number): opcode is Code {
	return valid_internal.call(opcode);
}

/**
 * Check if opcode is a PUSH instruction
 *
 * @param opcode - Opcode to check
 * @returns True if PUSH0-PUSH32
 *
 * @example
 * ```typescript
 * Opcode.isPush(Code.PUSH1); // true
 * Opcode.isPush(Code.ADD); // false
 * ```
 */
export function isPush(opcode: Code): boolean {
	return push_internal.call(opcode);
}

/**
 * Check if opcode is a DUP instruction
 *
 * @param opcode - Opcode to check
 * @returns True if DUP1-DUP16
 *
 * @example
 * ```typescript
 * Opcode.isDup(Code.DUP1); // true
 * Opcode.isDup(Code.ADD); // false
 * ```
 */
export function isDup(opcode: Code): boolean {
	return dup_internal.call(opcode);
}

/**
 * Check if opcode is a SWAP instruction
 *
 * @param opcode - Opcode to check
 * @returns True if SWAP1-SWAP16
 *
 * @example
 * ```typescript
 * Opcode.isSwap(Code.SWAP1); // true
 * Opcode.isSwap(Code.ADD); // false
 * ```
 */
export function isSwap(opcode: Code): boolean {
	return swap_internal.call(opcode);
}

/**
 * Check if opcode is a LOG instruction
 *
 * @param opcode - Opcode to check
 * @returns True if LOG0-LOG4
 *
 * @example
 * ```typescript
 * Opcode.isLog(Code.LOG1); // true
 * Opcode.isLog(Code.ADD); // false
 * ```
 */
export function isLog(opcode: Code): boolean {
	return log_internal.call(opcode);
}

/**
 * Check if opcode terminates execution
 *
 * @param opcode - Opcode to check
 * @returns True if STOP, RETURN, REVERT, INVALID, or SELFDESTRUCT
 *
 * @example
 * ```typescript
 * Opcode.isTerminating(Code.RETURN); // true
 * Opcode.isTerminating(Code.ADD); // false
 * ```
 */
export function isTerminating(opcode: Code): boolean {
	return terminating_internal.call(opcode);
}

/**
 * Check if opcode is a jump
 *
 * @param opcode - Opcode to check
 * @returns True if JUMP or JUMPI
 *
 * @example
 * ```typescript
 * Opcode.isJump(Code.JUMP); // true
 * Opcode.isJump(Code.JUMPI); // true
 * Opcode.isJump(Code.ADD); // false
 * ```
 */
export function isJump(opcode: Code): boolean {
	return jump_internal.call(opcode);
}

/**
 * Get number of bytes pushed by PUSH instruction
 *
 * @param opcode - Opcode to query
 * @returns Number of bytes (0-32), or undefined if not a PUSH
 *
 * @example
 * ```typescript
 * Opcode.getPushBytes(Code.PUSH1); // 1
 * Opcode.getPushBytes(Code.PUSH32); // 32
 * Opcode.getPushBytes(Code.PUSH0); // 0
 * Opcode.getPushBytes(Code.ADD); // undefined
 * ```
 */
export function getPushBytes(opcode: Code): number | undefined {
	return pushBytes_internal.call(opcode);
}

/**
 * Get PUSH opcode for given byte count
 *
 * @param bytes - Number of bytes (0-32)
 * @returns PUSH opcode for that size
 *
 * @example
 * ```typescript
 * Opcode.getPushOpcode(1); // Code.PUSH1
 * Opcode.getPushOpcode(32); // Code.PUSH32
 * Opcode.getPushOpcode(0); // Code.PUSH0
 * ```
 */
export function getPushOpcode(bytes: number): Code {
	return pushOpcode_internal.call(bytes);
}

/**
 * Get position for DUP instruction
 *
 * @param opcode - Opcode to query
 * @returns Stack position (1-16), or undefined if not a DUP
 *
 * @example
 * ```typescript
 * Opcode.getDupPosition(Code.DUP1); // 1
 * Opcode.getDupPosition(Code.DUP16); // 16
 * Opcode.getDupPosition(Code.ADD); // undefined
 * ```
 */
export function getDupPosition(opcode: Code): number | undefined {
	return dupPosition_internal.call(opcode);
}

/**
 * Get position for SWAP instruction
 *
 * @param opcode - Opcode to query
 * @returns Stack position (1-16), or undefined if not a SWAP
 *
 * @example
 * ```typescript
 * Opcode.getSwapPosition(Code.SWAP1); // 1
 * Opcode.getSwapPosition(Code.SWAP16); // 16
 * Opcode.getSwapPosition(Code.ADD); // undefined
 * ```
 */
export function getSwapPosition(opcode: Code): number | undefined {
	return swapPosition_internal.call(opcode);
}

/**
 * Get number of topics for LOG instruction
 *
 * @param opcode - Opcode to query
 * @returns Number of topics (0-4), or undefined if not a LOG
 *
 * @example
 * ```typescript
 * Opcode.getLogTopics(Code.LOG0); // 0
 * Opcode.getLogTopics(Code.LOG4); // 4
 * Opcode.getLogTopics(Code.ADD); // undefined
 * ```
 */
export function getLogTopics(opcode: Code): number | undefined {
	return logTopics_internal.call(opcode);
}

/**
 * Parse bytecode into instructions
 *
 * @param bytecode - Raw bytecode bytes
 * @returns Array of parsed instructions
 *
 * @example
 * ```typescript
 * const bytecode = new Uint8Array([0x60, 0x01, 0x60, 0x02, 0x01]);
 * const instructions = Opcode.parseBytecode(bytecode);
 * // [
 * //   { offset: 0, opcode: PUSH1, immediate: [0x01] },
 * //   { offset: 2, opcode: PUSH1, immediate: [0x02] },
 * //   { offset: 4, opcode: ADD }
 * // ]
 * ```
 */
export function parseBytecode(bytecode: Uint8Array): Instruction[] {
	return parse_internal.call(bytecode);
}

/**
 * Format instruction to human-readable string
 *
 * @param instruction - Instruction to format
 * @returns Human-readable string
 *
 * @example
 * ```typescript
 * const inst: Instruction = {
 *   offset: 0,
 *   opcode: Code.PUSH1,
 *   immediate: new Uint8Array([0x42])
 * };
 * Opcode.formatInstruction(inst); // "0x0000: PUSH1 0x42"
 * ```
 */
export function formatInstruction(instruction: Instruction): string {
	return format_internal.call(instruction);
}

/**
 * Disassemble bytecode to human-readable strings
 *
 * @param bytecode - Raw bytecode bytes
 * @returns Array of formatted instruction strings
 *
 * @example
 * ```typescript
 * const bytecode = new Uint8Array([0x60, 0x01, 0x60, 0x02, 0x01]);
 * const asm = Opcode.disassemble(bytecode);
 * // [
 * //   "0x0000: PUSH1 0x01",
 * //   "0x0002: PUSH1 0x02",
 * //   "0x0004: ADD"
 * // ]
 * ```
 */
export function disassemble(bytecode: Uint8Array): string[] {
	const instructions = parse_internal.call(bytecode);
	return instructions.map((inst) => format_internal.call(inst));
}

/**
 * Find all valid JUMPDEST locations
 *
 * @param bytecode - Raw bytecode bytes
 * @returns Set of valid jump destinations (byte offsets)
 *
 * @example
 * ```typescript
 * const bytecode = new Uint8Array([0x5b, 0x60, 0x01, 0x5b]);
 * const dests = Opcode.findJumpDests(bytecode); // Set { 0, 3 }
 * ```
 */
export function findJumpDests(bytecode: Uint8Array): Set<number> {
	return jumpDests_internal.call(bytecode);
}

/**
 * Check if offset is a valid jump destination
 *
 * @param bytecode - Raw bytecode bytes
 * @param offset - Byte offset to check
 * @returns True if offset is a JUMPDEST and not inside immediate data
 *
 * @example
 * ```typescript
 * const bytecode = new Uint8Array([0x5b, 0x60, 0x01]);
 * Opcode.isValidJumpDest(bytecode, 0); // true (JUMPDEST)
 * Opcode.isValidJumpDest(bytecode, 2); // false (immediate data)
 * ```
 */
export function isValidJumpDest(bytecode: Uint8Array, offset: number): boolean {
	return validJumpDest_internal.call(bytecode, offset);
}
