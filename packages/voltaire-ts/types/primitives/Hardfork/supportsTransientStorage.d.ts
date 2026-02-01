/**
 * Check if hardfork has EIP-1153 (convenience form)
 *
 * @this {import('./HardforkType.js').HardforkType}
 * @returns {boolean} true if TLOAD/TSTORE are available
 *
 * @example
 * ```typescript
 * import { CANCUN, supportsTransientStorage } from './hardfork.js';
 *
 * supportsTransientStorage.call(CANCUN); // true
 * ```
 */
export function supportsTransientStorage(this: import("./HardforkType.js").HardforkType): boolean;
//# sourceMappingURL=supportsTransientStorage.d.ts.map