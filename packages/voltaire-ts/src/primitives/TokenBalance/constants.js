/**
 * Maximum TokenBalance value (2^256 - 1)
 */
export const MAX = (1n << 256n) - 1n;

/**
 * Minimum TokenBalance value (0)
 */
export const MIN = 0n;

/**
 * Common decimal counts for ERC-20 tokens
 */
export const DECIMALS = {
	ETH: 18,
	WETH: 18,
	USDC: 6,
	USDT: 6,
	DAI: 18,
	WBTC: 8,
};
