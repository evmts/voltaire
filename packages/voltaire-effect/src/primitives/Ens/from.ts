/**
 * @module from
 * @description Effect-wrapped ENS constructor
 * @since 0.1.0
 */
import { Effect } from "effect";
import { Ens } from "@tevm/voltaire";
import { ValidationError } from "@tevm/voltaire/errors";
import type { EnsType } from "./String.js";

/**
 * Create ENS name from string
 *
 * @param name - ENS name string
 * @returns Effect yielding EnsType or failing with ValidationError
 * @example
 * ```typescript
 * const ens = await Effect.runPromise(Ens.from('vitalik.eth'))
 * ```
 */
export const from = (name: string): Effect.Effect<EnsType, ValidationError> =>
  Effect.try({
    try: () => Ens.from(name),
    catch: (error) =>
      new ValidationError(
        error instanceof Error ? error.message : "Invalid ENS name",
        {
          value: name,
          expected: "valid ENS name (e.g., vitalik.eth)",
          cause: error instanceof Error ? error : undefined,
        },
      ),
  });
