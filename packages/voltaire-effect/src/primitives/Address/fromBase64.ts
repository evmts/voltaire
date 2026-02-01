/**
 * @module fromBase64
 * @description Create Address from base64 string with Effect error handling
 * @since 0.1.0
 */
import { Effect } from "effect";
import { Address, type AddressType, type InvalidAddressLengthError } from "@tevm/voltaire/Address";

/**
 * Create Address from base64 encoded string
 *
 * @param value - Base64 string (must decode to 20 bytes)
 * @returns Effect yielding AddressType or failing with InvalidAddressLengthError
 * @example
 * ```typescript
 * const program = Address.fromBase64('dC01zGY0wFMpJaO4RLyeZV8lHuM=')
 * ```
 */
export const fromBase64 = (
  value: string,
): Effect.Effect<AddressType, InvalidAddressLengthError> =>
  Effect.try({
    try: () => Address.fromBase64(value),
    catch: (e) => e as InvalidAddressLengthError,
  });
