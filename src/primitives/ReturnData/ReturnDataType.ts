import type { brand } from "../../brand.js";

/**
 * ReturnData - Raw bytes returned from contract call
 *
 * Branded Uint8Array representing uninterpreted return data from
 * contract execution. Can be decoded using ABI specifications.
 */
export type ReturnDataType = Uint8Array & {
	readonly [brand]: "ReturnData";
};
