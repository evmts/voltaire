// Import internal functions
import { from as _from } from "./from.js";
import { fromRpc as _fromRpc } from "./fromRpc.js";
// Export internal functions (tree-shakeable)
export { _from, _fromRpc };
// Export public functions
export function from(params) {
    return _from(params);
}
/**
 * Convert RPC block body format to BlockBody
 */
export function fromRpc(rpc) {
    return _fromRpc(rpc);
}
// Namespace export
export const BlockBody = {
    from,
    fromRpc,
};
