import * as Hex from "../Hex/index.js";
import { SIZE } from "./BeaconBlockRootType.js";
import { fromBytes } from "./fromBytes.js";
/**
 * Create BeaconBlockRoot from hex string
 *
 * @see https://voltaire.tevm.sh/primitives/beacon-block-root for BeaconBlockRoot documentation
 * @since 0.0.0
 * @param {string} hex - Hex string with optional 0x prefix
 * @returns {import('./BeaconBlockRootType.js').BeaconBlockRootType} BeaconBlockRoot
 * @throws {Error} If hex string is invalid or wrong length
 * @example
 * ```javascript
 * import * as BeaconBlockRoot from './primitives/BeaconBlockRoot/index.js';
 * const root = BeaconBlockRoot.fromHex('0x1234...');
 * ```
 */
export function fromHex(hex) {
    const bytes = Hex.toBytes(hex);
    if (bytes.length !== SIZE) {
        throw new Error(`BeaconBlockRoot hex must be ${SIZE * 2} characters (excluding 0x), got ${hex.length - 2}`);
    }
    return fromBytes(bytes);
}
