import { HARDFORK_ORDER } from "./constants.js";
/**
 * Check if current hardfork is at least the specified version
 *
 * @param {import('./HardforkType.js').HardforkType} current - Current hardfork
 * @param {import('./HardforkType.js').HardforkType} target - Target hardfork to compare against
 * @returns {boolean} true if current >= target
 *
 * @example
 * ```typescript
 * import { CANCUN, SHANGHAI, isAtLeast } from './hardfork.js';
 *
 * if (isAtLeast(CANCUN, SHANGHAI)) {
 *   // PUSH0 opcode is available
 * }
 * ```
 */
export function isAtLeast(current, target) {
    return HARDFORK_ORDER.indexOf(current) >= HARDFORK_ORDER.indexOf(target);
}
