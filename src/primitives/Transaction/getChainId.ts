import * as Legacy from "./Legacy/getChainId.js";
import { isLegacy } from "./typeGuards.js";
import type { Any } from "./types.js";

/**
 * Get chain ID (null for pre-EIP-155 legacy transactions)
 */
export function getChainId(this: Any): bigint | null {
	if (isLegacy(this)) {
		return Legacy.getChainId.call(this as any);
	}
	return this.chainId;
}
