import type { brand } from "../../brand.js";
/**
 * Branded EffectiveGasPrice type - EIP-1559 effective gas price
 * Represents the actual gas price paid in a transaction
 * Calculated as: min(baseFee + priorityFee, maxFeePerGas)
 *
 * @see https://eips.ethereum.org/EIPS/eip-1559
 */
export type EffectiveGasPriceType = bigint & {
    readonly [brand]: "EffectiveGasPrice";
};
//# sourceMappingURL=EffectiveGasPriceType.d.ts.map