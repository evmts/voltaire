/**
 * @module fromHex
 * @description Create Address from hex string with Effect error handling
 * @since 0.1.0
 */
import { Effect } from "effect";
import { Address, type AddressType } from "@tevm/voltaire/Address";
import type {
  InvalidHexFormatError,
  InvalidAddressLengthError,
} from "@tevm/voltaire/Address";

type AddressError =
  | InvalidHexFormatError
  | InvalidAddressLengthError;

/**
 * Create Address from hex string
 *
 * @param value - Hex string with 0x prefix
 * @returns Effect yielding AddressType or failing with AddressError
 * @example
 * ```typescript
 * const program = Address.fromHex('0x742d35cc6634c0532925a3b844bc9e7595f251e3')
 * ```
 */
export const fromHex = (value: string): Effect.Effect<AddressType, AddressError> =>
  Effect.try({
    try: () => Address.fromHex(value),
    catch: (e) => e as AddressError,
  });
