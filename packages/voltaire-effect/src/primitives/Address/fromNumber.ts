/**
 * @module fromNumber
 * @description Create Address from number or bigint with Effect error handling
 * @since 0.1.0
 */
import { Effect } from "effect";
import { Address, type AddressType, type InvalidValueError } from "@tevm/voltaire/Address";

/**
 * Create Address from number or bigint
 *
 * @param value - Number or bigint (will be left-padded to 20 bytes)
 * @returns Effect yielding AddressType or failing with InvalidValueError
 * @example
 * ```typescript
 * const program = Address.fromNumber(1n) // 0x0000...0001
 * ```
 */
export const fromNumber = (
  value: number | bigint,
): Effect.Effect<AddressType, InvalidValueError> =>
  Effect.try({
    try: () => Address.fromNumber(value),
    catch: (e) => e as InvalidValueError,
  });
