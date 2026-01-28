/**
 * @module Ens
 * @description Effect-based operations for Ethereum Name Service names.
 *
 * ## Type Declarations
 *
 * ```typescript
 * import * as Ens from 'voltaire-effect/primitives/Ens'
 *
 * function resolveEns(name: Ens.EnsType) {
 *   // ...
 * }
 * ```
 *
 * ## Schemas
 *
 * | Schema | Input | Output |
 * |--------|-------|--------|
 * | `Ens.EnsSchema` | string | EnsType |
 *
 * ## Constructors (Effect-wrapped)
 *
 * ```typescript
 * Ens.from(name)    // Effect<EnsType, EnsError>
 * ```
 *
 * ## Normalization (Effect-wrapped)
 *
 * ```typescript
 * Ens.normalize(name) // Effect<EnsType, EnsError>
 * Ens.beautify(name)  // Effect<EnsType, EnsError>
 * ```
 *
 * ## Hashing (Effect-wrapped)
 *
 * ```typescript
 * Ens.namehash(name)  // Effect<Uint8Array, EnsError>
 * Ens.labelhash(label) // Effect<Uint8Array, EnsError>
 * ```
 *
 * ## Validation
 *
 * ```typescript
 * Ens.isValid(name)   // boolean (pure)
 * Ens.is(value)       // type guard (pure)
 * Ens.validate(name)  // Effect<void, EnsError>
 * ```
 *
 * ## Conversion (Pure)
 *
 * ```typescript
 * Ens.toString(ens)   // string
 * ```
 *
 * @example
 * ```typescript
 * import * as Ens from 'voltaire-effect/primitives/Ens'
 * import { Effect } from 'effect'
 *
 * const program = Effect.gen(function* () {
 *   yield* Ens.validate('vitalik.eth')
 *   const normalized = yield* Ens.normalize('VITALIK.eth')
 *   const hash = yield* Ens.namehash(normalized)
 *   return { name: normalized, hash }
 * })
 * ```
 *
 * @since 0.0.1
 */

// Types
export type { EnsType } from "./String.js";

// Errors (re-export from voltaire)
export {
  DisallowedCharacterError,
  EmptyLabelError,
  IllegalMixtureError,
  InvalidLabelExtensionError,
  InvalidUtf8Error,
  WholeConfusableError,
} from "@tevm/voltaire/Ens";

// Schemas
export { EnsSchema } from "./String.js";

// Constructors (Effect-wrapped)
export { from } from "./from.js";

// Normalization (Effect-wrapped)
export { normalize, beautify } from "./normalize.js";

// Hashing (Effect-wrapped)
export { namehash, labelhash, Labelhash, Namehash } from "./hash.js";

// Validation
export { isValid, is, validate } from "./validation.js";

// Conversion (Pure)
export { toString } from "./convert.js";
