/**
 * Hex (Hexadecimal) Types and Utilities
 *
 * Complete hex encoding/decoding with type safety.
 * All types namespaced under Hex for intuitive access.
 *
 * @example
 * ```typescript
 * import { Hex } from './hex.js';
 *
 * // Types
 * const hex: Hex = '0x1234';
 * const sized: Hex.Sized<4> = '0x12345678';
 *
 * // Operations - all use this: pattern
 * const bytes = Hex.toBytes.call(hex);
 * const newHex = Hex.fromBytes(bytes);
 * const size = Hex.size.call(hex);
 * ```
 */

// ============================================================================
// Core Types
// ============================================================================

/**
 * Hex string with 0x prefix (unsized)
 */
export type Unsized = `0x${string}`;

/**
 * Hex string with specific byte size
 * @example Hex.Sized<4> = '0x12345678' (4 bytes = 8 hex chars)
 */
export type Sized<TSize extends number = number> = `0x${string}` & {
	readonly size: TSize;
};

/**
 * Hex string of exactly N bytes
 */
export type Bytes<N extends number> = Sized<N>;

/**
 * Hex string type (unsized)
 *
 * Uses TypeScript declaration merging - Hex is both a namespace and a type.
 */
export type Hex = Unsized;

// ============================================================================
// Exports
// ============================================================================

// Errors
export * from "./errors.js";

// Validation operations
export { isHex } from "./isHex.js";
export { isSized } from "./isSized.js";
export { validate } from "./validate.js";
export { assertSize } from "./assertSize.js";

// Conversion operations
export { fromBytes } from "./fromBytes.js";
export { toBytes } from "./toBytes.js";
export { fromNumber } from "./fromNumber.js";
export { toNumber } from "./toNumber.js";
export { fromBigInt } from "./fromBigInt.js";
export { toBigInt } from "./toBigInt.js";
export { fromString } from "./fromString.js";
export { toString } from "./toString.js";
export { fromBoolean } from "./fromBoolean.js";
export { toBoolean } from "./toBoolean.js";

// Size operations
export { size } from "./size.js";

// Manipulation operations
export { concat } from "./concat.js";
export { slice } from "./slice.js";
export { pad } from "./pad.js";
export { padRight } from "./padRight.js";
export { trim } from "./trim.js";

// Comparison operations
export { equals } from "./equals.js";

// Bitwise operations
export { xor } from "./xor.js";

// Utility operations
export { random } from "./random.js";
export { zero } from "./zero.js";
