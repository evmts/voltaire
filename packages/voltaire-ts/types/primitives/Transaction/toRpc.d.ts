/**
 * Convert transaction to JSON-RPC format
 *
 * @param {import('./types.js').Any} tx - Transaction to convert
 * @returns {object} JSON-RPC formatted transaction
 * @throws {InvalidTransactionTypeError} If transaction type is unknown
 *
 * @example
 * ```javascript
 * import * as Transaction from './primitives/Transaction/index.js';
 * const tx = Transaction.deserialize(serialized);
 * const rpc = Transaction.toRpc(tx);
 * // { type: '0x2', chainId: '0x1', nonce: '0x0', ... }
 * ```
 */
export function toRpc(tx: import("./types.js").Any): object;
//# sourceMappingURL=toRpc.d.ts.map