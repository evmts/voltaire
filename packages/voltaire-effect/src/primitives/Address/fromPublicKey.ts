/**
 * @module fromPublicKey
 * @description Derive Address from secp256k1 public key with Effect error handling
 * @since 0.1.0
 */
import { Effect } from "effect";
import { Address, type AddressType } from "@tevm/voltaire/Address";
import type {
  InvalidAddressLengthError,
  InvalidValueError,
} from "@tevm/voltaire/Address";

type PublicKeyError =
  | InvalidAddressLengthError
  | InvalidValueError;

/**
 * Create Address from secp256k1 public key
 *
 * @param publicKey - 64-byte uncompressed public key
 * @returns Effect yielding AddressType or failing with error
 * @example
 * ```typescript
 * const program = Address.fromPublicKey(publicKeyBytes)
 * ```
 */
export function fromPublicKey(
  publicKey: Uint8Array,
): Effect.Effect<AddressType, PublicKeyError>;

/**
 * Create Address from secp256k1 public key coordinates
 *
 * @param x - x coordinate (bigint)
 * @param y - y coordinate (bigint)
 * @returns Effect yielding AddressType or failing with error
 */
export function fromPublicKey(
  x: bigint,
  y: bigint,
): Effect.Effect<AddressType, PublicKeyError>;

export function fromPublicKey(
  xOrPublicKey: bigint | Uint8Array,
  y?: bigint,
): Effect.Effect<AddressType, PublicKeyError> {
  return Effect.try({
    try: () => {
      if (typeof xOrPublicKey === "bigint") {
        return Address.fromPublicKey(xOrPublicKey, y!);
      }
      return Address.fromPublicKey(xOrPublicKey);
    },
    catch: (e) => e as PublicKeyError,
  });
}
