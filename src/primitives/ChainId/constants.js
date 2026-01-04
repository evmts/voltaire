// Well-known chain IDs
export const MAINNET = 1;
export const GOERLI = 5;
export const SEPOLIA = 11155111;
export const HOLESKY = 17000;
export const OPTIMISM = 10;
export const ARBITRUM = 42161;
export const BASE = 8453;
export const POLYGON = 137;

/**
 * Map of known chain IDs to their names
 * @type {ReadonlyMap<number, string>}
 */
export const KNOWN_CHAINS = new Map([
	[MAINNET, "Mainnet"],
	[GOERLI, "Goerli"],
	[SEPOLIA, "Sepolia"],
	[HOLESKY, "Holesky"],
	[OPTIMISM, "Optimism"],
	[ARBITRUM, "Arbitrum One"],
	[BASE, "Base"],
	[POLYGON, "Polygon"],
]);
