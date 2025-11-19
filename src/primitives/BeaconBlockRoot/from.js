import { fromBytes } from "./fromBytes.js";
import { fromHex } from "./fromHex.js";

/**
 * Create BeaconBlockRoot from string or bytes
 *
 * @see https://voltaire.tevm.sh/primitives/beacon-block-root for BeaconBlockRoot documentation
 * @since 0.0.0
 * @param {string | Uint8Array} value - Hex string with optional 0x prefix or Uint8Array
 * @returns {import('./BeaconBlockRootType.js').BeaconBlockRootType} BeaconBlockRoot
 * @throws {Error} If input is invalid or wrong length
 * @example
 * ```javascript
 * import * as BeaconBlockRoot from './primitives/BeaconBlockRoot/index.js';
 * const root1 = BeaconBlockRoot.from('0x1234...');
 * const root2 = BeaconBlockRoot.from(new Uint8Array(32));
 * ```
 */
export function from(value) {
	if (typeof value === "string") {
		return fromHex(value);
	}
	return fromBytes(value);
}
