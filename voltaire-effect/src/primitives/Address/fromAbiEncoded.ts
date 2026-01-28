/**
 * @module fromAbiEncoded
 * @description Create Address from ABI-encoded bytes with Effect error handling
 * @since 0.1.0
 */
import { Effect } from "effect";
import { Address, type AddressType } from "@tevm/voltaire/Address";
import type {
  InvalidAddressLengthError,
  InvalidAbiEncodedPaddingError,
} from "@tevm/voltaire/Address";

type AbiEncodedError =
  | InvalidAddressLengthError
  | InvalidAbiEncodedPaddingError;

/**
 * Create Address from ABI-encoded bytes (32 bytes, left-padded)
 *
 * @param value - 32-byte ABI-encoded address
 * @returns Effect yielding AddressType or failing with error
 * @example
 * ```typescript
 * const abiEncoded = new Uint8Array(32)
 * abiEncoded.set(addressBytes, 12) // left-pad with 12 zeros
 * const program = Address.fromAbiEncoded(abiEncoded)
 * ```
 */
export const fromAbiEncoded = (
  value: Uint8Array,
): Effect.Effect<AddressType, AbiEncodedError> =>
  Effect.try({
    try: () => Address.fromAbiEncoded(value),
    catch: (e) => e as AbiEncodedError,
  });
