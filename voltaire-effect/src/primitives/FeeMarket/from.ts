import { FeeMarket } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'
import type { FeeMarketInput, FeeMarketType } from './FeeMarketSchema.js'

/**
 * Error thrown when FeeMarket operations fail.
 * @since 0.0.1
 */
export class FeeMarketError extends Error {
  readonly _tag = 'FeeMarketError'
  constructor(message: string) {
    super(message)
    this.name = 'FeeMarketError'
  }
}

/**
 * Creates a FeeMarket state from input values.
 * @param input - The fee market input with gas parameters
 * @returns Effect containing FeeMarketType or FeeMarketError
 * @example
 * ```ts
 * import * as FeeMarket from 'voltaire-effect/primitives/FeeMarket'
 * import { Effect } from 'effect'
 *
 * const state = FeeMarket.from({
 *   gasUsed: 15000000n,
 *   gasLimit: 30000000n,
 *   baseFee: 1000000000n,
 *   excessBlobGas: 0n,
 *   blobGasUsed: 0n
 * })
 * ```
 * @since 0.0.1
 */
export const from = (input: FeeMarketInput): Effect.Effect<FeeMarketType, FeeMarketError> =>
  Effect.try({
    try: () => ({
      gasUsed: BigInt(input.gasUsed),
      gasLimit: BigInt(input.gasLimit),
      baseFee: BigInt(input.baseFee),
      excessBlobGas: BigInt(input.excessBlobGas),
      blobGasUsed: BigInt(input.blobGasUsed),
    }),
    catch: (e) => new FeeMarketError((e as Error).message)
  })

/**
 * Calculates the base fee for the next block using EIP-1559 formula.
 * @param parentGasUsed - Gas used in the parent block
 * @param parentGasLimit - Gas limit of the parent block
 * @param parentBaseFee - Base fee of the parent block
 * @returns Effect containing the calculated base fee
 * @example
 * ```ts
 * const nextBaseFee = FeeMarket.BaseFee(15000000n, 30000000n, 1000000000n)
 * ```
 * @since 0.0.1
 */
export const BaseFee = (
  parentGasUsed: bigint,
  parentGasLimit: bigint,
  parentBaseFee: bigint
): Effect.Effect<bigint, FeeMarketError> =>
  Effect.try({
    try: () => FeeMarket.BaseFee(parentGasUsed, parentGasLimit, parentBaseFee),
    catch: (e) => new FeeMarketError((e as Error).message)
  })

/**
 * Calculates the blob base fee from excess blob gas (EIP-4844).
 * @param excessBlobGas - The excess blob gas from the parent block
 * @returns Effect containing the blob base fee
 * @example
 * ```ts
 * const blobFee = FeeMarket.BlobBaseFee(393216n)
 * ```
 * @since 0.0.1
 */
export const BlobBaseFee = (excessBlobGas: bigint): Effect.Effect<bigint, FeeMarketError> =>
  Effect.try({
    try: () => FeeMarket.BlobBaseFee(excessBlobGas),
    catch: (e) => new FeeMarketError((e as Error).message)
  })

/**
 * Calculates excess blob gas for the next block.
 * @param parentExcessBlobGas - Excess blob gas from parent block
 * @param parentBlobGasUsed - Blob gas used in parent block
 * @returns Effect containing the excess blob gas
 * @example
 * ```ts
 * const excess = FeeMarket.calculateExcessBlobGas(0n, 131072n)
 * ```
 * @since 0.0.1
 */
export const calculateExcessBlobGas = (
  parentExcessBlobGas: bigint,
  parentBlobGasUsed: bigint
): Effect.Effect<bigint, never> =>
  Effect.succeed(FeeMarket.calculateExcessBlobGas(parentExcessBlobGas, parentBlobGasUsed))

/**
 * Calculates the transaction fee from gas used and effective gas price.
 * @param gasUsed - Amount of gas consumed
 * @param effectiveGasPrice - Effective price per gas unit in wei
 * @returns Effect containing the total fee in wei
 * @example
 * ```ts
 * const fee = FeeMarket.calculateTxFee(21000n, 1000000000n)
 * ```
 * @since 0.0.1
 */
export const calculateTxFee = (
  gasUsed: bigint,
  effectiveGasPrice: bigint
): Effect.Effect<bigint, never> =>
  Effect.succeed(gasUsed * effectiveGasPrice)

/**
 * Calculates the blob transaction fee.
 * @param blobGasUsed - Amount of blob gas consumed
 * @param blobBaseFee - Base fee for blob gas
 * @returns Effect containing the blob fee in wei
 * @example
 * ```ts
 * const blobFee = FeeMarket.calculateBlobTxFee(131072n, 1n)
 * ```
 * @since 0.0.1
 */
export const calculateBlobTxFee = (
  blobGasUsed: bigint,
  blobBaseFee: bigint
): Effect.Effect<bigint, never> =>
  Effect.succeed(blobGasUsed * blobBaseFee)

/**
 * Checks if a transaction can be included based on its max fee.
 * @param maxFeePerGas - Maximum fee per gas the sender is willing to pay
 * @param baseFee - Current block base fee
 * @returns Effect containing boolean indicating if tx can be included
 * @example
 * ```ts
 * const canInclude = FeeMarket.canIncludeTx(2000000000n, 1000000000n)
 * ```
 * @since 0.0.1
 */
export const canIncludeTx = (
  maxFeePerGas: bigint,
  baseFee: bigint
): Effect.Effect<boolean, never> =>
  Effect.succeed(maxFeePerGas >= baseFee)

/**
 * Computes the next fee market state after block execution.
 * @param state - Current fee market state
 * @returns Effect containing the next state
 * @example
 * ```ts
 * const next = FeeMarket.nextState(currentState)
 * ```
 * @since 0.0.1
 */
export const nextState = (state: FeeMarketType): Effect.Effect<FeeMarketType, FeeMarketError> =>
  Effect.try({
    try: () => FeeMarket.nextState(state as any) as FeeMarketType,
    catch: (e) => new FeeMarketError((e as Error).message)
  })

/**
 * Validates a fee market state for correctness.
 * @param state - Fee market state to validate
 * @returns Effect that succeeds if valid, fails with FeeMarketError otherwise
 * @example
 * ```ts
 * const validation = FeeMarket.validateState(state)
 * ```
 * @since 0.0.1
 */
export const validateState = (state: FeeMarketType): Effect.Effect<void, FeeMarketError> =>
  Effect.try({
    try: () => FeeMarket.validateState(state as any),
    catch: (e) => new FeeMarketError((e as Error).message)
  })

/**
 * Converts wei to gwei.
 * @param wei - Value in wei
 * @returns Effect containing value in gwei
 * @example
 * ```ts
 * const gwei = FeeMarket.weiToGwei(1000000000n) // 1n
 * ```
 * @since 0.0.1
 */
export const weiToGwei = (wei: bigint): Effect.Effect<bigint, never> =>
  Effect.succeed(wei / 1000000000n)

/**
 * Converts gwei to wei.
 * @param gwei - Value in gwei
 * @returns Effect containing value in wei
 * @example
 * ```ts
 * const wei = FeeMarket.gweiToWei(1n) // 1000000000n
 * ```
 * @since 0.0.1
 */
export const gweiToWei = (gwei: bigint): Effect.Effect<bigint, never> =>
  Effect.succeed(gwei * 1000000000n)

/**
 * EIP-1559 fee market constants and utilities.
 * @since 0.0.1
 */
export const Eip1559 = FeeMarket.Eip1559

/**
 * EIP-4844 blob fee market constants and utilities.
 * @since 0.0.1
 */
export const Eip4844 = FeeMarket.Eip4844
