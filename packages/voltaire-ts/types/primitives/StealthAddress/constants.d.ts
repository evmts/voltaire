/**
 * ERC-5564 Stealth Address Constants
 *
 * @see https://eips.ethereum.org/EIPS/eip-5564
 */
/**
 * Stealth meta-address length (66 bytes)
 * Format: spendingPubKey (33) || viewingPubKey (33)
 */
export const STEALTH_META_ADDRESS_SIZE: 66;
/**
 * Compressed public key length (33 bytes)
 * Format: 0x02/0x03 prefix + x-coordinate (32 bytes)
 */
export const COMPRESSED_PUBLIC_KEY_SIZE: 33;
/**
 * Uncompressed public key length (64 bytes)
 * Format: x-coordinate (32) || y-coordinate (32)
 */
export const UNCOMPRESSED_PUBLIC_KEY_SIZE: 64;
/**
 * Private key length (32 bytes)
 */
export const PRIVATE_KEY_SIZE: 32;
/**
 * View tag size (1 byte)
 * First byte of hashed shared secret
 */
export const VIEW_TAG_SIZE: 1;
/**
 * ERC-5564 scheme ID for SECP256k1 with view tags
 */
export const SCHEME_ID: 1;
//# sourceMappingURL=constants.d.ts.map