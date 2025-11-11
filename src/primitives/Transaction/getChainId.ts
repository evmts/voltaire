import * as Legacy from "./Legacy/getChainId.js";
import { isLegacy } from "./typeGuards.js";
import type { Any } from "./types.js";

/**
 * Get chain ID (null for pre-EIP-155 legacy transactions).
 *
 * @see https://voltaire.tevm.sh/primitives/transaction for Transaction documentation
 * @since 0.0.0
 * @returns Chain ID or null for pre-EIP-155
 * @throws {never} Never throws
 * @example
 * ```javascript
 * import { getChainId } from './primitives/Transaction/getChainId.js';
 * const chainId = getChainId.call(tx);
 * ```
 */
export function getChainId(this: Any): bigint | null {
	if (isLegacy(this)) {
		return Legacy.getChainId.call(this as any);
	}
	return this.chainId;
}
