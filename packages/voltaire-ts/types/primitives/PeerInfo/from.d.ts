/**
 * Create PeerInfo from RPC response object
 *
 * @param {any} value - Peer info object from admin_peers
 * @returns {import('./PeerInfoType.js').PeerInfoType} Peer information
 * @throws {InvalidFormatError} If value is not a valid peer info object
 *
 * @example
 * ```javascript
 * import * as PeerInfo from './primitives/PeerInfo/index.js';
 * const peers = rpcResponse.map(peer => PeerInfo.from(peer));
 * peers.forEach(peer => {
 *   console.log(peer.name);
 *   console.log(peer.network.inbound);
 * });
 * ```
 */
export function from(value: any): import("./PeerInfoType.js").PeerInfoType;
//# sourceMappingURL=from.d.ts.map