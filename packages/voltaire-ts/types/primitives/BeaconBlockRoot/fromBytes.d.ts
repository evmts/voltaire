/**
 * Create BeaconBlockRoot from Uint8Array
 *
 * @see https://voltaire.tevm.sh/primitives/beacon-block-root for BeaconBlockRoot documentation
 * @since 0.0.0
 * @param {Uint8Array} bytes - 32-byte Uint8Array
 * @returns {import('./BeaconBlockRootType.js').BeaconBlockRootType} BeaconBlockRoot
 * @throws {Error} If bytes length is not 32
 * @example
 * ```javascript
 * import * as BeaconBlockRoot from './primitives/BeaconBlockRoot/index.js';
 * const root = BeaconBlockRoot.fromBytes(new Uint8Array(32));
 * ```
 */
export function fromBytes(bytes: Uint8Array): import("./BeaconBlockRootType.js").BeaconBlockRootType;
//# sourceMappingURL=fromBytes.d.ts.map