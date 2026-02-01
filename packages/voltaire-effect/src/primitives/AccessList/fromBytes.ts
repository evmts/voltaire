/**
 * @module fromBytes
 * @description Decode RLP bytes to access list with Effect error handling
 * @since 0.1.0
 */
import { Effect } from "effect";
import { AccessList, type BrandedAccessList } from "@tevm/voltaire/AccessList";
import type {
  DecodingError,
  InvalidFormatError,
  InvalidLengthError,
} from "@tevm/voltaire/errors";

type FromBytesError = DecodingError | InvalidFormatError | InvalidLengthError;

/**
 * Decode RLP bytes to access list
 *
 * @param bytes - RLP-encoded access list
 * @returns Effect yielding BrandedAccessList or failing with FromBytesError
 * @example
 * ```typescript
 * import * as AccessList from 'voltaire-effect/primitives/AccessList'
 * import * as Effect from 'effect/Effect'
 *
 * const program = AccessList.fromBytes(bytes)
 * const list = await Effect.runPromise(program)
 * ```
 */
export const fromBytes = (
  bytes: Uint8Array,
): Effect.Effect<BrandedAccessList, FromBytesError> =>
  Effect.try({
    try: () => AccessList.fromBytes(bytes),
    catch: (e) => e as FromBytesError,
  });
