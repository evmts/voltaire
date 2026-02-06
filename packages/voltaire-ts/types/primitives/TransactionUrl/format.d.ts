/**
 * Format transaction request as ERC-681 URL
 *
 * @see https://eips.ethereum.org/EIPS/eip-681
 * @param {import('./TransactionUrlType.js').ParsedTransactionUrl} request - Transaction parameters
 * @returns {import('./TransactionUrlType.js').TransactionUrl} - ERC-681 formatted URL
 *
 * @example
 * ```javascript
 * import { format } from './primitives/TransactionUrl/format.js';
 *
 * const url = format({
 *   target: addressValue,
 *   chainId: 1n,
 *   value: 1000000000000000000n,
 * });
 * // 'ethereum:0x1234...@1?value=1000000000000000000'
 * ```
 */
export function format(request: import("./TransactionUrlType.js").ParsedTransactionUrl): import("./TransactionUrlType.js").TransactionUrl;
//# sourceMappingURL=format.d.ts.map