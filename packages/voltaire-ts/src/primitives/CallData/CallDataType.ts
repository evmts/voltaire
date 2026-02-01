import type { brand } from "../../brand.js";

/**
 * Branded CallData type for EVM transaction calldata
 *
 * CallData is a branded Uint8Array containing function selector (first 4 bytes)
 * followed by ABI-encoded parameters.
 */
export type CallDataType = Uint8Array & {
	readonly [brand]: "CallData";
};
