/**
 * C API sizes (in bytes)
 */
export const SIZES = {
  /** Address size in bytes */
  ADDRESS: 20,
  /** Hash size in bytes */
  HASH: 32,
  /** U256 size in bytes */
  U256: 32,
  /** Address hex string length (with 0x prefix) */
  ADDRESS_HEX: 42,
  /** Hash hex string length (with 0x prefix) */
  HASH_HEX: 66,
  /** U256 hex string max length (with 0x prefix) */
  U256_HEX: 66,
} as const;
