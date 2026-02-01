/**
 * Type guard to check if a value is a valid StorageKey
 *
 * @see https://voltaire.tevm.sh/primitives/state for State documentation
 * @since 0.0.0
 * @param {unknown} value - Value to check
 * @returns {value is import('./StorageKeyType.js').StorageKeyType} True if value is a valid StorageKey
 * @throws {never}
 * @example
 * ```javascript
 * import * as State from './primitives/State/index.js';
 * const key = { address: addr, slot: 0n };
 * if (State.is(key)) {
 *   // key is StorageKey
 * }
 * ```
 */
export function is(value: unknown): value is import("./StorageKeyType.js").StorageKeyType;
//# sourceMappingURL=is.d.ts.map