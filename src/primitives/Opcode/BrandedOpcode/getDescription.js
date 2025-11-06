// @ts-nocheck
import * as constants from "./constants.js";

/**
 * Opcode description mapping
 * @internal
 */
const DESCRIPTIONS = new Map([
	// 0x00s: Stop and Arithmetic Operations
	[constants.STOP, "Halt execution"],
	[constants.ADD, "Addition operation"],
	[constants.MUL, "Multiplication operation"],
	[constants.SUB, "Subtraction operation"],
	[constants.DIV, "Integer division operation"],
	[constants.SDIV, "Signed integer division operation"],
	[constants.MOD, "Modulo remainder operation"],
	[constants.SMOD, "Signed modulo remainder operation"],
	[constants.ADDMOD, "Modulo addition operation"],
	[constants.MULMOD, "Modulo multiplication operation"],
	[constants.EXP, "Exponential operation"],
	[constants.SIGNEXTEND, "Extend length of two's complement signed integer"],

	// 0x10s: Comparison & Bitwise Logic Operations
	[constants.LT, "Less-than comparison"],
	[constants.GT, "Greater-than comparison"],
	[constants.SLT, "Signed less-than comparison"],
	[constants.SGT, "Signed greater-than comparison"],
	[constants.EQ, "Equality comparison"],
	[constants.ISZERO, "Simple not operator"],
	[constants.AND, "Bitwise AND operation"],
	[constants.OR, "Bitwise OR operation"],
	[constants.XOR, "Bitwise XOR operation"],
	[constants.NOT, "Bitwise NOT operation"],
	[constants.BYTE, "Retrieve single byte from word"],
	[constants.SHL, "Left shift operation"],
	[constants.SHR, "Logical right shift operation"],
	[constants.SAR, "Arithmetic right shift operation"],

	// 0x20s: Crypto
	[constants.KECCAK256, "Compute Keccak-256 hash"],

	// 0x30s: Environmental Information
	[constants.ADDRESS, "Get address of currently executing account"],
	[constants.BALANCE, "Get balance of the given account"],
	[constants.ORIGIN, "Get execution origination address"],
	[constants.CALLER, "Get caller address"],
	[constants.CALLVALUE, "Get deposited value by instruction/transaction"],
	[constants.CALLDATALOAD, "Get input data of current environment"],
	[constants.CALLDATASIZE, "Get size of input data"],
	[constants.CALLDATACOPY, "Copy input data to memory"],
	[constants.CODESIZE, "Get size of code running in current environment"],
	[constants.CODECOPY, "Copy code running in current environment to memory"],
	[constants.GASPRICE, "Get price of gas in current environment"],
	[constants.EXTCODESIZE, "Get size of an account's code"],
	[constants.EXTCODECOPY, "Copy an account's code to memory"],
	[constants.RETURNDATASIZE, "Get size of output data from previous call"],
	[constants.RETURNDATACOPY, "Copy output data from previous call to memory"],
	[constants.EXTCODEHASH, "Get hash of an account's code"],

	// 0x40s: Block Information
	[constants.BLOCKHASH, "Get hash of one of the 256 most recent blocks"],
	[constants.COINBASE, "Get the block's beneficiary address"],
	[constants.TIMESTAMP, "Get the block's timestamp"],
	[constants.NUMBER, "Get the block's number"],
	[constants.DIFFICULTY, "Get the block's difficulty"],
	[constants.GASLIMIT, "Get the block's gas limit"],
	[constants.CHAINID, "Get the chain ID"],
	[constants.SELFBALANCE, "Get balance of currently executing account"],
	[constants.BASEFEE, "Get the base fee"],
	[constants.BLOBHASH, "Get versioned hash of blob at index"],
	[constants.BLOBBASEFEE, "Get the blob base fee"],

	// 0x50s: Stack, Memory, Storage and Flow Operations
	[constants.POP, "Remove item from stack"],
	[constants.MLOAD, "Load word from memory"],
	[constants.MSTORE, "Save word to memory"],
	[constants.MSTORE8, "Save byte to memory"],
	[constants.SLOAD, "Load word from storage"],
	[constants.SSTORE, "Save word to storage"],
	[constants.JUMP, "Alter the program counter"],
	[constants.JUMPI, "Conditionally alter the program counter"],
	[constants.PC, "Get the value of the program counter"],
	[constants.MSIZE, "Get the size of active memory in bytes"],
	[constants.GAS, "Get the amount of available gas"],
	[constants.JUMPDEST, "Mark a valid destination for jumps"],
	[constants.TLOAD, "Load word from transient storage"],
	[constants.TSTORE, "Save word to transient storage"],
	[constants.MCOPY, "Copy memory areas"],
	[constants.PUSH0, "Place 0 on stack"],

	// 0xa0s: LOG0-LOG4
	[constants.LOG0, "Append log record with no topics"],
	[constants.LOG1, "Append log record with one topic"],
	[constants.LOG2, "Append log record with two topics"],
	[constants.LOG3, "Append log record with three topics"],
	[constants.LOG4, "Append log record with four topics"],

	// 0xf0s: System Operations
	[constants.CREATE, "Create a new account with associated code"],
	[constants.CALL, "Message-call into an account"],
	[
		constants.CALLCODE,
		"Message-call into this account with alternative account's code",
	],
	[constants.RETURN, "Halt execution returning output data"],
	[
		constants.DELEGATECALL,
		"Message-call into this account with alternative account's code but persisting sender and value",
	],
	[
		constants.CREATE2,
		"Create a new account with associated code at a predictable address",
	],
	[constants.AUTH, "Authorize account for AUTHCALL"],
	[constants.AUTHCALL, "Message-call with authorization"],
	[constants.STATICCALL, "Static message-call into an account"],
	[constants.REVERT, "Halt execution reverting state changes"],
	[constants.INVALID, "Designated invalid instruction"],
	[
		constants.SELFDESTRUCT,
		"Halt execution and register account for later deletion",
	],
]);

/**
 * Get human-readable description of an opcode
 *
 * @param {import('./BrandedOpcode.js').BrandedOpcode} opcode - Opcode to query
 * @returns {string} Description or generated description for PUSH/DUP/SWAP
 *
 * @example
 * ```typescript
 * const desc = Opcode.getDescription(Opcode.ADD);
 * // "Addition operation"
 *
 * const desc2 = Opcode.getDescription(Opcode.PUSH1);
 * // "Place 1-byte item on stack"
 * ```
 */
export function getDescription(opcode) {
	const desc = DESCRIPTIONS.get(opcode);
	if (desc) return desc;

	// Generate descriptions for PUSH1-PUSH32
	if (opcode >= constants.PUSH1 && opcode <= constants.PUSH32) {
		const n = opcode - constants.PUSH1 + 1;
		return `Place ${n}-byte item on stack`;
	}

	// Generate descriptions for DUP1-DUP16
	if (opcode >= constants.DUP1 && opcode <= constants.DUP16) {
		const n = opcode - constants.DUP1 + 1;
		return `Duplicate ${n}${nth(n)} stack item`;
	}

	// Generate descriptions for SWAP1-SWAP16
	if (opcode >= constants.SWAP1 && opcode <= constants.SWAP16) {
		const n = opcode - constants.SWAP1 + 1;
		return `Exchange 1st and ${n + 1}${nth(n + 1)} stack items`;
	}

	return "Unknown opcode";
}

/**
 * Get ordinal suffix
 * @param {number} n
 * @returns {string}
 * @internal
 */
function nth(n) {
	if (n === 1) return "st";
	if (n === 2) return "nd";
	if (n === 3) return "rd";
	return "th";
}
