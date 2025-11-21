/**
 * ERC-681 Transaction URL Format
 *
 * @module TransactionUrl
 * @see https://eips.ethereum.org/EIPS/eip-681
 *
 * @description
 * ERC-681 defines a standard URL format for representing Ethereum transactions.
 * This enables QR codes, deep links, and wallet integrations.
 *
 * Format: `ethereum:<address>[@<chainId>][/<function>][?<params>]`
 *
 * @example
 * ```typescript
 * import * as TransactionUrl from './primitives/TransactionUrl/index.js';
 *
 * // Parse URL
 * const parsed = TransactionUrl.parse('ethereum:0x1234@1?value=1000000000000000000');
 * // { target: AddressType, chainId: 1n, value: 1000000000000000000n }
 *
 * // Format URL
 * const url = TransactionUrl.format({
 *   target: addressValue,
 *   chainId: 1n,
 *   value: 1000000000000000000n,
 * });
 * // 'ethereum:0x1234...@1?value=1000000000000000000'
 *
 * // Create branded URL
 * const brandedUrl = TransactionUrl.from('ethereum:0x1234@1');
 * ```
 */

// Export type definitions
export type {
	TransactionUrl,
	ParsedTransactionUrl,
} from "./TransactionUrlType.js";

// Export errors
export { InvalidTransactionUrlError } from "./errors.js";

// Export functions
export { parse } from "./parse.js";
export { format } from "./format.js";
export { from } from "./from.js";
