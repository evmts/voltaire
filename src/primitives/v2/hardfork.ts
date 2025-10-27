/**
 * Ethereum Hardfork Management
 *
 * This module provides hardfork identifiers and version comparison utilities
 * for Ethereum protocol upgrades. Each hardfork represents a protocol upgrade
 * that changes EVM behavior, gas costs, or adds new features.
 */

/**
 * Ethereum hardfork identifiers.
 *
 * Hardforks represent protocol upgrades that change EVM behavior,
 * gas costs, or add new features. Each hardfork builds upon the
 * previous ones, maintaining backward compatibility while adding
 * improvements.
 */
export enum Hardfork {
	/** Original Ethereum launch (July 2015). Base EVM with fundamental opcodes. */
	FRONTIER = 0,
	/** First planned hardfork (March 2016). Added DELEGATECALL and fixed critical issues. */
	HOMESTEAD = 1,
	/** Emergency fork for DAO hack (July 2016). No EVM changes, only state modifications. */
	DAO = 2,
	/** Gas repricing fork (October 2016). EIP-150: Increased gas costs for IO-heavy operations. */
	TANGERINE_WHISTLE = 3,
	/** State cleaning fork (November 2016). EIP-161: Removed empty accounts. */
	SPURIOUS_DRAGON = 4,
	/** Major feature fork (October 2017). Added REVERT, RETURNDATASIZE, RETURNDATACOPY, STATICCALL. */
	BYZANTIUM = 5,
	/** Efficiency improvements (February 2019). Added CREATE2, shift opcodes, EXTCODEHASH. */
	CONSTANTINOPLE = 6,
	/** Quick fix fork (February 2019). Removed EIP-1283 due to reentrancy concerns. */
	PETERSBURG = 7,
	/** Gas optimization fork (December 2019). EIP-2200: Rebalanced SSTORE costs. Added CHAINID and SELFBALANCE. */
	ISTANBUL = 8,
	/** Difficulty bomb delay (January 2020). No EVM changes. */
	MUIR_GLACIER = 9,
	/** Access list fork (April 2021). EIP-2929: Gas cost for cold/warm access. EIP-2930: Optional access lists. */
	BERLIN = 10,
	/** Fee market reform (August 2021). EIP-1559: Base fee and new transaction types. Added BASEFEE opcode. */
	LONDON = 11,
	/** Difficulty bomb delay (December 2021). No EVM changes. */
	ARROW_GLACIER = 12,
	/** Difficulty bomb delay (June 2022). No EVM changes. */
	GRAY_GLACIER = 13,
	/** Proof of Stake transition (September 2022). Replaced DIFFICULTY with PREVRANDAO. */
	MERGE = 14,
	/** Withdrawal enabling fork (April 2023). EIP-3855: PUSH0 opcode. */
	SHANGHAI = 15,
	/** Proto-danksharding fork (March 2024). EIP-4844: Blob transactions. EIP-1153: Transient storage (TLOAD/TSTORE). EIP-5656: MCOPY opcode. */
	CANCUN = 16,
	/** Prague-Electra fork (May 2025). EIP-2537: BLS12-381 precompiles. EIP-7702: Set EOA account code for one transaction. */
	PRAGUE = 17,
	/** Osaka fork (TBD). EIP-7883: ModExp gas increase. */
	OSAKA = 18,
}

/**
 * Default hardfork for new chains.
 * Set to latest stable fork (currently PRAGUE).
 */
export const DEFAULT_HARDFORK = Hardfork.PRAGUE;

/**
 * Check if current hardfork is at least the specified version
 *
 * @param current Current hardfork
 * @param target Target hardfork to compare against
 * @returns true if current >= target
 *
 * @example
 * ```ts
 * const current = Hardfork.CANCUN;
 * if (isAtLeast(current, Hardfork.SHANGHAI)) {
 *   // PUSH0 opcode is available
 * }
 * ```
 */
export function isAtLeast(current: Hardfork, target: Hardfork): boolean {
	return current >= target;
}

/**
 * Compare two hardforks
 *
 * @param a First hardfork
 * @param b Second hardfork
 * @returns negative if a < b, zero if a == b, positive if a > b
 *
 * @example
 * ```ts
 * compare(Hardfork.BERLIN, Hardfork.LONDON) // negative
 * compare(Hardfork.CANCUN, Hardfork.CANCUN) // 0
 * compare(Hardfork.PRAGUE, Hardfork.SHANGHAI) // positive
 * ```
 */
export function compare(a: Hardfork, b: Hardfork): number {
	return a - b;
}

/**
 * Check if current hardfork is before the specified version
 *
 * @param current Current hardfork
 * @param target Target hardfork to compare against
 * @returns true if current < target
 */
export function isBefore(current: Hardfork, target: Hardfork): boolean {
	return current < target;
}

/**
 * Parse hardfork from string name (case-insensitive)
 * Supports both standard names and common variations
 *
 * @param name Hardfork name (e.g., "Cancun", ">=Berlin")
 * @returns Hardfork enum value or undefined if invalid
 */
export function fromString(name: string): Hardfork | undefined {
	// Handle comparisons like ">=Cancun" or ">Berlin"
	let cleanName = name;
	if (name.length > 0 && (name[0] === ">" || name[0] === "<")) {
		const start = name.length > 1 && name[1] === "=" ? 2 : 1;
		cleanName = name.substring(start);
	}

	// Case-insensitive comparison
	const lower = cleanName.toLowerCase();

	switch (lower) {
		case "frontier":
			return Hardfork.FRONTIER;
		case "homestead":
			return Hardfork.HOMESTEAD;
		case "dao":
			return Hardfork.DAO;
		case "tangerinewhistle":
			return Hardfork.TANGERINE_WHISTLE;
		case "spuriousdragon":
			return Hardfork.SPURIOUS_DRAGON;
		case "byzantium":
			return Hardfork.BYZANTIUM;
		case "constantinople":
			return Hardfork.CONSTANTINOPLE;
		case "petersburg":
		case "constantinoplefix":
			return Hardfork.PETERSBURG;
		case "istanbul":
			return Hardfork.ISTANBUL;
		case "muirglacier":
			return Hardfork.MUIR_GLACIER;
		case "berlin":
			return Hardfork.BERLIN;
		case "london":
			return Hardfork.LONDON;
		case "arrowglacier":
			return Hardfork.ARROW_GLACIER;
		case "grayglacier":
			return Hardfork.GRAY_GLACIER;
		case "merge":
		case "paris":
			return Hardfork.MERGE;
		case "shanghai":
			return Hardfork.SHANGHAI;
		case "cancun":
			return Hardfork.CANCUN;
		case "prague":
			return Hardfork.PRAGUE;
		case "osaka":
			return Hardfork.OSAKA;
		default:
			return undefined;
	}
}
