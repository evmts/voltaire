/**
 * @module from
 * @description Create Address from various input types with Effect error handling
 * @since 0.1.0
 */
import { Effect } from "effect";
import { Address, type AddressType } from "@tevm/voltaire/Address";
import type {
  InvalidAddressError,
  InvalidHexFormatError,
  InvalidAddressLengthError,
  InvalidValueError,
} from "@tevm/voltaire/Address";

type AddressError =
  | InvalidAddressError
  | InvalidHexFormatError
  | InvalidAddressLengthError
  | InvalidValueError;

/**
 * Create Address from hex string, bytes, or number
 *
 * @param value - Hex string, Uint8Array, number, or bigint
 * @returns Effect yielding AddressType or failing with AddressError
 * @example
 * ```typescript
 * import * as Address from 'voltaire-effect/primitives/Address'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Address.from('0x742d35cc6634c0532925a3b844bc9e7595f251e3')
 * const addr = await Effect.runPromise(program)
 * ```
 */
export const from = (
  value: string | Uint8Array | number | bigint,
): Effect.Effect<AddressType, AddressError> =>
  Effect.try({
    try: () => Address.from(value),
    catch: (e) => e as AddressError,
  });
