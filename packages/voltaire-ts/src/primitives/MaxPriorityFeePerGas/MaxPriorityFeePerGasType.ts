import type { brand } from "../../brand.js";

/**
 * Branded MaxPriorityFeePerGas type - EIP-1559 maximum priority fee (tip)
 * Represents the maximum tip user is willing to pay to miner/validator
 * Incentivizes transaction inclusion in blocks
 *
 * @see https://eips.ethereum.org/EIPS/eip-1559
 */
export type MaxPriorityFeePerGasType = bigint & {
	readonly [brand]: "MaxPriorityFeePerGas";
};
