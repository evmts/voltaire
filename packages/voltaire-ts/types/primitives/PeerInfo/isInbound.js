/**
 * Check if peer connection is inbound
 *
 * @this {import('./PeerInfoType.js').PeerInfoType}
 * @returns {boolean} True if inbound connection
 *
 * @example
 * ```javascript
 * import * as PeerInfo from './primitives/PeerInfo/index.js';
 * const peer = PeerInfo.from(rpcResponse);
 * const inbound = PeerInfo._isInbound.call(peer);
 * ```
 */
export function isInbound() {
    return this.network.inbound;
}
