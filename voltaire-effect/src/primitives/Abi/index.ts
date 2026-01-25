/**
 * Abi module for encoding and decoding Ethereum ABI data.
 * Provides Effect-based wrappers around voltaire's ABI utilities.
 * 
 * @example
 * ```typescript
 * import * as Abi from 'voltaire-effect/primitives/Abi'
 * import * as Effect from 'effect/Effect'
 * 
 * const encoded = await Effect.runPromise(
 *   Abi.encodeFunctionData(abi, 'transfer', [to, amount])
 * )
 * ```
 * 
 * @since 0.0.1
 * @module
 */

export { encodeFunctionData } from './encodeFunctionData.js'
export { decodeFunctionData } from './decodeFunctionData.js'
export { decodeFunctionResult } from './decodeFunctionResult.js'
export { decodeEventLog } from './decodeEventLog.js'
export { getFunction } from './getFunction.js'
export { getEvent } from './getEvent.js'
