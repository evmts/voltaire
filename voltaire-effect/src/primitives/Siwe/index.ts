/**
 * @module Siwe
 * @description Effect Schemas for Sign-In with Ethereum (SIWE) messages (EIP-4361).
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
 * ## Usage
 *
 * ```typescript
 * import * as Siwe from 'voltaire-effect/primitives/Siwe'
 * import * as S from 'effect/Schema'
 *
 * // Parse from string
 * const message = S.decodeSync(Siwe.String)(`example.com wants you to sign in...`)
 *
 * // Format to string
 * const text = S.encodeSync(Siwe.String)(message)
 * ```
 *
 * ## Pure Functions
 *
 * ```typescript
 * Siwe.format(message)  // string
 * Siwe.validate(message, { now })  // ValidationResult
 * Siwe.generateNonce(length)  // string
 * ```
 *
 * @since 0.1.0
 */
export {
	format,
	generateNonce,
	MessageStruct,
	Schema,
	SiweMessageSchema,
	type SiweMessageType,
	String,
	validate,
	type ValidationResult,
} from "./String.js";
