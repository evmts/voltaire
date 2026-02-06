/**
 * Create NodeInfo from RPC response object
 *
 * @param {any} value - Node info object from admin_nodeInfo
 * @returns {import('./NodeInfoType.js').NodeInfoType} Node information
 * @throws {InvalidFormatError} If value is not a valid node info object
 *
 * @example
 * ```javascript
 * import * as NodeInfo from './primitives/NodeInfo/index.js';
 * const nodeInfo = NodeInfo.from(rpcResponse);
 * console.log(nodeInfo.name);     // "Geth/v1.10.26-stable"
 * console.log(nodeInfo.protocols.eth?.network); // NetworkId
 * ```
 */
export function from(value: any): import("./NodeInfoType.js").NodeInfoType;
//# sourceMappingURL=from.d.ts.map