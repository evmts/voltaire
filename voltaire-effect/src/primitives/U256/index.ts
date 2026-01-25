/**
 * U256 module for 256-bit unsigned integers.
 * 
 * Re-exports Uint module functionality with U256-specific naming.
 * U256 is the primary unsigned integer type used throughout Ethereum.
 * 
 * @example
 * ```typescript
 * import * as U256 from './index.js'
 * import * as Effect from 'effect/Effect'
 * 
 * const value = await Effect.runPromise(U256.from('1000000000000000000'))
 * const fromHex = await Effect.runPromise(U256.fromHex('0xde0b6b3a7640000'))
 * ```
 * 
 * @module U256
 * @since 0.0.1
 */
export {
  UintSchema as U256Schema,
  UintFromHexSchema as U256FromHexSchema,
  UintFromBytesSchema as U256FromBytesSchema
} from '../Uint/UintSchema.js'
export {
  from,
  fromHex,
  fromBytes,
  fromNumber,
  fromBigInt,
  type UintError as U256Error
} from '../Uint/from.js'
