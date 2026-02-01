/**
 * @module Siwe
 * @description Effect Schemas and functions for Sign-In with Ethereum (SIWE) messages (EIP-4361).
 *
 * ## Type Declarations
 *
 * ```typescript
 * import * as Siwe from 'voltaire-effect/primitives/Siwe'
 *
 * function verifySiwe(message: Siwe.SiweMessageType) {
 *   // ...
 * }
 * ```
 *
 * ## Schemas
 *
 * | Schema | Input | Output |
 * |--------|-------|--------|
 * | `Siwe.String` | SIWE message string | SiweMessageType |
 * | `Siwe.MessageStruct` | SIWE message object | validated object |
 *
 * ## Constructors (Effect-wrapped)
 *
 * ```typescript
 * Siwe.create(params) // Effect<SiweMessageType, Error>
 * Siwe.parse(text)    // Effect<SiweMessageType, Error>
 * ```
 *
 * ## Verification (Effect-wrapped)
 *
 * ```typescript
 * Siwe.verify(message, signature)       // Effect<boolean, Error>
 * Siwe.verifyMessage(msg, sig, opts)    // Effect<ValidationResult, Error>
 * Siwe.getMessageHash(message)          // Effect<Uint8Array, Error>
 * ```
 *
 * ## Pure Functions
 *
 * ```typescript
 * Siwe.format(message)            // string
 * Siwe.validate(message, opts)    // ValidationResult
 * Siwe.generateNonce(length)      // string
 * ```
 *
 * @example
 * ```typescript
 * import * as Siwe from 'voltaire-effect/primitives/Siwe'
 * import { Effect } from 'effect'
 *
 * const program = Effect.gen(function* () {
 *   const message = yield* Siwe.create({
 *     domain: 'example.com',
 *     address: '0x...',
 *     uri: 'https://example.com',
 *     chainId: 1,
 *   })
 *   const text = Siwe.format(message)
 *   const hash = yield* Siwe.getMessageHash(message)
 *   return { message, text, hash }
 * })
 * ```
 *
 * @since 0.1.0
 */

// Types
export type { SiweMessageType, ValidationResult } from "./String.js";
export type { Signature } from "@tevm/voltaire/Siwe";

// Errors (re-export from voltaire)
export {
  InvalidFieldError,
  InvalidNonceLengthError,
  InvalidSiweMessageError,
  MissingFieldError,
  SiweParseError,
} from "@tevm/voltaire/Siwe";

// Schemas
export { MessageStruct, Schema, SiweMessageSchema, String } from "./String.js";

// Constructors (Effect-wrapped)
export { create } from "./create.js";
export { parse } from "./parse.js";

// Verification (Effect-wrapped)
export { verify, verifyMessage } from "./verify.js";
export { getMessageHash, GetMessageHash, Verify, VerifyMessage } from "./hash.js";

// Pure Functions (re-export)
export { format, generateNonce, validate } from "./String.js";
