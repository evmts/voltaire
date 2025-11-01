/**
 * Uint (256-bit Unsigned Integer) Types and Operations
 *
 * Complete Uint256 implementation with type safety and arithmetic operations.
 *
 * @example
 * ```typescript
 * import * as Uint from './Uint.js';
 *
 * // Create values
 * const a = Uint.from(100n);
 * const b = Uint.fromHex.call("0xff");
 *
 * // Arithmetic operations
 * const sum = Uint.plus.call(a, b);
 * const diff = Uint.minus.call(a, b);
 *
 * // Conversions
 * const hex = Uint.toHex.call(sum);
 * const bytes = Uint.toBytes.call(sum);
 * ```
 */

// ============================================================================
// Core Type
// ============================================================================

const uintSymbol = Symbol("Uint256");

/**
 * 256-bit unsigned integer type
 * Using bigint as underlying representation
 */
export type Type = bigint & { __brand: typeof uintSymbol };

/**
 * Uint type alias for convenience
 */
export type Uint = Type;

// ============================================================================
// Exports
// ============================================================================

// Constants
export * from "./constants.js";

// Construction operations
export { from } from "./from.js";
export { fromHex } from "./fromHex.js";
export { fromBigInt } from "./fromBigInt.js";
export { fromNumber } from "./fromNumber.js";
export { fromBytes } from "./fromBytes.js";
export { fromAbiEncoded } from "./fromAbiEncoded.js";
export { tryFrom } from "./tryFrom.js";

// Conversion operations
export { toHex } from "./toHex.js";
export { toBigInt } from "./toBigInt.js";
export { toNumber } from "./toNumber.js";
export { toBytes } from "./toBytes.js";
export { toAbiEncoded } from "./toAbiEncoded.js";
export { toString } from "./toString.js";

// Arithmetic operations
export { plus } from "./plus.js";
export { minus } from "./minus.js";
export { times } from "./times.js";
export { dividedBy } from "./dividedBy.js";
export { modulo } from "./modulo.js";
export { toPower } from "./toPower.js";

// Bitwise operations
export { bitwiseAnd } from "./bitwiseAnd.js";
export { bitwiseOr } from "./bitwiseOr.js";
export { bitwiseXor } from "./bitwiseXor.js";
export { bitwiseNot } from "./bitwiseNot.js";
export { shiftLeft } from "./shiftLeft.js";
export { shiftRight } from "./shiftRight.js";

// Comparison operations
export { equals } from "./equals.js";
export { notEquals } from "./notEquals.js";
export { lessThan } from "./lessThan.js";
export { lessThanOrEqual } from "./lessThanOrEqual.js";
export { greaterThan } from "./greaterThan.js";
export { greaterThanOrEqual } from "./greaterThanOrEqual.js";
export { isZero } from "./isZero.js";
export { minimum } from "./minimum.js";
export { maximum } from "./maximum.js";

// Utility operations
export { isValid } from "./isValid.js";
export { bitLength } from "./bitLength.js";
export { leadingZeros } from "./leadingZeros.js";
export { popCount } from "./popCount.js";
