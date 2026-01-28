/**
 * @module from
 * @description Effect-wrapped ENS constructor
 * @since 0.1.0
 */
import { Effect } from "effect";
import { Ens } from "@tevm/voltaire";
import type { EnsType } from "./String.js";

type EnsError =
  | Ens.DisallowedCharacterError
  | Ens.EmptyLabelError
  | Ens.IllegalMixtureError
  | Ens.InvalidLabelExtensionError
  | Ens.InvalidUtf8Error
  | Ens.WholeConfusableError;

/**
 * Create ENS name from string
 *
 * @param name - ENS name string
 * @returns Effect yielding EnsType or failing with EnsError
 * @example
 * ```typescript
 * const ens = await Effect.runPromise(Ens.from('vitalik.eth'))
 * ```
 */
export const from = (name: string): Effect.Effect<EnsType, EnsError> =>
  Effect.try({
    try: () => Ens.from(name),
    catch: (e) => e as EnsError,
  });
