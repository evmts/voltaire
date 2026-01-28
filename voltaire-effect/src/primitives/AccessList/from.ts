/**
 * @module from
 * @description Create AccessList from array or bytes with Effect error handling
 * @since 0.1.0
 */
import { Effect } from "effect";
import {
  AccessList,
  type BrandedAccessList,
  type Item,
} from "@tevm/voltaire/AccessList";
import type {
  InvalidFormatError,
  InvalidLengthError,
} from "@tevm/voltaire/errors";

type AccessListError = InvalidFormatError | InvalidLengthError;

/**
 * Create AccessList from array or bytes
 *
 * @param value - AccessList items or RLP bytes
 * @returns Effect yielding BrandedAccessList or failing with AccessListError
 * @example
 * ```typescript
 * import * as AccessList from 'voltaire-effect/primitives/AccessList'
 * import * as Effect from 'effect/Effect'
 *
 * const program = AccessList.from([{ address, storageKeys: [] }])
 * const list = await Effect.runPromise(program)
 * ```
 */
export const from = (
  value: readonly Item[] | Uint8Array,
): Effect.Effect<BrandedAccessList, AccessListError> =>
  Effect.try({
    try: () => AccessList.from(value),
    catch: (e) => e as AccessListError,
  });
