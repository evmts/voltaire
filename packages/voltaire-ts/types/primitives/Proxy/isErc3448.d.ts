/**
 * Check if bytecode is valid ERC-3448 MetaProxy
 *
 * Validates:
 * - Minimum length (87 bytes: 55 proxy + 32 length)
 * - Creation code matches (10 bytes)
 * - Runtime code prefix matches (first 20 bytes)
 * - Runtime code suffix matches (last 15 bytes before metadata)
 * - Metadata length encoding is consistent
 *
 * @see https://eips.ethereum.org/EIPS/eip-3448
 * @param {Uint8Array} bytecode - Bytecode to validate
 * @returns {boolean} True if valid ERC-3448 MetaProxy
 */
export function isErc3448(bytecode: Uint8Array): boolean;
//# sourceMappingURL=isErc3448.d.ts.map