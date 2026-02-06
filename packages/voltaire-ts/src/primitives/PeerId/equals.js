/**
 * Compare two PeerIds for equality
 *
 * @this {import('./PeerIdType.js').PeerIdType}
 * @param {import('./PeerIdType.js').PeerIdType} other - Peer ID to compare
 * @returns {boolean} True if equal
 *
 * @example
 * ```javascript
 * import * as PeerId from './primitives/PeerId/index.js';
 * const a = PeerId.from("enode://abc@192.168.1.1:30303");
 * const b = PeerId.from("enode://abc@192.168.1.1:30303");
 * const equal = PeerId._equals.call(a, b); // true
 * ```
 */
export function equals(other) {
	return this === other;
}
