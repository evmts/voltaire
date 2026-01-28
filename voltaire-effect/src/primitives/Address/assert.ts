/**
 * @module assert
 * @description Assert value is valid address with Effect error handling
 * @since 0.1.0
 */
import { Effect } from "effect";
import { Address, type InvalidAddressError, type InvalidChecksumError } from "@tevm/voltaire/Address";

type AssertError =
  | InvalidAddressError
  | InvalidChecksumError;

/**
 * Assert value is valid address
 *
 * @param value - Value to validate
 * @param options - Validation options
 * @param options.strict - If true, validates EIP-55 checksum
 * @returns Effect yielding void or failing with AssertError
 * @example
 * ```typescript
 * // Basic validation
 * const program = Address.assert('0x742d35cc6634c0532925a3b844bc9e7595f251e3')
 *
 * // Strict checksum validation
 * const strictProgram = Address.assert('0x742d35Cc6634C0532925a3b844Bc9e7595f251e3', { strict: true })
 * await Effect.runPromise(strictProgram)
 * ```
 */
export const assert = (
  value: string | Uint8Array,
  options?: { strict?: boolean },
): Effect.Effect<void, AssertError> =>
  Effect.try({
    try: () => { Address.assert(value, options); },
    catch: (e) => e as AssertError,
  });

/**
 * Assert value is valid address (non-strict, no checksum validation)
 *
 * @param value - Value to validate
 * @returns Effect yielding void or failing with InvalidAddressError
 */
export const assertBasic = (
  value: string | Uint8Array,
): Effect.Effect<void, InvalidAddressError> =>
  Effect.try({
    try: () => { Address.assert(value, { strict: false }); },
    catch: (e) => e as InvalidAddressError,
  });
