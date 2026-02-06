/**
 * @module normalize
 * @description Effect-wrapped ENS normalization
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
 * Normalize ENS name per ENSIP-15
 *
 * @param name - ENS name to normalize
 * @returns Effect yielding normalized EnsType
 * @example
 * ```typescript
 * const normalized = await Effect.runPromise(Ens.normalize('Vitalik.ETH'))
 * // 'vitalik.eth'
 * ```
 */
export const normalize = (name: string): Effect.Effect<EnsType, EnsError> =>
  Effect.try({
    try: () => Ens.normalize(name),
    catch: (e) => e as EnsError,
  });

/**
 * Beautify ENS name for display
 *
 * @param name - ENS name to beautify
 * @returns Effect yielding beautified EnsType
 */
export const beautify = (name: string): Effect.Effect<EnsType, EnsError> =>
  Effect.try({
    try: () => Ens.beautify(name),
    catch: (e) => e as EnsError,
  });
