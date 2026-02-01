// Internal imports
import { createMemoryHost as _createMemoryHost } from "./createMemoryHost.js";
import { from as _from } from "./from.js";
export { createMemoryHost as _createMemoryHost } from "./createMemoryHost.js";
// Internal exports for tree-shaking
export { from as _from } from "./from.js";
/**
 * Create a Host interface implementation
 *
 * @param impl - Host implementation with state access methods
 * @returns Host instance
 * @example
 * ```typescript
 * import { Host } from 'voltaire/evm/Host';
 *
 * const host = Host({
 *   getBalance: (addr) => balances.get(addr) ?? 0n,
 *   setBalance: (addr, bal) => balances.set(addr, bal),
 *   // ... other methods
 * });
 * ```
 */
export function Host(impl) {
    return _from(impl);
}
// Attach methods to Host function
Host.from = _from;
Host.createMemoryHost = _createMemoryHost;
// Default export
export default Host;
