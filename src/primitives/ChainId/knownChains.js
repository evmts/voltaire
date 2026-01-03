import {
	MAINNET,
	GOERLI,
	SEPOLIA,
	HOLESKY,
	OPTIMISM,
	ARBITRUM,
	BASE,
	POLYGON,
} from "./constants.js";

/**
 * Set of known/supported chain IDs
 * @type {Set<number>}
 */
export const KNOWN_CHAINS = new Set([
	MAINNET,
	GOERLI,
	SEPOLIA,
	HOLESKY,
	OPTIMISM,
	ARBITRUM,
	BASE,
	POLYGON,
]);

/**
 * Map of chain IDs to human-readable names
 * @type {Map<number, string>}
 */
export const CHAIN_NAMES = new Map([
	[MAINNET, "Mainnet"],
	[GOERLI, "Goerli"],
	[SEPOLIA, "Sepolia"],
	[HOLESKY, "Holesky"],
	[OPTIMISM, "Optimism"],
	[ARBITRUM, "Arbitrum One"],
	[BASE, "Base"],
	[POLYGON, "Polygon"],
]);
