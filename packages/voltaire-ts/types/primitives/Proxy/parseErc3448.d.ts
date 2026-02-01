/**
 * Parse ERC-3448 MetaProxy bytecode
 *
 * Extracts implementation address and metadata from ERC-3448 MetaProxy bytecode.
 * Reads last 32 bytes as metadata length, then extracts:
 * - Implementation address from bytes 20-39 (within creation code)
 * - Metadata from bytes 55 to (length - 32)
 *
 * @see https://eips.ethereum.org/EIPS/eip-3448
 * @param {Uint8Array} bytecode - MetaProxy bytecode
 * @returns {{ implementation: Uint8Array, metadata: Uint8Array } | null} Parsed components or null if invalid
 */
export function parseErc3448(bytecode: Uint8Array): {
    implementation: Uint8Array;
    metadata: Uint8Array;
} | null;
//# sourceMappingURL=parseErc3448.d.ts.map