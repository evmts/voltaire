/**
 * Check if peer supports a specific capability
 *
 * @this {import('./PeerInfoType.js').PeerInfoType}
 * @param {string} capability - Capability to check (e.g., "eth/67", "snap/1")
 * @returns {boolean} True if peer supports capability
 *
 * @example
 * ```javascript
 * import * as PeerInfo from './primitives/PeerInfo/index.js';
 * const peer = PeerInfo.from(rpcResponse);
 * const hasEth67 = PeerInfo._hasCapability.call(peer, "eth/67");
 * ```
 */
export function hasCapability(capability) {
    return this.caps.includes(capability);
}
