import type { Address } from "./Address.js";
import { SIZE, HEX_SIZE } from "./constants.js";
import { InvalidHexFormatError, InvalidHexStringError } from "./errors.js";

/**
 * Parse hex string to Address (standard form)
 *
 * @param hex - Hex string with 0x prefix
 * @returns Address bytes
 * @throws If invalid format or length
 *
 * @example
 * ```typescript
 * const addr = Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
 * ```
 */
export function fromHex(hex: string): Address {
  if (!hex.startsWith("0x") || hex.length !== HEX_SIZE) {
    throw new InvalidHexFormatError();
  }
  const hexPart = hex.slice(2);
  if (!/^[0-9a-fA-F]{40}$/.test(hexPart)) {
    throw new InvalidHexStringError();
  }
  const bytes = new Uint8Array(SIZE);
  for (let i = 0; i < SIZE; i++) {
    const byte = Number.parseInt(hexPart.slice(i * 2, i * 2 + 2), 16);
    bytes[i] = byte;
  }
  return bytes as Address;
}
