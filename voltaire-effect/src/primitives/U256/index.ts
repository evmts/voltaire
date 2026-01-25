/**
 * @module U256
 * @description Effect Schemas for 256-bit unsigned integers.
 *
 * U256 is an alias for Uint256, the primary unsigned integer type in Ethereum.
 * Re-exports all functionality from the Uint module with U256 naming.
 *
 * ## Schemas
 *
 * | Schema | Input | Output |
 * |--------|-------|--------|
 * | `U256.String` | decimal string | Uint256Type |
 * | `U256.Number` | number | Uint256Type |
 * | `U256.BigInt` | bigint | Uint256Type |
 * | `U256.Hex` | hex string | Uint256Type |
 * | `U256.Bytes` | Uint8Array | Uint256Type |
 *
 * ## Usage
 *
 * ```typescript
 * import * as U256 from 'voltaire-effect/primitives/U256'
 * import * as S from 'effect/Schema'
 *
 * // Decode (parse input)
 * const value = S.decodeSync(U256.BigInt)(1000000000000000000n)
 *
 * // Encode (format output)
 * const bigint = S.encodeSync(U256.BigInt)(value)
 * const hex = S.encodeSync(U256.Hex)(value)
 * ```
 *
 * @since 0.1.0
 */

// Re-export schemas from Uint
export { BigInt } from "../Uint/BigInt.js";
export { Bytes } from "../Uint/Bytes.js";
export { Hex } from "../Uint/Hex.js";
export { Number } from "../Uint/Number.js";
export { String } from "../Uint/String.js";

// Re-export pure functions from Uint
export { bitLength } from "../Uint/bitLength.js";
export { bitwiseAnd } from "../Uint/bitwiseAnd.js";
export { bitwiseNot } from "../Uint/bitwiseNot.js";
export { bitwiseOr } from "../Uint/bitwiseOr.js";
export { bitwiseXor } from "../Uint/bitwiseXor.js";
export { clone } from "../Uint/clone.js";
export { gcd } from "../Uint/gcd.js";
export { greaterThan } from "../Uint/greaterThan.js";
export { greaterThanOrEqual } from "../Uint/greaterThanOrEqual.js";
export { isPowerOf2 } from "../Uint/isPowerOf2.js";
export { isZero } from "../Uint/isZero.js";
export { lcm } from "../Uint/lcm.js";
export { leadingZeros } from "../Uint/leadingZeros.js";
export { lessThan } from "../Uint/lessThan.js";
export { lessThanOrEqual } from "../Uint/lessThanOrEqual.js";
export { max } from "../Uint/max.js";
export { maximum } from "../Uint/maximum.js";
export { min } from "../Uint/min.js";
export { minimum } from "../Uint/minimum.js";
export { minus } from "../Uint/minus.js";
export { notEquals } from "../Uint/notEquals.js";
export { plus } from "../Uint/plus.js";
export { popCount } from "../Uint/popCount.js";
export { product } from "../Uint/product.js";
export { shiftLeft } from "../Uint/shiftLeft.js";
export { shiftRight } from "../Uint/shiftRight.js";
export { sum } from "../Uint/sum.js";
export { times } from "../Uint/times.js";
export { toAbiEncoded } from "../Uint/toAbiEncoded.js";
export { toPower } from "../Uint/toPower.js";

// Legacy schema exports with U256 naming
export {
	UintFromBytesSchema as U256FromBytesSchema,
	UintFromHexSchema as U256FromHexSchema,
	UintSchema as U256Schema,
} from "../Uint/UintSchema.js";
