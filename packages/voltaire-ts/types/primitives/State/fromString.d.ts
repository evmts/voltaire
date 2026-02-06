/**
 * Parse a StorageKey from its string representation
 *
 * @see https://voltaire.tevm.sh/primitives/state for State documentation
 * @since 0.0.0
 * @param {string} str - String representation from toString()
 * @returns {import('./StorageKeyType.js').StorageKeyType | undefined} Parsed StorageKey or undefined if invalid
 * @throws {never}
 * @example
 * ```javascript
 * import * as State from './primitives/State/index.js';
 * const key = State.fromString(str);
 * if (key) {
 *   // Use key
 * }
 * ```
 */
export function fromString(str: string): import("./StorageKeyType.js").StorageKeyType | undefined;
//# sourceMappingURL=fromString.d.ts.map