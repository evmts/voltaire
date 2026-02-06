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
 * Convert RPC block format to Block
 *
 * Use this to parse JSON-RPC responses from eth_getBlockByNumber or eth_getBlockByHash.
 * Handles conversion of all hex-encoded strings to native types.
 */
export function fromRpc(rpc) {
    return _fromRpc(rpc);
}
// Public wrapper for calculateHash
export function calculateHash(block) {
    return _calculateHash(block);
}
// Namespace export
export const Block = {
    from,
    fromRpc,
    calculateHash,
};
