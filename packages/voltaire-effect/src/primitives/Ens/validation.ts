/**
 * @module validation
 * @description ENS validation functions
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
 * Check if value is valid ENS name (pure)
 */
export const isValid = (name: string): boolean => Ens.isValid(name);

/**
 * Type guard for EnsType
 */
export const is = (value: unknown): value is EnsType => Ens.is(value);

/**
 * Validate ENS name, throwing on error
 *
 * @param name - ENS name to validate
 * @returns Effect that succeeds if valid, fails with EnsError if invalid
 */
export const validate = (name: string): Effect.Effect<void, EnsError> =>
  Effect.try({
    try: () => Ens.validate(name),
    catch: (e) => e as EnsError,
  });
