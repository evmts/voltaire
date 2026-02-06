/**
 * Parse hardfork from string name (case-insensitive)
 * Supports both standard names and common variations
 *
 * @see https://voltaire.tevm.sh/primitives/hardfork for Hardfork documentation
 * @since 0.0.0
 * @param {string} name - Hardfork name (e.g., "Cancun", ">=Berlin")
 * @returns {import('./HardforkType.js').HardforkType | undefined} Hardfork or undefined if invalid
 * @throws {never}
 * @example
 * ```javascript
 * import * as Hardfork from './primitives/Hardfork/index.js';
 *
 * const fork = Hardfork.fromString("cancun"); // CANCUN
 * const fork2 = Hardfork.fromString("Paris"); // MERGE
 * const invalid = Hardfork.fromString("unknown"); // undefined
 * ```
 */
export function fromString(name: string): import("./HardforkType.js").HardforkType | undefined;
//# sourceMappingURL=fromString.d.ts.map