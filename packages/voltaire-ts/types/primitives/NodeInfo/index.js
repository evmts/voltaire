// Import all functions
import { from } from "./from.js";
import { getProtocol as _getProtocol } from "./getProtocol.js";
// Export constructors
export { from };
// Export public wrapper functions
// biome-ignore lint/suspicious/noExplicitAny: accepts any RPC response shape
export function getProtocol(nodeInfo, protocolName) {
    const node = from(nodeInfo);
    return _getProtocol.call(node, protocolName);
}
// Export internal functions (tree-shakeable)
export { _getProtocol };
// Export as namespace (convenience)
export const NodeInfo = {
    from,
    getProtocol,
};
