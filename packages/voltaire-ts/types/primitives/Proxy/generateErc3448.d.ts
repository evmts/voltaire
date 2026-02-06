/**
 * Generate ERC-3448 MetaProxy bytecode with metadata
 *
 * ERC-3448 extends ERC-1167 minimal proxy by appending metadata to the bytecode.
 * Structure:
 * - 10 bytes: creation code (3d602d80600a3d3981f3)
 * - 45 bytes: runtime code (363d3d373d3d3d363d73[address]5af43d82803e903d91602b57fd5bf3)
 * - N bytes: metadata (arbitrary data)
 * - 32 bytes: metadata length as uint256 (big-endian)
 *
 * Total: 87 + N bytes
 *
 * @see https://eips.ethereum.org/EIPS/eip-3448
 * @param {Uint8Array} implementation - 20-byte implementation address
 * @param {Uint8Array} metadata - Metadata to append (arbitrary length)
 * @returns {Uint8Array} Complete MetaProxy bytecode
 */
export function generateErc3448(implementation: Uint8Array, metadata: Uint8Array): Uint8Array;
//# sourceMappingURL=generateErc3448.d.ts.map