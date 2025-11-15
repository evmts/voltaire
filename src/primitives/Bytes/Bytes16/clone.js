/**
 * Clone a Bytes16 value
 *
 * @see https://voltaire.tevm.sh/primitives/bytes/bytes16 for documentation
 * @since 0.0.0
 * @param {import('./Bytes16Type.ts').Bytes16Type} bytes - Value to clone
 * @returns {import('./Bytes16Type.ts').Bytes16Type} Cloned value
 * @example
 * ```javascript
 * import * as Bytes16 from './primitives/Bytes/Bytes16/index.js';
 * const cloned = Bytes16.clone(bytes);
 * ```
 */
export function clone(bytes) {
	return /** @type {import('./Bytes16Type.ts').Bytes16Type} */ (
		new Uint8Array(bytes)
	);
}
