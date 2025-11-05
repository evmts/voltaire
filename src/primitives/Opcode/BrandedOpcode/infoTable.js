// @ts-nocheck
import * as constants from "./constants.js";

/**
 * Gas cost constants
 * @internal
 */
const GAS_FASTEST_STEP = 3;
const GAS_FAST_STEP = 5;
const GAS_MID_STEP = 8;
const GAS_QUICK_STEP = 2;
const LOG_GAS = 375;
const LOG_TOPIC_GAS = 375;

/**
 * Create opcode info table
 * @returns {Map<import('./BrandedOpcode.js').BrandedOpcode, import('./BrandedOpcode.js').Info>}
 * @internal
 */
function createInfoTable() {
	/** @type {Map<import('./BrandedOpcode.js').BrandedOpcode, import('./BrandedOpcode.js').Info>} */
	const table = new Map();

	/**
	 * @param {import('./BrandedOpcode.js').BrandedOpcode} op
	 * @param {number} gasCost
	 * @param {number} stackInputs
	 * @param {number} stackOutputs
	 * @param {string} name
	 */
	const add = (op, gasCost, stackInputs, stackOutputs, name) => {
		table.set(op, { gasCost, stackInputs, stackOutputs, name });
	};

	// 0x00s: Stop and Arithmetic Operations
	add(constants.STOP, 0, 0, 0, "STOP");
	add(constants.ADD, GAS_FASTEST_STEP, 2, 1, "ADD");
	add(constants.MUL, GAS_FAST_STEP, 2, 1, "MUL");
	add(constants.SUB, GAS_FASTEST_STEP, 2, 1, "SUB");
	add(constants.DIV, GAS_FAST_STEP, 2, 1, "DIV");
	add(constants.SDIV, GAS_FAST_STEP, 2, 1, "SDIV");
	add(constants.MOD, GAS_FAST_STEP, 2, 1, "MOD");
	add(constants.SMOD, GAS_FAST_STEP, 2, 1, "SMOD");
	add(constants.ADDMOD, GAS_MID_STEP, 3, 1, "ADDMOD");
	add(constants.MULMOD, GAS_MID_STEP, 3, 1, "MULMOD");
	add(constants.EXP, 10, 2, 1, "EXP");
	add(constants.SIGNEXTEND, GAS_FAST_STEP, 2, 1, "SIGNEXTEND");

	// 0x10s: Comparison & Bitwise Logic Operations
	add(constants.LT, GAS_FASTEST_STEP, 2, 1, "LT");
	add(constants.GT, GAS_FASTEST_STEP, 2, 1, "GT");
	add(constants.SLT, GAS_FASTEST_STEP, 2, 1, "SLT");
	add(constants.SGT, GAS_FASTEST_STEP, 2, 1, "SGT");
	add(constants.EQ, GAS_FASTEST_STEP, 2, 1, "EQ");
	add(constants.ISZERO, GAS_FASTEST_STEP, 1, 1, "ISZERO");
	add(constants.AND, GAS_FASTEST_STEP, 2, 1, "AND");
	add(constants.OR, GAS_FASTEST_STEP, 2, 1, "OR");
	add(constants.XOR, GAS_FASTEST_STEP, 2, 1, "XOR");
	add(constants.NOT, GAS_FASTEST_STEP, 1, 1, "NOT");
	add(constants.BYTE, GAS_FASTEST_STEP, 2, 1, "BYTE");
	add(constants.SHL, GAS_FASTEST_STEP, 2, 1, "SHL");
	add(constants.SHR, GAS_FASTEST_STEP, 2, 1, "SHR");
	add(constants.SAR, GAS_FASTEST_STEP, 2, 1, "SAR");

	// 0x20s: Crypto
	add(constants.KECCAK256, 30, 2, 1, "KECCAK256");

	// 0x30s: Environmental Information
	add(constants.ADDRESS, GAS_QUICK_STEP, 0, 1, "ADDRESS");
	add(constants.BALANCE, 100, 1, 1, "BALANCE");
	add(constants.ORIGIN, GAS_QUICK_STEP, 0, 1, "ORIGIN");
	add(constants.CALLER, GAS_QUICK_STEP, 0, 1, "CALLER");
	add(constants.CALLVALUE, GAS_QUICK_STEP, 0, 1, "CALLVALUE");
	add(constants.CALLDATALOAD, GAS_FASTEST_STEP, 1, 1, "CALLDATALOAD");
	add(constants.CALLDATASIZE, GAS_QUICK_STEP, 0, 1, "CALLDATASIZE");
	add(constants.CALLDATACOPY, GAS_FASTEST_STEP, 3, 0, "CALLDATACOPY");
	add(constants.CODESIZE, GAS_QUICK_STEP, 0, 1, "CODESIZE");
	add(constants.CODECOPY, GAS_FASTEST_STEP, 3, 0, "CODECOPY");
	add(constants.GASPRICE, GAS_QUICK_STEP, 0, 1, "GASPRICE");
	add(constants.EXTCODESIZE, 100, 1, 1, "EXTCODESIZE");
	add(constants.EXTCODECOPY, 100, 4, 0, "EXTCODECOPY");
	add(constants.RETURNDATASIZE, GAS_QUICK_STEP, 0, 1, "RETURNDATASIZE");
	add(constants.RETURNDATACOPY, GAS_FASTEST_STEP, 3, 0, "RETURNDATACOPY");
	add(constants.EXTCODEHASH, 100, 1, 1, "EXTCODEHASH");

	// 0x40s: Block Information
	add(constants.BLOCKHASH, 20, 1, 1, "BLOCKHASH");
	add(constants.COINBASE, GAS_QUICK_STEP, 0, 1, "COINBASE");
	add(constants.TIMESTAMP, GAS_QUICK_STEP, 0, 1, "TIMESTAMP");
	add(constants.NUMBER, GAS_QUICK_STEP, 0, 1, "NUMBER");
	add(constants.DIFFICULTY, GAS_QUICK_STEP, 0, 1, "DIFFICULTY");
	add(constants.GASLIMIT, GAS_QUICK_STEP, 0, 1, "GASLIMIT");
	add(constants.CHAINID, GAS_QUICK_STEP, 0, 1, "CHAINID");
	add(constants.SELFBALANCE, GAS_FAST_STEP, 0, 1, "SELFBALANCE");
	add(constants.BASEFEE, GAS_QUICK_STEP, 0, 1, "BASEFEE");
	add(constants.BLOBHASH, GAS_FASTEST_STEP, 1, 1, "BLOBHASH");
	add(constants.BLOBBASEFEE, GAS_QUICK_STEP, 0, 1, "BLOBBASEFEE");

	// 0x50s: Stack, Memory, Storage and Flow Operations
	add(constants.POP, GAS_QUICK_STEP, 1, 0, "POP");
	add(constants.MLOAD, GAS_FASTEST_STEP, 1, 1, "MLOAD");
	add(constants.MSTORE, GAS_FASTEST_STEP, 2, 0, "MSTORE");
	add(constants.MSTORE8, GAS_FASTEST_STEP, 2, 0, "MSTORE8");
	add(constants.SLOAD, 100, 1, 1, "SLOAD");
	add(constants.SSTORE, 100, 2, 0, "SSTORE");
	add(constants.JUMP, GAS_MID_STEP, 1, 0, "JUMP");
	add(constants.JUMPI, 10, 2, 0, "JUMPI");
	add(constants.PC, GAS_QUICK_STEP, 0, 1, "PC");
	add(constants.MSIZE, GAS_QUICK_STEP, 0, 1, "MSIZE");
	add(constants.GAS, GAS_QUICK_STEP, 0, 1, "GAS");
	add(constants.JUMPDEST, 1, 0, 0, "JUMPDEST");
	add(constants.TLOAD, 100, 1, 1, "TLOAD");
	add(constants.TSTORE, 100, 2, 0, "TSTORE");
	add(constants.MCOPY, GAS_FASTEST_STEP, 3, 0, "MCOPY");
	add(constants.PUSH0, GAS_QUICK_STEP, 0, 1, "PUSH0");

	// 0x60-0x7f: PUSH1-PUSH32
	for (let i = 0; i < 32; i++) {
		add(
			/** @type {import('./BrandedOpcode.js').BrandedOpcode} */ (0x60 + i),
			GAS_FASTEST_STEP,
			0,
			1,
			`PUSH${i + 1}`,
		);
	}

	// 0x80-0x8f: DUP1-DUP16
	for (let i = 0; i < 16; i++) {
		add(
			/** @type {import('./BrandedOpcode.js').BrandedOpcode} */ (0x80 + i),
			GAS_FASTEST_STEP,
			i + 1,
			i + 2,
			`DUP${i + 1}`,
		);
	}

	// 0x90-0x9f: SWAP1-SWAP16
	for (let i = 0; i < 16; i++) {
		add(
			/** @type {import('./BrandedOpcode.js').BrandedOpcode} */ (0x90 + i),
			GAS_FASTEST_STEP,
			i + 2,
			i + 2,
			`SWAP${i + 1}`,
		);
	}

	// 0xa0-0xa4: LOG0-LOG4
	for (let i = 0; i <= 4; i++) {
		add(
			/** @type {import('./BrandedOpcode.js').BrandedOpcode} */ (0xa0 + i),
			LOG_GAS + i * LOG_TOPIC_GAS,
			2 + i,
			0,
			`LOG${i}`,
		);
	}

	// 0xf0s: System Operations
	add(constants.CREATE, 32000, 3, 1, "CREATE");
	add(constants.CALL, 100, 7, 1, "CALL");
	add(constants.CALLCODE, 100, 7, 1, "CALLCODE");
	add(constants.RETURN, 0, 2, 0, "RETURN");
	add(constants.DELEGATECALL, 100, 6, 1, "DELEGATECALL");
	add(constants.CREATE2, 32000, 4, 1, "CREATE2");
	add(constants.AUTH, 3100, 3, 1, "AUTH");
	add(constants.AUTHCALL, 100, 8, 1, "AUTHCALL");
	add(constants.STATICCALL, 100, 6, 1, "STATICCALL");
	add(constants.REVERT, 0, 2, 0, "REVERT");
	add(constants.INVALID, 0, 0, 0, "INVALID");
	add(constants.SELFDESTRUCT, 5000, 1, 0, "SELFDESTRUCT");

	return table;
}

/**
 * Singleton info table
 * @type {Map<import('./BrandedOpcode.js').BrandedOpcode, import('./BrandedOpcode.js').Info>}
 * @internal
 */
export const INFO_TABLE = createInfoTable();
