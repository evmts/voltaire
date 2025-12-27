import { fromBytes } from "./fromBytes.js";

/**
 * Generate random hex of specified size
 *
 * @see https://voltaire.tevm.sh/primitives/hex for Hex documentation
 * @since 0.0.0
 * @param {number} size - Size in bytes
 * @returns {import('./HexType.js').HexType} Random hex string
 * @throws {never}
 * @example
 * ```javascript
 * import * as Hex from './primitives/Hex/index.js';
 * const hex = Hex.random(32); // Random 32-byte hex
 * ```
 */
export function random(size) {
	const bytes = new Uint8Array(size);
	crypto.getRandomValues(bytes);
	return fromBytes(bytes);
}
