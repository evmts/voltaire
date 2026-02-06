/**
 * Clone a Bytes32 value
 *
 * @see https://voltaire.tevm.sh/primitives/bytes/bytes32 for documentation
 * @since 0.0.0
 * @param {import('./Bytes32Type.js').Bytes32Type} bytes - Value to clone
 * @returns {import('./Bytes32Type.js').Bytes32Type} Cloned value
 * @example
 * ```javascript
 * import * as Bytes32 from './primitives/Bytes/Bytes32/index.js';
 * const cloned = Bytes32.clone(bytes);
 * ```
 */
export function clone(bytes) {
	return /** @type {import('./Bytes32Type.js').Bytes32Type} */ (
		new Uint8Array(bytes)
	);
}
