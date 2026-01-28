/**
 * @module fromBytes
 * @description Create Address from Uint8Array with Effect error handling
 * @since 0.1.0
 */
import { Effect } from "effect";
import { Address, type AddressType, type InvalidAddressLengthError } from "@tevm/voltaire/Address";

/**
 * Create Address from 20-byte Uint8Array
 *
 * @param value - 20-byte Uint8Array
 * @returns Effect yielding AddressType or failing with InvalidAddressLengthError
 * @example
 * ```typescript
 * const program = Address.fromBytes(new Uint8Array(20))
 * ```
 */
export const fromBytes = (
  value: Uint8Array,
): Effect.Effect<AddressType, InvalidAddressLengthError> =>
  Effect.try({
    try: () => Address.fromBytes(value),
    catch: (e) => e as InvalidAddressLengthError,
  });
