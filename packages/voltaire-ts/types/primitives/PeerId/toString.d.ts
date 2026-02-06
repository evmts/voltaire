/**
 * Convert PeerId to string (identity function for branded type)
 *
 * @this {import('./PeerIdType.js').PeerIdType}
 * @returns {string} Peer ID as string
 *
 * @example
 * ```javascript
 * import * as PeerId from './primitives/PeerId/index.js';
 * const peerId = PeerId.from("enode://pubkey@192.168.1.1:30303");
 * const str = PeerId._toString.call(peerId);
 * ```
 */
export function toString(this: import("./PeerIdType.js").PeerIdType): string;
//# sourceMappingURL=toString.d.ts.map