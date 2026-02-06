/**
 * Parse ERC-681 transaction URL
 *
 * Format: ethereum:<address>[@<chainId>][/<function>][?<params>]
 *
 * Examples:
 * - ethereum:0x1234...
 * - ethereum:0x1234@1
 * - ethereum:0x1234@1?value=1000000000000000000
 * - ethereum:0x1234/transfer?address=0x5678&uint256=100
 *
 * Query parameters:
 * - value: wei amount (decimal or hex with 0x)
 * - gas: gas limit
 * - gasPrice: gas price in wei
 * - data: hex-encoded calldata (0x...)
 *
 * @see https://eips.ethereum.org/EIPS/eip-681
 * @param {string} url - ERC-681 URL
 * @returns {import('./TransactionUrlType.js').ParsedTransactionUrl}
 * @throws {InvalidTransactionUrlError} if URL is malformed
 *
 * @example
 * ```javascript
 * import { parse } from './primitives/TransactionUrl/parse.js';
 *
 * const parsed = parse('ethereum:0x1234...@1?value=1000000000000000000');
 * // { target: AddressType, chainId: 1n, value: 1000000000000000000n }
 * ```
 */
export function parse(url: string): import("./TransactionUrlType.js").ParsedTransactionUrl;
//# sourceMappingURL=parse.d.ts.map