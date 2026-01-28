/**
 * @module Hardfork
 * @description Ethereum hardfork constants and utilities.
 *
 * Hardforks represent protocol upgrades that change EVM behavior, gas costs,
 * or add new features.
 *
 * ## Type Declarations
 *
 * ```typescript
 * import * as Hardfork from 'voltaire-effect/primitives/Hardfork'
 *
 * function checkFeatures(fork: Hardfork.HardforkType) {
 *   // ...
 * }
 * ```
 *
 * ## Constants
 *
 * ```typescript
 * Hardfork.FRONTIER          // Original launch (July 2015)
 * Hardfork.HOMESTEAD         // First planned hardfork
 * Hardfork.BYZANTIUM         // Added REVERT, RETURNDATASIZE, etc.
 * Hardfork.CONSTANTINOPLE    // Added CREATE2, shift opcodes
 * Hardfork.ISTANBUL          // EIP-2200: Rebalanced SSTORE
 * Hardfork.BERLIN            // EIP-2929: Cold/warm access
 * Hardfork.LONDON            // EIP-1559: Base fee
 * Hardfork.MERGE             // Proof of Stake transition
 * Hardfork.SHANGHAI          // EIP-3855: PUSH0
 * Hardfork.CANCUN            // EIP-4844: Blobs, EIP-1153: TLOAD/TSTORE
 * Hardfork.PRAGUE            // EIP-2537: BLS12-381
 * ```
 *
 * ## Pure Functions
 *
 * ```typescript
 * // Parsing
 * Hardfork.fromString(name)           // HardforkType | undefined
 * Hardfork.toString(fork)             // string
 * Hardfork.isValidName(name)          // boolean
 *
 * // Listing
 * Hardfork.allIds()                   // HardforkType[]
 * Hardfork.allNames()                 // string[]
 * Hardfork.range(start, end)          // HardforkType[]
 *
 * // Comparison
 * Hardfork.compare(a, b)              // -1 | 0 | 1
 * Hardfork.equals(a, b)               // boolean
 * Hardfork.gt(a, b)                   // boolean
 * Hardfork.gte(a, b)                  // boolean
 * Hardfork.lt(a, b)                   // boolean
 * Hardfork.lte(a, b)                  // boolean
 * Hardfork.isAfter(fork, min)         // boolean
 * Hardfork.isAtLeast(fork, min)       // boolean
 * Hardfork.isBefore(fork, max)        // boolean
 * Hardfork.min(forks)                 // HardforkType
 * Hardfork.max(forks)                 // HardforkType
 *
 * // Feature checks
 * Hardfork.hasEIP1153(fork)           // boolean (transient storage)
 * Hardfork.hasEIP1559(fork)           // boolean (fee market)
 * Hardfork.hasEIP3855(fork)           // boolean (PUSH0)
 * Hardfork.hasEIP4844(fork)           // boolean (blobs)
 * Hardfork.supportsBlobs(fork)        // boolean
 * Hardfork.supportsEIP1559(fork)      // boolean
 * Hardfork.supportsPUSH0(fork)        // boolean
 * Hardfork.supportsTransientStorage(fork) // boolean
 * Hardfork.isPoS(fork)                // boolean
 * Hardfork.isPostMerge(fork)          // boolean
 * ```
 *
 * @example
 * ```typescript
 * import * as Hardfork from 'voltaire-effect/primitives/Hardfork'
 *
 * const fork = Hardfork.CANCUN
 *
 * if (Hardfork.supportsBlobs(fork)) {
 *   console.log('Blob transactions supported!')
 * }
 *
 * if (Hardfork.isAtLeast(fork, Hardfork.SHANGHAI)) {
 *   console.log('PUSH0 available')
 * }
 * ```
 *
 * @since 0.1.0
 */

// Re-export type
export type { HardforkType } from "@tevm/voltaire/Hardfork";

// Schema
export { HardforkSchema } from "./HardforkSchema.js";

// Parsing
export { fromString } from "./fromString.js";
export { toString } from "./toString.js";
export { isValidName } from "./isValidName.js";

// Listing
export { allIds } from "./allIds.js";
export { allNames } from "./allNames.js";
export { range } from "./range.js";

// Comparison
export { compare } from "./compare.js";
export { equals } from "./equals.js";
export { gt, gte, lt, lte, isAfter, isAtLeast, isBefore } from "./comparisons.js";
export { min, max } from "./minMax.js";

// Feature checks
export {
	hasEIP1153,
	hasEIP1559,
	hasEIP3855,
	hasEIP4844,
	supportsBlobs,
	supportsEIP1559,
	supportsPUSH0,
	supportsTransientStorage,
	isPoS,
	isPostMerge,
} from "./features.js";

// Constants
export {
	FRONTIER,
	HOMESTEAD,
	DAO,
	TANGERINE_WHISTLE,
	SPURIOUS_DRAGON,
	BYZANTIUM,
	CONSTANTINOPLE,
	PETERSBURG,
	ISTANBUL,
	MUIR_GLACIER,
	BERLIN,
	LONDON,
	ARROW_GLACIER,
	GRAY_GLACIER,
	MERGE,
	SHANGHAI,
	CANCUN,
	PRAGUE,
	OSAKA,
	DEFAULT,
} from "@tevm/voltaire/Hardfork";
