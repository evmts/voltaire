/**
 * Check if hardfork has EIP-1153 (transient storage)
 *
 * @param {import('./HardforkType.js').HardforkType} fork - Hardfork to check
 * @returns {boolean} true if TLOAD/TSTORE are available
 *
 * @example
 * ```typescript
 * import { CANCUN, SHANGHAI, hasEIP1153 } from './hardfork.js';
 *
 * hasEIP1153(CANCUN); // true
 * hasEIP1153(SHANGHAI); // false
 * ```
 */
export function hasEIP1153(fork: import("./HardforkType.js").HardforkType): boolean;
//# sourceMappingURL=hasEIP1153.d.ts.map