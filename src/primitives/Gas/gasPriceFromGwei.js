import * as Uint from "../Uint/index.js";

const GWEI = 1_000_000_000n;

/**
 * Create GasPrice from gwei
 *
 * @param {number | bigint} gwei - Value in gwei
 * @returns {import('./GasPriceType.js').GasPriceType} Gas price in wei
 *
 * @example
 * ```typescript
 * const price = GasPrice.fromGwei(20); // 20 gwei = 20000000000 wei
 * ```
 */
export function gasPriceFromGwei(gwei) {
	const gweiValue = typeof gwei === "number" ? BigInt(gwei) : gwei;
	return /** @type {import('./GasPriceType.js').GasPriceType} */ (/** @type {unknown} */ (Uint.from(gweiValue * GWEI)));
}
