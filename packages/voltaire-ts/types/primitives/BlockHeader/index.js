import { calculateHash as _calculateHash } from "./calculateHash.js";
// Import internal functions
import { from as _from } from "./from.js";
import { fromRpc as _fromRpc } from "./fromRpc.js";
// Export internal functions (tree-shakeable)
export { _from, _fromRpc, _calculateHash };
// Export public functions
export function from(params) {
    return _from(params);
}
/**
 * Convert RPC block header format to BlockHeader
 */
export function fromRpc(rpc) {
    return _fromRpc(rpc);
}
// Public wrapper for calculateHash
export function calculateHash(header) {
    return _calculateHash(header);
}
// Namespace export
export const BlockHeader = {
    from,
    fromRpc,
    calculateHash,
};
