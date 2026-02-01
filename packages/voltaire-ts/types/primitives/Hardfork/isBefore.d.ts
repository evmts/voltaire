/**
 * Check if current hardfork is before the specified version
 *
 * @param {import('./HardforkType.js').HardforkType} current - Current hardfork
 * @param {import('./HardforkType.js').HardforkType} target - Target hardfork to compare against
 * @returns {boolean} true if current < target
 *
 * @example
 * ```typescript
 * import { BERLIN, LONDON, isBefore } from './hardfork.js';
 *
 * if (isBefore(BERLIN, LONDON)) {
 *   // EIP-1559 not available yet
 * }
 * ```
 */
export function isBefore(current: import("./HardforkType.js").HardforkType, target: import("./HardforkType.js").HardforkType): boolean;
//# sourceMappingURL=isBefore.d.ts.map