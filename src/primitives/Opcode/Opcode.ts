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

    const add = (op: Code, gasCost: number, stackInputs: number, stackOutputs: number, name: string) => {
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
 * Get metadata for an opcode (standard form)
 *
 * @param opcode - Opcode to query
 * @returns Metadata with gas cost and stack requirements, or undefined if invalid
 *
 * @example
 * ```typescript
 * const info = getInfo(Code.ADD);
 * console.log(info?.name); // "ADD"
 * console.log(info?.gasCost); // 3
 * ```
 */
export function getInfo(opcode: Code): Info | undefined {
    return INFO_TABLE.get(opcode);
}

/**
 * Get metadata for an opcode (convenience form with this:)
 *
 * @example
 * ```typescript
 * const add = Code.ADD;
 * const info = info.call(add);
 * ```
 */
export function info(this: Code): Info | undefined {
    return getInfo(this);
}

/**
 * Get name of an opcode (standard form)
 *
 * @param opcode - Opcode to query
 * @returns Opcode name or "UNKNOWN" if invalid
 *
 * @example
 * ```typescript
 * const name = getName(Code.ADD); // "ADD"
 * ```
 */
export function getName(opcode: Code): string {
    return getInfo(opcode)?.name ?? "UNKNOWN";
}

/**
 * Get name of an opcode (convenience form with this:)
 *
 * @example
 * ```typescript
 * const name = name.call(Code.ADD); // "ADD"
 * ```
 */
export function name(this: Code): string {
    return getName(this);
}

/**
 * Check if opcode is valid (standard form)
 *
 * @param opcode - Byte value to check
 * @returns True if opcode is defined in the EVM
 *
 * @example
 * ```typescript
 * isValid(0x01); // true (ADD)
 * isValid(0x0c); // false (undefined)
 * ```
 */
export function isValid(opcode: number): opcode is Code {
    return INFO_TABLE.has(opcode as Code);
}

/**
 * Check if opcode is valid (convenience form with this:)
 *
 * @example
 * ```typescript
 * const valid = valid.call(0x01); // true
 * ```
 */
export function valid(this: number): this is Code {
    return isValid(this);
}

// ============================================================================
// Category Checks
// ============================================================================

/**
 * Check if opcode is a PUSH instruction (standard form)
 *
 * @param opcode - Opcode to check
 * @returns True if PUSH0-PUSH32
 *
 * @example
 * ```typescript
 * isPush(Code.PUSH1); // true
 * isPush(Code.ADD); // false
 * ```
 */
export function isPush(opcode: Code): boolean {
    return opcode === Code.PUSH0 || (opcode >= Code.PUSH1 && opcode <= Code.PUSH32);
}

/**
 * Check if opcode is a PUSH instruction (convenience form with this:)
 *
 * @example
 * ```typescript
 * const isPushOp = push.call(Code.PUSH1); // true
 * ```
 */
export function push(this: Code): boolean {
    return isPush(this);
}

/**
 * Check if opcode is a DUP instruction (standard form)
 *
 * @param opcode - Opcode to check
 * @returns True if DUP1-DUP16
 *
 * @example
 * ```typescript
 * isDup(Code.DUP1); // true
 * isDup(Code.ADD); // false
 * ```
 */
export function isDup(opcode: Code): boolean {
    return opcode >= Code.DUP1 && opcode <= Code.DUP16;
}

/**
 * Check if opcode is a DUP instruction (convenience form with this:)
 *
 * @example
 * ```typescript
 * const isDupOp = dup.call(Code.DUP1); // true
 * ```
 */
export function dup(this: Code): boolean {
    return isDup(this);
}

/**
 * Check if opcode is a SWAP instruction (standard form)
 *
 * @param opcode - Opcode to check
 * @returns True if SWAP1-SWAP16
 *
 * @example
 * ```typescript
 * isSwap(Code.SWAP1); // true
 * isSwap(Code.ADD); // false
 * ```
 */
export function isSwap(opcode: Code): boolean {
    return opcode >= Code.SWAP1 && opcode <= Code.SWAP16;
}

/**
 * Check if opcode is a SWAP instruction (convenience form with this:)
 *
 * @example
 * ```typescript
 * const isSwapOp = swap.call(Code.SWAP1); // true
 * ```
 */
export function swap(this: Code): boolean {
    return isSwap(this);
}

/**
 * Check if opcode is a LOG instruction (standard form)
 *
 * @param opcode - Opcode to check
 * @returns True if LOG0-LOG4
 *
 * @example
 * ```typescript
 * isLog(Code.LOG1); // true
 * isLog(Code.ADD); // false
 * ```
 */
export function isLog(opcode: Code): boolean {
    return opcode >= Code.LOG0 && opcode <= Code.LOG4;
}

/**
 * Check if opcode is a LOG instruction (convenience form with this:)
 *
 * @example
 * ```typescript
 * const isLogOp = log.call(Code.LOG1); // true
 * ```
 */
export function log(this: Code): boolean {
    return isLog(this);
}

/**
 * Check if opcode terminates execution (standard form)
 *
 * @param opcode - Opcode to check
 * @returns True if STOP, RETURN, REVERT, INVALID, or SELFDESTRUCT
 *
 * @example
 * ```typescript
 * isTerminating(Code.RETURN); // true
 * isTerminating(Code.ADD); // false
 * ```
 */
export function isTerminating(opcode: Code): boolean {
    return (
        opcode === Code.STOP ||
        opcode === Code.RETURN ||
        opcode === Code.REVERT ||
        opcode === Code.INVALID ||
        opcode === Code.SELFDESTRUCT
    );
}

/**
 * Check if opcode terminates execution (convenience form with this:)
 *
 * @example
 * ```typescript
 * const terminates = terminating.call(Code.RETURN); // true
 * ```
 */
export function terminating(this: Code): boolean {
    return isTerminating(this);
}

/**
 * Check if opcode is a jump (standard form)
 *
 * @param opcode - Opcode to check
 * @returns True if JUMP or JUMPI
 *
 * @example
 * ```typescript
 * isJump(Code.JUMP); // true
 * isJump(Code.JUMPI); // true
 * isJump(Code.ADD); // false
 * ```
 */
export function isJump(opcode: Code): boolean {
    return opcode === Code.JUMP || opcode === Code.JUMPI;
}

/**
 * Check if opcode is a jump (convenience form with this:)
 *
 * @example
 * ```typescript
 * const isJumpOp = jump.call(Code.JUMP); // true
 * ```
 */
export function jump(this: Code): boolean {
    return isJump(this);
}

// ============================================================================
// PUSH Operations
// ============================================================================

/**
 * Get number of bytes pushed by PUSH instruction (standard form)
 *
 * @param opcode - Opcode to query
 * @returns Number of bytes (0-32), or undefined if not a PUSH
 *
 * @example
 * ```typescript
 * getPushBytes(Code.PUSH1); // 1
 * getPushBytes(Code.PUSH32); // 32
 * getPushBytes(Code.PUSH0); // 0
 * getPushBytes(Code.ADD); // undefined
 * ```
 */
export function getPushBytes(opcode: Code): number | undefined {
    if (opcode === Code.PUSH0) return 0;
    if (opcode >= Code.PUSH1 && opcode <= Code.PUSH32) {
        return opcode - Code.PUSH1 + 1;
    }
    return undefined;
}

/**
 * Get number of bytes pushed by PUSH instruction (convenience form with this:)
 *
 * @example
 * ```typescript
 * const bytes = pushBytes.call(Code.PUSH1); // 1
 * ```
 */
export function pushBytes(this: Code): number | undefined {
    return getPushBytes(this);
}

/**
 * Get PUSH opcode for given byte count (standard form)
 *
 * @param bytes - Number of bytes (0-32)
 * @returns PUSH opcode for that size
 *
 * @example
 * ```typescript
 * getPushOpcode(1); // Code.PUSH1
 * getPushOpcode(32); // Code.PUSH32
 * getPushOpcode(0); // Code.PUSH0
 * ```
 */
export function getPushOpcode(bytes: number): Code {
    if (bytes === 0) return Code.PUSH0;
    if (bytes < 1 || bytes > 32) {
        throw new Error(`Invalid PUSH size: ${bytes} (must be 0-32)`);
    }
    return (Code.PUSH1 + bytes - 1) as Code;
}

/**
 * Get PUSH opcode for given byte count (convenience form with this:)
 *
 * @example
 * ```typescript
 * const pushOp = pushOpcode.call(1); // Code.PUSH1
 * ```
 */
export function pushOpcode(this: number): Code {
    return getPushOpcode(this);
}

// ============================================================================
// DUP/SWAP Operations
// ============================================================================

/**
 * Get position for DUP instruction (standard form)
 *
 * @param opcode - Opcode to query
 * @returns Stack position (1-16), or undefined if not a DUP
 *
 * @example
 * ```typescript
 * getDupPosition(Code.DUP1); // 1
 * getDupPosition(Code.DUP16); // 16
 * getDupPosition(Code.ADD); // undefined
 * ```
 */
export function getDupPosition(opcode: Code): number | undefined {
    if (isDup(opcode)) {
        return opcode - Code.DUP1 + 1;
    }
    return undefined;
}

/**
 * Get position for DUP instruction (convenience form with this:)
 *
 * @example
 * ```typescript
 * const pos = dupPosition.call(Code.DUP1); // 1
 * ```
 */
export function dupPosition(this: Code): number | undefined {
    return getDupPosition(this);
}

/**
 * Get position for SWAP instruction (standard form)
 *
 * @param opcode - Opcode to query
 * @returns Stack position (1-16), or undefined if not a SWAP
 *
 * @example
 * ```typescript
 * getSwapPosition(Code.SWAP1); // 1
 * getSwapPosition(Code.SWAP16); // 16
 * getSwapPosition(Code.ADD); // undefined
 * ```
 */
export function getSwapPosition(opcode: Code): number | undefined {
    if (isSwap(opcode)) {
        return opcode - Code.SWAP1 + 1;
    }
    return undefined;
}

/**
 * Get position for SWAP instruction (convenience form with this:)
 *
 * @example
 * ```typescript
 * const pos = swapPosition.call(Code.SWAP1); // 1
 * ```
 */
export function swapPosition(this: Code): number | undefined {
    return getSwapPosition(this);
}

/**
 * Get number of topics for LOG instruction (standard form)
 *
 * @param opcode - Opcode to query
 * @returns Number of topics (0-4), or undefined if not a LOG
 *
 * @example
 * ```typescript
 * getLogTopics(Code.LOG0); // 0
 * getLogTopics(Code.LOG4); // 4
 * getLogTopics(Code.ADD); // undefined
 * ```
 */
export function getLogTopics(opcode: Code): number | undefined {
    if (isLog(opcode)) {
        return opcode - Code.LOG0;
    }
    return undefined;
}

/**
 * Get number of topics for LOG instruction (convenience form with this:)
 *
 * @example
 * ```typescript
 * const topics = logTopics.call(Code.LOG1); // 1
 * ```
 */
export function logTopics(this: Code): number | undefined {
    return getLogTopics(this);
}

// ============================================================================
// Bytecode Parsing
// ============================================================================

/**
 * Parse bytecode into instructions (standard form)
 *
 * @param bytecode - Raw bytecode bytes
 * @returns Array of parsed instructions
 *
 * @example
 * ```typescript
 * const bytecode = new Uint8Array([0x60, 0x01, 0x60, 0x02, 0x01]);
 * const instructions = parseBytecode(bytecode);
 * // [
 * //   { offset: 0, opcode: PUSH1, immediate: [0x01] },
 * //   { offset: 2, opcode: PUSH1, immediate: [0x02] },
 * //   { offset: 4, opcode: ADD }
 * // ]
 * ```
 */
export function parseBytecode(bytecode: Uint8Array): Instruction[] {
    const instructions: Instruction[] = [];
    let offset = 0;

    while (offset < bytecode.length) {
        const opcode = bytecode[offset] as Code;
        const pushBytesCount = getPushBytes(opcode);

        if (pushBytesCount !== undefined && pushBytesCount > 0) {
            const immediateEnd = Math.min(offset + 1 + pushBytesCount, bytecode.length);
            const immediate = bytecode.slice(offset + 1, immediateEnd);
            instructions.push({ offset, opcode, immediate });
            offset = immediateEnd;
        } else {
            instructions.push({ offset, opcode });
            offset++;
        }
    }

    return instructions;
}

/**
 * Parse bytecode into instructions (convenience form with this:)
 *
 * @example
 * ```typescript
 * const bytecode = new Uint8Array([0x60, 0x01, 0x60, 0x02, 0x01]);
 * const instructions = parse.call(bytecode);
 * ```
 */
export function parse(this: Uint8Array): Instruction[] {
    return parseBytecode(this);
}

/**
 * Format instruction to human-readable string (standard form)
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
 * formatInstruction(inst); // "0x0000: PUSH1 0x42"
 * ```
 */
export function formatInstruction(instruction: Instruction): string {
    const offsetHex = instruction.offset.toString(16).padStart(4, "0");
    const nameStr = getName(instruction.opcode);

    if (instruction.immediate && instruction.immediate.length > 0) {
        const hex = Array.from(instruction.immediate)
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
        return `0x${offsetHex}: ${nameStr} 0x${hex}`;
    }

    return `0x${offsetHex}: ${nameStr}`;
}

/**
 * Format instruction to human-readable string (convenience form with this:)
 *
 * @example
 * ```typescript
 * const formatted = format.call(instruction);
 * ```
 */
export function format(this: Instruction): string {
    return formatInstruction(this);
}

/**
 * Disassemble bytecode to human-readable strings (standard form)
 *
 * @param bytecode - Raw bytecode bytes
 * @returns Array of formatted instruction strings
 *
 * @example
 * ```typescript
 * const bytecode = new Uint8Array([0x60, 0x01, 0x60, 0x02, 0x01]);
 * const asm = disassemble(bytecode);
 * // [
 * //   "0x0000: PUSH1 0x01",
 * //   "0x0002: PUSH1 0x02",
 * //   "0x0004: ADD"
 * // ]
 * ```
 */
export function disassemble(bytecode: Uint8Array): string[] {
    const instructions = parseBytecode(bytecode);
    return instructions.map((inst) => formatInstruction(inst));
}

// ============================================================================
// Jump Destination Analysis
// ============================================================================

/**
 * Find all valid JUMPDEST locations (standard form)
 *
 * @param bytecode - Raw bytecode bytes
 * @returns Set of valid jump destinations (byte offsets)
 *
 * @example
 * ```typescript
 * const bytecode = new Uint8Array([0x5b, 0x60, 0x01, 0x5b]);
 * const dests = findJumpDests(bytecode); // Set { 0, 3 }
 * ```
 */
export function findJumpDests(bytecode: Uint8Array): Set<number> {
    const dests = new Set<number>();
    const instructions = parseBytecode(bytecode);

    for (const inst of instructions) {
        if (inst.opcode === Code.JUMPDEST) {
            dests.add(inst.offset);
        }
    }

    return dests;
}

/**
 * Find all valid JUMPDEST locations (convenience form with this:)
 *
 * @example
 * ```typescript
 * const dests = jumpDests.call(bytecode);
 * ```
 */
export function jumpDests(this: Uint8Array): Set<number> {
    return findJumpDests(this);
}

/**
 * Check if offset is a valid jump destination (standard form)
 *
 * @param bytecode - Raw bytecode bytes
 * @param offset - Byte offset to check
 * @returns True if offset is a JUMPDEST and not inside immediate data
 *
 * @example
 * ```typescript
 * const bytecode = new Uint8Array([0x5b, 0x60, 0x01]);
 * isValidJumpDest(bytecode, 0); // true (JUMPDEST)
 * isValidJumpDest(bytecode, 2); // false (immediate data)
 * ```
 */
export function isValidJumpDest(bytecode: Uint8Array, offset: number): boolean {
    const dests = findJumpDests(bytecode);
    return dests.has(offset);
}

/**
 * Check if offset is a valid jump destination (convenience form with this:)
 *
 * @example
 * ```typescript
 * const valid = validJumpDest.call(bytecode, offset);
 * ```
 */
export function validJumpDest(this: Uint8Array, offset: number): boolean {
    return isValidJumpDest(this, offset);
}

// ============================================================================
// Branded Types
// ============================================================================

/**
 * Opcode type alias
 */
export type Opcode = Code;
