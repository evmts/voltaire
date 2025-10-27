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
	/** Original Ethereum launch (July 2015) */
	FRONTIER = 0,
	/** First planned hardfork (March 2016) */
	HOMESTEAD = 1,
	/** Emergency fork for DAO hack (July 2016) */
	DAO = 2,
	/** Gas repricing fork (October 2016) */
	TANGERINE_WHISTLE = 3,
	/** State cleaning fork (November 2016) */
	SPURIOUS_DRAGON = 4,
	/** Major feature fork (October 2017) */
	BYZANTIUM = 5,
	/** Efficiency improvements (February 2019) */
	CONSTANTINOPLE = 6,
	/** Quick fix fork (February 2019) */
	PETERSBURG = 7,
	/** Gas optimization fork (December 2019) */
	ISTANBUL = 8,
	/** Difficulty bomb delay (January 2020) */
	MUIR_GLACIER = 9,
	/** Access list fork (April 2021) */
	BERLIN = 10,
	/** Fee market reform (August 2021) */
	LONDON = 11,
	/** Difficulty bomb delay (December 2021) */
	ARROW_GLACIER = 12,
	/** Difficulty bomb delay (June 2022) */
	GRAY_GLACIER = 13,
	/** Proof of Stake transition (September 2022) */
	MERGE = 14,
	/** Withdrawals support (April 2023) */
	SHANGHAI = 15,
	/** Proto-danksharding (March 2024) */
	CANCUN = 16,
	/** BLS12-381 precompiles (TBD) */
	PRAGUE = 17,
	/** ModExp improvements (TBD) */
	OSAKA = 18,
}

/**
 * Check if a hardfork is at least a certain version
 *
 * @param current - Current hardfork
 * @param required - Required minimum hardfork
 * @returns true if current >= required
 */
export function isAtLeast(current: Hardfork, required: Hardfork): boolean {
	return current >= required;
}

/**
 * Get hardfork name as string
 *
 * @param fork - Hardfork enum value
 * @returns Hardfork name
 */
export function hardforkName(fork: Hardfork): string {
	return Hardfork[fork];
}
