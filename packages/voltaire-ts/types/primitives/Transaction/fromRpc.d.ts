/**
 * @typedef {Object} RpcTransaction
 * @property {string} [type]
 * @property {string} [nonce]
 * @property {string} [gasLimit]
 * @property {string} [gas]
 * @property {string | null} [to]
 * @property {string} [value]
 * @property {string} [data]
 * @property {string} [input]
 * @property {string} [r]
 * @property {string} [s]
 * @property {string} [v]
 * @property {string} [yParity]
 * @property {string} [chainId]
 * @property {string} [gasPrice]
 * @property {string} [maxPriorityFeePerGas]
 * @property {string} [maxFeePerGas]
 * @property {string} [maxFeePerBlobGas]
 * @property {Array<{address: string, storageKeys?: string[]}>} [accessList]
 * @property {string[]} [blobVersionedHashes]
 * @property {Array<{chainId: string, address: string, nonce: string, yParity: string, r: string, s: string}>} [authorizationList]
 */
/**
 * Parse transaction from JSON-RPC format
 *
 * @param {RpcTransaction} rpc - JSON-RPC formatted transaction
 * @returns {import('./types.js').Any} Parsed transaction
 * @throws {InvalidLengthError} If address or hash length is invalid
 * @throws {InvalidTransactionTypeError} If transaction type is unknown
 *
 * @example
 * ```javascript
 * import * as Transaction from './primitives/Transaction/index.js';
 * const tx = Transaction.fromRpc({
 *   type: '0x2',
 *   chainId: '0x1',
 *   nonce: '0x0',
 *   // ...
 * });
 * ```
 */
export function fromRpc(rpc: RpcTransaction): import("./types.js").Any;
export type RpcTransaction = {
    type?: string | undefined;
    nonce?: string | undefined;
    gasLimit?: string | undefined;
    gas?: string | undefined;
    to?: string | null | undefined;
    value?: string | undefined;
    data?: string | undefined;
    input?: string | undefined;
    r?: string | undefined;
    s?: string | undefined;
    v?: string | undefined;
    yParity?: string | undefined;
    chainId?: string | undefined;
    gasPrice?: string | undefined;
    maxPriorityFeePerGas?: string | undefined;
    maxFeePerGas?: string | undefined;
    maxFeePerBlobGas?: string | undefined;
    accessList?: {
        address: string;
        storageKeys?: string[];
    }[] | undefined;
    blobVersionedHashes?: string[] | undefined;
    authorizationList?: {
        chainId: string;
        address: string;
        nonce: string;
        yParity: string;
        r: string;
        s: string;
    }[] | undefined;
};
//# sourceMappingURL=fromRpc.d.ts.map