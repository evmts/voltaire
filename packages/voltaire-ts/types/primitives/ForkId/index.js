// Import all functions
import { from } from "./from.js";
import { matches as _matches } from "./matches.js";
import { toBytes as _toBytes } from "./toBytes.js";
// Export constructors
export { from };
// Export public wrapper functions
export function toBytes(forkId) {
    return _toBytes(from(forkId));
}
export function matches(local, remote) {
    return _matches(from(local), from(remote));
}
// Export internal functions (tree-shakeable)
export { _toBytes, _matches };
// Export as namespace (convenience)
export const ForkId = {
    from,
    toBytes,
    matches,
};
