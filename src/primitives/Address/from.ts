import type { Address } from "./Address.js";
import { fromNumber } from "./fromNumber.js";
import { fromHex } from "./fromHex.js";
import { fromBytes } from "./fromBytes.js";
import { InvalidValueError } from "./errors.js";

/**
 * Create Address from various input types (universal constructor)
 *
 * @param value - Number, bigint, hex string, or Uint8Array
 * @returns Address
 * @throws {InvalidValueError} If value type is unsupported or invalid
 * @throws {InvalidHexFormatError} If hex string is invalid
 * @throws {InvalidAddressLengthError} If bytes length is not 20
 *
 * @example
 * ```typescript
 * const addr1 = Address.from(0x742d35Cc6634C0532925a3b844Bc9e7595f251e3n);
 * const addr2 = Address.from(12345);
 * const _addr3 = Address.from("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
 * const addr4 = Address.from(new Uint8Array(20));
 * ```
 */
export function from(value: number | bigint | string | Uint8Array): Address {
  if (typeof value === "number" || typeof value === "bigint") {
    return fromNumber(value);
  } else if (typeof value === "string") {
    return fromHex(value);
  } else if (value instanceof Uint8Array) {
    return fromBytes(value);
  } else {
    throw new InvalidValueError("Unsupported address value type");
  }
}
