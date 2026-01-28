/**
 * @module hash
 * @description Effect-wrapped ENS hash operations
 * @since 0.1.0
 */
import { Effect } from "effect";
import { Ens } from "@tevm/voltaire";

type EnsError =
  | Ens.DisallowedCharacterError
  | Ens.EmptyLabelError
  | Ens.IllegalMixtureError
  | Ens.InvalidLabelExtensionError
  | Ens.InvalidUtf8Error
  | Ens.WholeConfusableError;

/**
 * Compute namehash of ENS name (32-byte hash for contracts)
 *
 * @param name - ENS name to hash
 * @returns Effect yielding 32-byte hash
 * @example
 * ```typescript
 * const hash = await Effect.runPromise(Ens.namehash('vitalik.eth'))
 * ```
 */
export const namehash = (name: string): Effect.Effect<Uint8Array, EnsError> =>
  Effect.try({
    try: () => Ens.namehash(name),
    catch: (e) => e as EnsError,
  });

/**
 * Compute labelhash of single ENS label
 *
 * @param label - Single ENS label to hash
 * @returns Effect yielding 32-byte hash
 */
export const labelhash = (label: string): Effect.Effect<Uint8Array, EnsError> =>
  Effect.try({
    try: () => Ens.labelhash(label),
    catch: (e) => e as EnsError,
  });

// Re-export factories for advanced usage
export { Labelhash, Namehash } from "@tevm/voltaire/Ens";
