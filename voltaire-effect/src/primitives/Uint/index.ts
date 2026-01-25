/**
 * @fileoverview Uint module for 256-bit unsigned integers (Uint256).
 * 
 * Uint256 is the primary integer type in Ethereum, supporting values from 0 to 2^256-1
 * (115792089237316195423570985008687907853269984665640564039457584007913129639935).
 * This module provides Effect-based wrappers for safe construction and validation.
 * 
 * @description
 * The Uint module provides:
 * - Effect-based constructors that safely handle errors
 * - Schema validation for runtime type checking
 * - Multiple input formats: bigint, number, string, hex, bytes
 * - Arithmetic operations with wrapping semantics
 * - Comparison and bitwise operations
 * 
 * Range: 0 to 2^256-1
 * 
 * @example
 * ```typescript
 * import * as Uint from '@voltaire-effect/primitives/Uint'
 * import * as Effect from 'effect/Effect'
 * import * as Schema from 'effect/Schema'
 * 
 * // Using Effect-based constructors
 * const value = await Effect.runPromise(Uint.from(1000n))
 * const hex = await Effect.runPromise(Uint.fromHex('0x3e8'))
 * const bytes = await Effect.runPromise(Uint.fromBytes(new Uint8Array([3, 232])))
 * 
 * // Arithmetic (wrapping semantics)
 * const sum = Effect.runSync(Uint.plus(a, b))
 * const quotient = await Effect.runPromise(Uint.dividedBy(a, b))
 * 
 * // Using Schema for validation
 * const validated = Schema.decodeSync(Uint.UintSchema)('1000')
 * const fromHexValidated = Schema.decodeSync(Uint.UintFromHexSchema)('0x3e8')
 * ```
 * 
 * @see {@link ../U256/index.ts | U256} for an alias of this module
 * @see {@link ../Uint8/index.ts | Uint8} for 8-bit unsigned integers
 * @see {@link ../Uint16/index.ts | Uint16} for 16-bit unsigned integers
 * @see {@link ../Uint32/index.ts | Uint32} for 32-bit unsigned integers
 * @see {@link ../Uint64/index.ts | Uint64} for 64-bit unsigned integers
 * @see {@link ../Uint128/index.ts | Uint128} for 128-bit unsigned integers
 * 
 * @module Uint
 * @since 0.0.1
 */

// Schemas
export { UintSchema, UintFromHexSchema, UintFromBytesSchema } from './UintSchema.js'

// Constructors (failable)
export { from, fromHex, fromBytes, fromNumber, fromBigInt, type UintError } from './from.js'
export { fromAbiEncoded } from './fromAbiEncoded.js'

// Converters (infallible)
export { toHex } from './toHex.js'
export { toBytes } from './toBytes.js'
export { toBigInt } from './toBigInt.js'
export { toNumber } from './toNumber.js'
export { toString } from './toString.js'
export { toAbiEncoded } from './toAbiEncoded.js'
export { clone } from './clone.js'

// Arithmetic (wrapping, infallible)
export { plus } from './plus.js'
export { minus } from './minus.js'
export { times } from './times.js'
export { toPower } from './toPower.js'

// Arithmetic (failable - division by zero)
export { dividedBy } from './dividedBy.js'
export { modulo } from './modulo.js'

// Comparison (infallible)
export { equals } from './equals.js'
export { notEquals } from './notEquals.js'
export { lessThan } from './lessThan.js'
export { lessThanOrEqual } from './lessThanOrEqual.js'
export { greaterThan } from './greaterThan.js'
export { greaterThanOrEqual } from './greaterThanOrEqual.js'
export { isZero } from './isZero.js'

// Bitwise (infallible)
export { bitwiseAnd } from './bitwiseAnd.js'
export { bitwiseOr } from './bitwiseOr.js'
export { bitwiseXor } from './bitwiseXor.js'
export { bitwiseNot } from './bitwiseNot.js'
export { shiftLeft } from './shiftLeft.js'
export { shiftRight } from './shiftRight.js'

// Min/Max (infallible)
export { minimum } from './minimum.js'
export { maximum } from './maximum.js'
export { min } from './min.js'
export { max } from './max.js'

// Aggregate (infallible)
export { sum } from './sum.js'
export { product } from './product.js'

// Math utilities (infallible)
export { gcd } from './gcd.js'
export { lcm } from './lcm.js'

// Bit utilities (infallible)
export { bitLength } from './bitLength.js'
export { leadingZeros } from './leadingZeros.js'
export { popCount } from './popCount.js'
export { isPowerOf2 } from './isPowerOf2.js'
