/**
 * Convert BeaconBlockRoot to hex string
 *
 * @see https://voltaire.tevm.sh/primitives/beacon-block-root for BeaconBlockRoot documentation
 * @since 0.0.0
 * @param {import('./BeaconBlockRootType.js').BeaconBlockRootType} root - BeaconBlockRoot
 * @returns {import('../Hex/HexType.js').HexType} Hex string with 0x prefix
 * @throws {never}
 * @example
 * ```javascript
 * import * as BeaconBlockRoot from './primitives/BeaconBlockRoot/index.js';
 * const root = BeaconBlockRoot.from(new Uint8Array(32));
 * const hex = BeaconBlockRoot.toHex(root); // "0x0000..."
 * ```
 */
export function toHex(root: import("./BeaconBlockRootType.js").BeaconBlockRootType): import("../Hex/HexType.js").HexType;
//# sourceMappingURL=toHex.d.ts.map