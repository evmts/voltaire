/**
 * @module assertValid
 * @description Validate access list structure with Effect error handling
 * @since 0.1.0
 */
import { Effect } from "effect";
import { AccessList, type BrandedAccessList } from "@tevm/voltaire/AccessList";
import type {
  InvalidFormatError,
  InvalidLengthError,
} from "@tevm/voltaire/errors";

type AssertValidError = InvalidFormatError | InvalidLengthError;

/**
 * Validate access list structure
 *
 * @param list - Access list to validate
 * @returns Effect yielding void or failing with AssertValidError
 * @example
 * ```typescript
 * import * as AccessList from 'voltaire-effect/primitives/AccessList'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   yield* AccessList.assertValid(list)
 *   console.log('Valid access list')
 * })
 * ```
 */
export const assertValid = (
  list: BrandedAccessList,
): Effect.Effect<void, AssertValidError> =>
  Effect.try({
    try: () => AccessList.assertValid(list),
    catch: (e) => e as AssertValidError,
  });
