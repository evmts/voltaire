/**
 * Ethereum hardfork identifiers
 */
export type Hardfork =
	| "homestead"
	| "byzantium"
	| "constantinople"
	| "istanbul"
	| "berlin"
	| "london"
	| "paris"
	| "shanghai"
	| "cancun";

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
