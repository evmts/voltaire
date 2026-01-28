/**
 * @module Hex
 * @description Effect wrappers for Ethereum hex strings.
 *
 * ## Type Declarations
 *
 * ```typescript
 * import * as Hex from 'voltaire-effect/primitives/Hex'
 *
 * function processData(data: Hex.HexType) {
 *   // ...
 * }
 * ```
 *
 * ## Schemas
 *
 * | Schema | Input | Output |
 * |--------|-------|--------|
 * | `Hex.String` | string | HexType |
 * | `Hex.Bytes` | Uint8Array | HexType |
 *
 * ## API Design
 *
 * This module follows Effect best practices:
 *
 * ### Direct Return (Infallible Operations)
 * - `clone(hex)` - HexType
 * - `equals(a, b)` - boolean
 * - `isHex(str)` - boolean
 * - `isSized(hex, size)` - boolean
 * - `zero(size)` - HexType
 * - `random(size)` - HexType
 * - `fromBoolean(bool)` - Sized<1>
 * - `fromString(str)` - HexType
 * - `trim(hex)` - HexType
 * - `size(hex)` - number
 * - `toBigInt(hex)` - bigint
 *
 * ### Effect Return (Fallible Operations)
 * - `from(value)` - Effect<HexType, InvalidFormatError>
 * - `fromBigInt(value, size?)` - Effect<HexType, NegativeNumberError>
 * - `fromNumber(value, size?)` - Effect<HexType, NegativeNumberError | NonIntegerError>
 * - `toBoolean(hex)` - Effect<boolean, InvalidBooleanHexError>
 * - `toNumber(hex)` - Effect<number, UnsafeIntegerError>
 * - `toStringHex(hex)` - Effect<string, InvalidFormatError>
 * - `concat(...hexes)` - Effect<HexType, InvalidFormatError>
 * - `pad(hex, size)` - Effect<HexType, SizeExceededError | InvalidSizeError>
 * - `padRight(hex, size)` - Effect<HexType, InvalidSizeError>
 * - `slice(hex, start, end?)` - Effect<HexType, InvalidSizeError>
 * - `validate(value)` - Effect<HexType, InvalidFormatError>
 * - `xor(hex, other)` - Effect<HexType, InvalidLengthError>
 * - `assertSize(hex, size)` - Effect<Sized<T>, InvalidLengthError>
 *
 * @since 0.1.0
 */

export type { Hex as HexBrand, HexType, Sized } from "@tevm/voltaire/Hex";

// Re-export error types for typed error handling
export {
	InvalidBooleanHexError,
	InvalidCharacterError,
	InvalidFormatError,
	InvalidHexCharacterError,
	InvalidHexFormatError,
	InvalidHexLengthError,
	InvalidLengthError,
	InvalidSizeError,
	NegativeNumberError,
	NonIntegerError,
	OddLengthError,
	OddLengthHexError,
	SizeExceededError,
	UnsafeIntegerError,
} from "@tevm/voltaire/Hex";

// Re-export direct conversion functions from voltaire for convenience
export { fromBytes, toBytes } from "@tevm/voltaire/Hex";

// Re-export the Hex namespace constructor
export { Hex } from "@tevm/voltaire/Hex";

// Schemas
export { Bytes } from "./Bytes.js";
export { String } from "./String.js";

// Pure functions (infallible)
export { clone } from "./clone.js";
export { equals } from "./equals.js";
export { fromBoolean } from "./fromBoolean.js";
export { fromString } from "./fromString.js";
export { isHex } from "./isHex.js";
export { isSized } from "./isSized.js";
export { random } from "./random.js";
export { size } from "./size.js";
export { toBigInt } from "./toBigInt.js";
export { trim } from "./trim.js";
export { zero } from "./zero.js";

// Effect-returning functions (fallible)
export { assertSize } from "./assertSize.js";
export { concat } from "./concat.js";
export { from } from "./from.js";
export { fromBigInt } from "./fromBigInt.js";
export { fromNumber } from "./fromNumber.js";
export { pad } from "./pad.js";
export { padRight } from "./padRight.js";
export { slice } from "./slice.js";
export { toBoolean } from "./toBoolean.js";
export { toNumber } from "./toNumber.js";
export { toStringHex } from "./toStringHex.js";
export { validate } from "./validate.js";
export { xor } from "./xor.js";
