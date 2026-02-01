/**
 * Check if a contract signature is valid via EIP-1271
 *
 * Calls the contract's isValidSignature(bytes32,bytes) method and checks
 * if it returns the magic value 0x1626ba7e.
 *
 * @see https://eips.ethereum.org/EIPS/eip-1271
 * @param {Object} provider - JSON-RPC provider
 * @param {(method: string, params: unknown[]) => Promise<unknown>} provider.request - JSON-RPC request method
 * @param {import("../Address/AddressType.js").AddressType | string} contractAddress - Contract address to call
 * @param {import("../Hash/HashType.js").HashType | Uint8Array} hash - Message hash (bytes32)
 * @param {Uint8Array} signature - Signature bytes
 * @returns {Promise<boolean>} True if signature is valid
 * @throws {ContractCallError} If the contract call fails
 *
 * @example
 * ```javascript
 * import { isValidSignature } from './primitives/ContractSignature/isValidSignature.js';
 *
 * const isValid = await isValidSignature(
 *   provider,
 *   '0x1234...', // contract address
 *   messageHash,
 *   signatureBytes
 * );
 * ```
 */
export function isValidSignature(provider: {
    request: (method: string, params: unknown[]) => Promise<unknown>;
}, contractAddress: import("../Address/AddressType.js").AddressType | string, hash: import("../Hash/HashType.js").HashType | Uint8Array, signature: Uint8Array): Promise<boolean>;
//# sourceMappingURL=isValidSignature.d.ts.map