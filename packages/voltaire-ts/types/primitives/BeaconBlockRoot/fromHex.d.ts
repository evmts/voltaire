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
export function fromHex(hex: string): import("./BeaconBlockRootType.js").BeaconBlockRootType;
//# sourceMappingURL=fromHex.d.ts.map