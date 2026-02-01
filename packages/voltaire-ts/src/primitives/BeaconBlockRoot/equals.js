/**
 * Check if BeaconBlockRoot values are equal
 *
 * @see https://voltaire.tevm.sh/primitives/beacon-block-root for BeaconBlockRoot documentation
 * @since 0.0.0
 * @param {import('./BeaconBlockRootType.js').BeaconBlockRootType} a - First root
 * @param {import('./BeaconBlockRootType.js').BeaconBlockRootType} b - Second root
 * @returns {boolean} true if equal
 * @throws {never}
 * @example
 * ```javascript
 * import * as BeaconBlockRoot from './primitives/BeaconBlockRoot/index.js';
 * const a = BeaconBlockRoot.from('0x1234...');
 * const b = BeaconBlockRoot.from('0x1234...');
 * const result = BeaconBlockRoot.equals(a, b); // true
 * ```
 */
export function equals(a, b) {
	if (a.length !== b.length) return false;
	for (let i = 0; i < a.length; i++) {
		if (a[i] !== b[i]) return false;
	}
	return true;
}
