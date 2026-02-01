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
export declare function getChainId(this: Any): bigint | null;
//# sourceMappingURL=getChainId.d.ts.map