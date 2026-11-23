import type { HardforkType } from "../Hardfork/HardforkType.js";

/**
 * Canonical hardfork names and their accepted aliases
 * (`paris` = `merge`, `constantinoplefix` = `petersburg`,
 * `glamsterdam` = `amsterdam`).
 */
export type HardforkName =
	| "frontier"
	| "homestead"
	| "dao"
	| "tangerinewhistle"
	| "spuriousdragon"
	| "byzantium"
	| "constantinople"
	| "petersburg"
	| "constantinoplefix"
	| "istanbul"
	| "muirglacier"
	| "berlin"
	| "london"
	| "arrowglacier"
	| "grayglacier"
	| "merge"
	| "paris"
	| "shanghai"
	| "cancun"
	| "prague"
	| "osaka"
	| "amsterdam"
	| "glamsterdam";

/**
 * Ethereum hardfork identifier: a hardfork name or a branded
 * `Hardfork` primitive value (for example `Hardfork.OSAKA`).
 */
export type Hardfork = HardforkName | HardforkType;

/**
 * Gas configuration for hardfork-specific calculations
 */
export type Config = {
	hardfork: Hardfork;
};

/**
 * Gas cost calculation result
 */
export type CostResult = {
	base: bigint;
	dynamic: bigint;
	total: bigint;
};

/**
 * Memory expansion details
 */
export type MemoryExpansion = {
	oldCost: bigint;
	newCost: bigint;
	expansionCost: bigint;
	words: bigint;
};

/**
 * Call operation details
 */
export type CallDetails = {
	isWarm: boolean;
	hasValue: boolean;
	isNewAccount: boolean;
	gas: bigint;
};
