import * as Uint from "../../Uint/index.js";
import type { BrandedGasPrice } from "./BrandedGasPrice.js";

const GWEI = 1_000_000_000n;

/**
 * Create GasPrice from gwei
 *
 * @param gwei - Value in gwei
 * @returns Gas price in wei
 *
 * @example
 * ```typescript
 * const price = GasPrice.fromGwei(20); // 20 gwei = 20000000000 wei
 * ```
 */
export function fromGwei(gwei: number | bigint): BrandedGasPrice {
	const gweiValue = typeof gwei === "number" ? BigInt(gwei) : gwei;
	return Uint.from(gweiValue * GWEI) as BrandedGasPrice;
}
