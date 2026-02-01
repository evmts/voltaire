/**
 * Check if chain ID is a known/recognized chain
 *
 * @param {import('./ChainIdType.js').ChainIdType} chainId - Chain ID to check
 * @returns {boolean} True if chain ID is recognized
 *
 * @example
 * ```typescript
 * import * as ChainId from '@voltaire/primitives/ChainId';
 *
 * ChainId.isKnownChain(ChainId.from(1)); // true (Mainnet)
 * ChainId.isKnownChain(ChainId.from(999999)); // false
 * ```
 */
export function isKnownChain(chainId: import("./ChainIdType.js").ChainIdType): boolean;
//# sourceMappingURL=isKnownChain.d.ts.map