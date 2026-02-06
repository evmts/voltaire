/**
 * @module fromPrivateKey
 * @description Derive Address from secp256k1 private key with Effect error handling
 * @since 0.1.0
 */
import { Effect } from "effect";
import { Address, type AddressType, type InvalidValueError } from "@tevm/voltaire/Address";

/**
 * Create Address from secp256k1 private key
 *
 * @param value - 32-byte private key
 * @returns Effect yielding AddressType or failing with InvalidValueError
 * @example
 * ```typescript
 * const program = Address.fromPrivateKey(privateKeyBytes)
 * ```
 */
export const fromPrivateKey = (
  value: Uint8Array,
): Effect.Effect<AddressType, InvalidValueError> =>
  Effect.try({
    try: () => Address.fromPrivateKey(value),
    catch: (e) => e as InvalidValueError,
  });
