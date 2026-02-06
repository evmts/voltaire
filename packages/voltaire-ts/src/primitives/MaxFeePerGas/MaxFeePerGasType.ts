import type { brand } from "../../brand.js";

/**
 * Branded MaxFeePerGas type - EIP-1559 maximum fee per gas
 * Represents the maximum total gas price user is willing to pay
 * Must be >= baseFeePerGas + maxPriorityFeePerGas for inclusion
 *
 * @see https://eips.ethereum.org/EIPS/eip-1559
 */
export type MaxFeePerGasType = bigint & { readonly [brand]: "MaxFeePerGas" };
