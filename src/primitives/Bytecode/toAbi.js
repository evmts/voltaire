import { scan } from "./scan.js";

// Opcodes
const PUSH4 = 0x63;
const PUSH32 = 0x7f;
const EQ = 0x14;
const JUMPI = 0x57;
const CALLVALUE = 0x34;
const ISZERO = 0x15;
const SSTORE = 0x55;
const SLOAD = 0x54;
const RETURN = 0xf3;
const REVERT = 0xfd;
const LOG0 = 0xa0;
const LOG4 = 0xa4;

/**
 * Extract ABI from bytecode by analyzing function dispatchers and event patterns
 *
 * Detects:
 * - Function selectors from PUSH4 + EQ dispatcher patterns
 * - Event hashes from PUSH32 + LOG patterns
 * - Payability from CALLVALUE checks
 * - State mutability from SLOAD/SSTORE usage
 *
 * @param {import('./BytecodeType.js').BrandedBytecode} bytecode - Bytecode to analyze
 * @returns {import('./BytecodeType.js').BrandedAbi} Extracted ABI with function selectors and event hashes
 *
 * @example
 * ```typescript
 * const bytecode = Bytecode.fromHex("0x608060...");
 * const abi = toAbi(bytecode);
 * // [
 * //   { type: "function", selector: "0xa9059cbb", stateMutability: "nonpayable", payable: false },
 * //   { type: "event", hash: "0xddf252ad..." }
 * // ]
 * ```
 */
export function toAbi(bytecode) {
	/** @type {Map<string, { payable: boolean; hasReturn: boolean; hasSstore: boolean; hasSload: boolean }>} */
	const selectors = new Map();
	/** @type {Set<string>} */
	const eventHashes = new Set();

	// Collect instructions for analysis
	const instructions = [...scan(bytecode)];

	// Global analysis: check for payability guard at start
	const hasGlobalPayabilityGuard = detectGlobalPayabilityGuard(instructions);
	// Check for SSTORE anywhere (indicates state modification)
	const hasSstoreGlobal = instructions.some((i) => i.opcode === SSTORE);
	const hasSloadGlobal = instructions.some((i) => i.opcode === SLOAD);
	const hasReturnGlobal = instructions.some((i) => i.opcode === RETURN);

	// Scan for function selectors and events
	for (let i = 0; i < instructions.length; i++) {
		const inst = instructions[i];

		// Look for PUSH4 <selector> pattern followed by EQ (function dispatcher)
		if (inst.opcode === PUSH4 && inst.value !== undefined) {
			const selector = formatSelector(inst.value);

			// Look ahead for EQ + JUMPI pattern (standard dispatcher)
			let foundDispatcher = false;
			for (let j = i + 1; j < Math.min(i + 5, instructions.length); j++) {
				if (instructions[j].opcode === EQ) {
					foundDispatcher = true;
					break;
				}
			}

			if (foundDispatcher && !selectors.has(selector)) {
				// Analyze the function entry for payability
				const funcInfo = analyzeFunctionEntry(instructions, i);
				selectors.set(selector, {
					payable: !hasGlobalPayabilityGuard && !funcInfo.hasPayabilityCheck,
					hasReturn: funcInfo.hasReturn || hasReturnGlobal,
					hasSstore: funcInfo.hasSstore || hasSstoreGlobal,
					hasSload: funcInfo.hasSload || hasSloadGlobal,
				});
			}
		}

		// Look for PUSH32 followed by LOG (event emission)
		if (inst.opcode === PUSH32 && inst.value !== undefined) {
			const hash = formatHash(inst.value);

			// Look ahead for LOG instruction
			for (let j = i + 1; j < Math.min(i + 20, instructions.length); j++) {
				const nextInst = instructions[j];
				if (nextInst.opcode >= LOG0 && nextInst.opcode <= LOG4) {
					eventHashes.add(hash);
					break;
				}
				// Stop if we hit a terminator
				if (
					nextInst.opcode === RETURN ||
					nextInst.opcode === REVERT ||
					nextInst.opcode === 0x00
				) {
					break;
				}
			}
		}
	}

	// Build ABI array
	/** @type {Array<import('./BytecodeType.js').ABIFunction | import('./BytecodeType.js').ABIEvent>} */
	const abi = [];

	for (const [selector, info] of selectors) {
		/** @type {"pure" | "view" | "nonpayable" | "payable"} */
		let stateMutability;

		if (info.payable) {
			stateMutability = "payable";
		} else if (info.hasSstore) {
			stateMutability = "nonpayable";
		} else if (info.hasSload) {
			stateMutability = "view";
		} else if (info.hasReturn && !info.hasSload && !info.hasSstore) {
			stateMutability = "pure";
		} else {
			stateMutability = "nonpayable";
		}

		abi.push({
			type: "function",
			selector,
			stateMutability,
			payable: info.payable,
		});
	}

	for (const hash of eventHashes) {
		abi.push({
			type: "event",
			hash,
		});
	}

	return /** @type {import('./BytecodeType.js').BrandedAbi} */ (
		Object.freeze(abi)
	);
}

/**
 * Detect global payability guard at contract start
 * Pattern: CALLVALUE DUP1 ISZERO ... JUMPI (revert if value > 0)
 * @param {Array<{pc: number; opcode: number; value?: bigint}>} instructions
 * @returns {boolean}
 */
function detectGlobalPayabilityGuard(instructions) {
	// Check first ~20 instructions for CALLVALUE + ISZERO pattern
	for (let i = 0; i < Math.min(20, instructions.length); i++) {
		if (instructions[i].opcode === CALLVALUE) {
			// Look for ISZERO nearby
			for (let j = i + 1; j < Math.min(i + 5, instructions.length); j++) {
				if (instructions[j].opcode === ISZERO) {
					return true;
				}
			}
		}
	}
	return false;
}

/**
 * Analyze function entry point for payability and state access
 * @param {Array<{pc: number; opcode: number; value?: bigint}>} instructions
 * @param {number} selectorIndex
 * @returns {{ hasPayabilityCheck: boolean; hasReturn: boolean; hasSstore: boolean; hasSload: boolean }}
 */
function analyzeFunctionEntry(instructions, selectorIndex) {
	let hasPayabilityCheck = false;
	let hasReturn = false;
	let hasSstore = false;
	let hasSload = false;

	// Scan ahead from selector (limited window for function body analysis)
	for (
		let i = selectorIndex;
		i < Math.min(selectorIndex + 100, instructions.length);
		i++
	) {
		const inst = instructions[i];

		if (inst.opcode === CALLVALUE) {
			// Look for ISZERO nearby (payability check)
			for (let j = i + 1; j < Math.min(i + 5, instructions.length); j++) {
				if (instructions[j].opcode === ISZERO) {
					hasPayabilityCheck = true;
					break;
				}
			}
		}

		if (inst.opcode === RETURN) hasReturn = true;
		if (inst.opcode === SSTORE) hasSstore = true;
		if (inst.opcode === SLOAD) hasSload = true;
	}

	return { hasPayabilityCheck, hasReturn, hasSstore, hasSload };
}

/**
 * Format 4-byte selector as hex string
 * @param {bigint} value
 * @returns {string}
 */
function formatSelector(value) {
	return `0x${value.toString(16).padStart(8, "0")}`;
}

/**
 * Format 32-byte hash as hex string
 * @param {bigint} value
 * @returns {string}
 */
function formatHash(value) {
	return `0x${value.toString(16).padStart(64, "0")}`;
}
