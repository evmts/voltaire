/**
 * Get protocol information by name
 *
 * @this {import('./NodeInfoType.js').NodeInfoType}
 * @param {string} protocolName - Protocol name (e.g., "eth", "snap")
 * @returns {unknown | undefined} Protocol information or undefined
 *
 * @example
 * ```javascript
 * import * as NodeInfo from './primitives/NodeInfo/index.js';
 * const nodeInfo = NodeInfo.from(rpcResponse);
 * const ethProtocol = NodeInfo._getProtocol.call(nodeInfo, "eth");
 * console.log(ethProtocol?.network); // NetworkId
 * ```
 */
export function getProtocol(protocolName) {
    return this.protocols[protocolName];
}
