/**
 * @fileoverview Effect-based constructor functions for Gas primitive.
 * @module Gas/from
 * @since 0.0.1
 */

import { Uint } from '@tevm/voltaire'
import type { GasType } from './GasSchema.js'
import type { UintError } from '../Uint/from.js'
import * as Effect from 'effect/Effect'

/**
 * Creates a Gas value from a numeric input.
 *
 * @description
 * Constructs a branded Gas value within an Effect context, allowing for
 * proper error handling. Gas values must be non-negative and represent
 * computational units in the EVM.
 *
 * Common gas values:
 * - 21000: Simple ETH transfer
 * - 32000: Contract creation base cost
 * - ~100,000-500,000: Typical contract interactions
 *
 * @param value - Gas amount as bigint, number, or string
 * @returns Effect yielding GasType on success, or UintError on failure
 *
 * @throws {UintError} When value cannot be converted to a valid gas amount
 * @throws {UintError} When value is negative
 *
 * @example
 * ```typescript
 * import * as Gas from 'voltaire-effect/primitives/Gas'
 * import { Effect } from 'effect'
 *
 * // Create gas for a simple transfer
 * const transferGas = Gas.from(21000n)
 *
 * // Run synchronously
 * const gas = Effect.runSync(transferGas)
 *
 * // Parse from string (e.g., from user input)
 * const gasFromString = Gas.from('21000')
 *
 * // Handle errors in pipeline
 * import { pipe } from 'effect'
 * const result = pipe(
 *   Gas.from(userInput),
 *   Effect.map(gas => ({ gasLimit: gas })),
 *   Effect.catchTag('UintError', () => Effect.succeed({ gasLimit: 21000n }))
 * )
 * ```
 *
 * @see {@link GasSchema} for schema-based validation
 * @see {@link GasEstimate} for pre-execution estimates
 * @since 0.0.1
 */
export const from = (value: bigint | number | string): Effect.Effect<GasType, UintError> =>
  Effect.try({
    try: () => Uint.from(value) as unknown as GasType,
    catch: (e) => e as UintError
  })
