/**
 * @module ErrorSignature
 * @description Effect Schemas for Solidity error selectors.
 *
 * Error signatures are 4-byte selectors that identify Solidity custom errors.
 * Standard error selectors:
 * - Error(string): 0x08c379a0
 * - Panic(uint256): 0x4e487b71
 *
 * ## Type Declarations
 *
 * ```typescript
 * import * as ErrorSignature from 'voltaire-effect/primitives/ErrorSignature'
 *
 * function decodeRevert(errSig: ErrorSignature.ErrorSignatureType) {
 *   // ...
 * }
 * ```
 *
 * ## Schemas
 *
 * | Schema | Input | Output |
 * |--------|-------|--------|
 * | `ErrorSignature.String` | signature string | ErrorSignatureType |
 *
 * ## Usage
 *
 * ```typescript
 * import * as ErrorSignature from 'voltaire-effect/primitives/ErrorSignature'
 * import * as S from 'effect/Schema'
 *
 * // From error definition
 * const sig = S.decodeSync(ErrorSignature.String)('InsufficientBalance(uint256,uint256)')
 *
 * // To hex
 * const hex = S.encodeSync(ErrorSignature.String)(sig)
 * ```
 *
 * ## Pure Functions
 *
 * ```typescript
 * ErrorSignature.toHex(sig)  // string
 * ErrorSignature.equals(a, b)  // boolean
 * ```
 *
 * @since 0.1.0
 */
export {
	type ErrorSignatureLike,
	ErrorSignatureSchema,
	type ErrorSignatureType,
	equals,
	String,
	toHex,
} from "./String.js";
