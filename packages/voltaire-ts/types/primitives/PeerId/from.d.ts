/**
 * Create PeerId from string
 *
 * @param {string} value - Peer ID string (enode URL or node ID)
 * @returns {import('./PeerIdType.js').PeerIdType} Branded peer ID
 * @throws {InvalidFormatError} If value is not a valid peer ID
 *
 * @example
 * ```javascript
 * import * as PeerId from './primitives/PeerId/index.js';
 * const peerId = PeerId.from("enode://pubkey@192.168.1.1:30303");
 * ```
 */
export function from(value: string): import("./PeerIdType.js").PeerIdType;
//# sourceMappingURL=from.d.ts.map