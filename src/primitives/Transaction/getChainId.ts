import { isLegacy } from "./typeGuards.js";
import type { Any } from "./types.js";
import * as Legacy from "./Legacy/getChainId.js";

/**
 * Get chain ID (null for pre-EIP-155 legacy transactions)
 */
export function getChainId(tx: Any): bigint | null {
	if (isLegacy(tx)) {
		return Legacy.getChainId.call(tx);
	}
	return tx.chainId;
}
