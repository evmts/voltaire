/**
 * @fileoverview U256 module for 256-bit unsigned integers.
 * 
 * Re-exports Uint module functionality with U256-specific naming.
 * U256 is the primary unsigned integer type used throughout Ethereum,
 * representing values from 0 to 2^256-1.
 * 
 * @description
 * The U256 module is an alias for the Uint module, providing the same
 * functionality with naming that matches Ethereum/Solidity conventions.
 * 
 * Features:
 * - Effect-based constructors that safely handle errors
 * - Schema validation for runtime type checking
 * - Multiple input formats: bigint, number, string, hex, bytes
 * - Arithmetic operations with wrapping semantics
 * - Comparison and bitwise operations
 * 
 * Range: 0 to 2^256-1 (115792089237316195423570985008687907853269984665640564039457584007913129639935)
 * 
 * This is the same as Solidity's `uint256` type and is used for:
 * - Token amounts (wei, gwei, etc.)
 * - Storage values
 * - Balances
 * - General-purpose large integers
 * 
 * @example
 * ```typescript
 * import * as U256 from '@voltaire-effect/primitives/U256'
 * import * as Effect from 'effect/Effect'
 * import * as Schema from 'effect/Schema'
 * 
 * // Using Effect-based constructors
 * const value = await Effect.runPromise(U256.from('1000000000000000000'))
 * const fromHex = await Effect.runPromise(U256.fromHex('0xde0b6b3a7640000'))
 * 
 * // Arithmetic
 * const sum = Effect.runSync(U256.plus(a, b))
 * const quotient = await Effect.runPromise(U256.dividedBy(a, b))
 * 
 * // Using Schema for validation
 * const validated = Schema.decodeSync(U256.U256Schema)('1000')
 * const fromHexValidated = Schema.decodeSync(U256.U256FromHexSchema)('0x3e8')
 * 
 * // Common Ethereum values
 * const oneEther = await Effect.runPromise(U256.from(10n ** 18n))
 * const oneGwei = await Effect.runPromise(U256.from(10n ** 9n))
 * ```
 * 
 * @see {@link ../Uint/index.ts | Uint} for the underlying implementation
 * @see {@link ../Uint8/index.ts | Uint8} for 8-bit unsigned integers
 * @see {@link ../Uint16/index.ts | Uint16} for 16-bit unsigned integers
 * @see {@link ../Uint32/index.ts | Uint32} for 32-bit unsigned integers
 * @see {@link ../Uint64/index.ts | Uint64} for 64-bit unsigned integers
 * @see {@link ../Uint128/index.ts | Uint128} for 128-bit unsigned integers
 * 
 * @module U256
 * @since 0.0.1
 */

// Schemas with U256 naming
export {
  UintSchema as U256Schema,
  UintFromHexSchema as U256FromHexSchema,
  UintFromBytesSchema as U256FromBytesSchema
} from '../Uint/UintSchema.js'

// Constructors (failable)
export {
  from,
  fromHex,
  fromBytes,
  fromNumber,
  fromBigInt,
  type UintError as U256Error
} from '../Uint/from.js'
export { fromAbiEncoded } from '../Uint/fromAbiEncoded.js'

// Converters (infallible)
export { toHex } from '../Uint/toHex.js'
export { toBytes } from '../Uint/toBytes.js'
export { toBigInt } from '../Uint/toBigInt.js'
export { toNumber } from '../Uint/toNumber.js'
export { toString } from '../Uint/toString.js'
export { toAbiEncoded } from '../Uint/toAbiEncoded.js'
export { clone } from '../Uint/clone.js'

// Arithmetic (wrapping, infallible)
export { plus } from '../Uint/plus.js'
export { minus } from '../Uint/minus.js'
export { times } from '../Uint/times.js'
export { toPower } from '../Uint/toPower.js'

// Arithmetic (failable - division by zero)
export { dividedBy } from '../Uint/dividedBy.js'
export { modulo } from '../Uint/modulo.js'

// Comparison (infallible)
export { equals } from '../Uint/equals.js'
export { notEquals } from '../Uint/notEquals.js'
export { lessThan } from '../Uint/lessThan.js'
export { lessThanOrEqual } from '../Uint/lessThanOrEqual.js'
export { greaterThan } from '../Uint/greaterThan.js'
export { greaterThanOrEqual } from '../Uint/greaterThanOrEqual.js'
export { isZero } from '../Uint/isZero.js'

// Bitwise (infallible)
export { bitwiseAnd } from '../Uint/bitwiseAnd.js'
export { bitwiseOr } from '../Uint/bitwiseOr.js'
export { bitwiseXor } from '../Uint/bitwiseXor.js'
export { bitwiseNot } from '../Uint/bitwiseNot.js'
export { shiftLeft } from '../Uint/shiftLeft.js'
export { shiftRight } from '../Uint/shiftRight.js'

// Min/Max (infallible)
export { minimum } from '../Uint/minimum.js'
export { maximum } from '../Uint/maximum.js'
export { min } from '../Uint/min.js'
export { max } from '../Uint/max.js'

// Aggregate (infallible)
export { sum } from '../Uint/sum.js'
export { product } from '../Uint/product.js'

// Math utilities (infallible)
export { gcd } from '../Uint/gcd.js'
export { lcm } from '../Uint/lcm.js'

// Bit utilities (infallible)
export { bitLength } from '../Uint/bitLength.js'
export { leadingZeros } from '../Uint/leadingZeros.js'
export { popCount } from '../Uint/popCount.js'
export { isPowerOf2 } from '../Uint/isPowerOf2.js'
