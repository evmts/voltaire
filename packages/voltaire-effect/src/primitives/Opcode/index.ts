/**
 * @module Opcode
 * @description Effect-wrapped operations for EVM opcodes.
 *
 * Provides functions for working with EVM opcodes (0x00-0xFF).
 *
 * ## Type Declarations
 *
 * ```typescript
 * import * as Opcode from 'voltaire-effect/primitives/Opcode'
 *
 * function executeOpcode(op: Opcode.OpcodeType) {
 *   // ...
 * }
 * ```
 *
 * ## Constants
 *
 * All EVM opcodes are exported as constants:
 * ```typescript
 * Opcode.STOP, Opcode.ADD, Opcode.MUL, Opcode.SUB, ...
 * Opcode.PUSH1, Opcode.PUSH2, ..., Opcode.PUSH32
 * Opcode.DUP1, Opcode.DUP2, ..., Opcode.DUP16
 * Opcode.SWAP1, Opcode.SWAP2, ..., Opcode.SWAP16
 * Opcode.LOG0, Opcode.LOG1, ..., Opcode.LOG4
 * Opcode.CREATE, Opcode.CALL, Opcode.RETURN, Opcode.REVERT, ...
 * ```
 *
 * ## Pure Functions
 *
 * ```typescript
 * // Disassembly
 * Opcode.disassemble(bytecode)           // Instruction[]
 * Opcode.format(opcode)                  // string
 * Opcode.parse(value)                    // OpcodeType
 *
 * // Metadata
 * Opcode.info(opcode)                    // Info
 * Opcode.name(opcode)                    // string
 * Opcode.getCategory(opcode)             // string
 * Opcode.getDescription(opcode)          // string
 * Opcode.getGasCost(opcode)              // number
 * Opcode.getPushSize(opcode)             // number
 * Opcode.getStackEffect(opcode)          // number
 * Opcode.getStackInput(opcode)           // number
 * Opcode.getStackOutput(opcode)          // number
 *
 * // Position helpers
 * Opcode.dupPosition(opcode)             // number
 * Opcode.swapPosition(opcode)            // number
 * Opcode.pushBytes(opcode)               // number
 * Opcode.pushOpcode(n)                   // OpcodeType
 * Opcode.logTopics(opcode)               // number
 *
 * // Predicates
 * Opcode.isDup(opcode)                   // boolean
 * Opcode.isJump(opcode)                  // boolean
 * Opcode.isJumpDestination(opcode)       // boolean
 * Opcode.isLog(opcode)                   // boolean
 * Opcode.isPush(opcode)                  // boolean
 * Opcode.isSwap(opcode)                  // boolean
 * Opcode.isTerminating(opcode)           // boolean
 * Opcode.isTerminator(opcode)            // boolean
 * Opcode.isValid(opcode)                 // boolean
 * Opcode.isValidJumpDest(opcode)         // boolean
 * Opcode.isValidOpcode(opcode)           // boolean
 *
 * // Analysis
 * Opcode.jumpDests(bytecode)             // Set<number>
 * ```
 *
 * @example
 * ```typescript
 * import * as Opcode from 'voltaire-effect/primitives/Opcode'
 *
 * const addInfo = Opcode.info(Opcode.ADD)
 * console.log(addInfo?.name)     // "ADD"
 * console.log(addInfo?.gasCost)  // 3
 *
 * Opcode.isPush(0x60)            // true (PUSH1)
 * Opcode.getPushSize(0x60)       // 1
 * ```
 *
 * @since 0.1.0
 */

// Re-export types
export type { Instruction, Info } from "@tevm/voltaire/Opcode";

// OpcodeType is number & { [brand]: "Opcode" } - re-export from OpcodeSchema
export type { OpcodeType } from "./OpcodeSchema.js";

// Schema
export { OpcodeSchema } from "./OpcodeSchema.js";

// Disassembly
export { disassemble, _disassemble } from "./disassemble.js";
export { format, _format } from "./format.js";
export { parse, _parse } from "./parse.js";

// Metadata getters
export {
	getCategory,
	_getCategory,
	getDescription,
	_getDescription,
	getGasCost,
	_getGasCost,
	getName,
	_getName,
	getPushSize,
	_getPushSize,
	getStackEffect,
	_getStackEffect,
	getStackInput,
	_getStackInput,
	getStackOutput,
	_getStackOutput,
} from "./getters.js";

// Info
export { info, _info } from "./info.js";

// Position helpers
export { dupPosition, _dupPosition } from "./dupPosition.js";
export { swapPosition, _swapPosition } from "./swapPosition.js";
export { pushBytes, _pushBytes } from "./pushBytes.js";
export { pushOpcode, _pushOpcode } from "./pushOpcode.js";
export { logTopics, _logTopics } from "./logTopics.js";
export { name, _name } from "./name.js";

// Predicates
export {
	isDup,
	_isDup,
	isJump,
	_isJump,
	isJumpDestination,
	_isJumpDestination,
	isLog,
	_isLog,
	isPush,
	_isPush,
	isSwap,
	_isSwap,
	isTerminating,
	_isTerminating,
	isTerminator,
	_isTerminator,
	isValid,
	_isValid,
	isValidJumpDest,
	_isValidJumpDest,
	isValidOpcode,
	_isValidOpcode,
} from "./predicates.js";

// Analysis
export { jumpDests, _jumpDests } from "./jumpDests.js";

// Constants - re-export all opcode constants
export {
	STOP,
	ADD,
	MUL,
	SUB,
	DIV,
	SDIV,
	MOD,
	SMOD,
	ADDMOD,
	MULMOD,
	EXP,
	SIGNEXTEND,
	LT,
	GT,
	SLT,
	SGT,
	EQ,
	ISZERO,
	AND,
	OR,
	XOR,
	NOT,
	BYTE,
	SHL,
	SHR,
	SAR,
	KECCAK256,
	ADDRESS,
	BALANCE,
	ORIGIN,
	CALLER,
	CALLVALUE,
	CALLDATALOAD,
	CALLDATASIZE,
	CALLDATACOPY,
	CODESIZE,
	CODECOPY,
	GASPRICE,
	EXTCODESIZE,
	EXTCODECOPY,
	RETURNDATASIZE,
	RETURNDATACOPY,
	EXTCODEHASH,
	BLOCKHASH,
	COINBASE,
	TIMESTAMP,
	NUMBER,
	DIFFICULTY,
	GASLIMIT,
	CHAINID,
	SELFBALANCE,
	BASEFEE,
	BLOBHASH,
	BLOBBASEFEE,
	POP,
	MLOAD,
	MSTORE,
	MSTORE8,
	SLOAD,
	SSTORE,
	JUMP,
	JUMPI,
	PC,
	MSIZE,
	GAS,
	JUMPDEST,
	TLOAD,
	TSTORE,
	MCOPY,
	PUSH0,
	PUSH1,
	PUSH2,
	PUSH3,
	PUSH4,
	PUSH5,
	PUSH6,
	PUSH7,
	PUSH8,
	PUSH9,
	PUSH10,
	PUSH11,
	PUSH12,
	PUSH13,
	PUSH14,
	PUSH15,
	PUSH16,
	PUSH17,
	PUSH18,
	PUSH19,
	PUSH20,
	PUSH21,
	PUSH22,
	PUSH23,
	PUSH24,
	PUSH25,
	PUSH26,
	PUSH27,
	PUSH28,
	PUSH29,
	PUSH30,
	PUSH31,
	PUSH32,
	DUP1,
	DUP2,
	DUP3,
	DUP4,
	DUP5,
	DUP6,
	DUP7,
	DUP8,
	DUP9,
	DUP10,
	DUP11,
	DUP12,
	DUP13,
	DUP14,
	DUP15,
	DUP16,
	SWAP1,
	SWAP2,
	SWAP3,
	SWAP4,
	SWAP5,
	SWAP6,
	SWAP7,
	SWAP8,
	SWAP9,
	SWAP10,
	SWAP11,
	SWAP12,
	SWAP13,
	SWAP14,
	SWAP15,
	SWAP16,
	LOG0,
	LOG1,
	LOG2,
	LOG3,
	LOG4,
	CREATE,
	CALL,
	CALLCODE,
	RETURN,
	DELEGATECALL,
	CREATE2,
	AUTH,
	AUTHCALL,
	STATICCALL,
	REVERT,
	INVALID,
	SELFDESTRUCT,
} from "@tevm/voltaire/Opcode";
