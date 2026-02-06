/**
 * Check if hardfork has EIP-4844 (blob transactions)
 *
 * @param {import('./HardforkType.js').HardforkType} fork - Hardfork to check
 * @returns {boolean} true if blob transactions are available
 *
 * @example
 * ```typescript
 * import { CANCUN, SHANGHAI, hasEIP4844 } from './hardfork.js';
 *
 * hasEIP4844(CANCUN); // true
 * hasEIP4844(SHANGHAI); // false
 * ```
 */
export function hasEIP4844(fork: import("./HardforkType.js").HardforkType): boolean;
//# sourceMappingURL=hasEIP4844.d.ts.map