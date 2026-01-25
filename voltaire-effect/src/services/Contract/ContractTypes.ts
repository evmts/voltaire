/**
 * @fileoverview Contract type definitions for type-safe contract interactions.
 * 
 * @module ContractTypes
 * @since 0.0.1
 * 
 * @description
 * Defines types for ABI handling, contract instances, and contract operations.
 * Used by the Contract factory to create type-safe contract bindings.
 * 
 * Main types:
 * - {@link Abi} - Full ABI definition
 * - {@link AbiItem} - Single ABI entry
 * - {@link ContractInstance} - Type-safe contract binding
 * - {@link EventFilter} - Event query parameters
 * - {@link DecodedEvent} - Decoded event log
 * 
 * Error types:
 * - {@link ContractError} - Base contract error
 * - {@link ContractCallError} - Read operation error
 * - {@link ContractWriteError} - Write operation error
 * - {@link ContractEventError} - Event query error
 * 
 * @see {@link Contract} - Factory function using these types
 */

import { BrandedAddress, BrandedHex } from '@tevm/voltaire'

type AddressType = BrandedAddress.AddressType
type HexType = BrandedHex.HexType

/**
 * Single item in an ABI definition.
 * 
 * @description
 * Can be a function, event, error, constructor, or fallback.
 * This is a simplified ABI item type for basic usage.
 * 
 * @since 0.0.1
 */
export type AbiItem = {
  /** Item type (function, event, error, constructor, fallback, receive) */
  readonly type: string
  /** Item name (undefined for constructor/fallback/receive) */
  readonly name?: string
  /** Input parameters for functions/events/errors */
  readonly inputs?: readonly { type: string; name?: string; indexed?: boolean }[]
  /** Output parameters for functions */
  readonly outputs?: readonly { type: string; name?: string }[]
  /** Function state mutability (pure, view, nonpayable, payable) */
  readonly stateMutability?: string
  /** Whether event is anonymous */
  readonly anonymous?: boolean
}

/**
 * Full ABI definition as an array of items.
 * 
 * @description
 * Standard Solidity ABI format as produced by solc.
 * Used to create type-safe contract instances.
 * 
 * @since 0.0.1
 * 
 * @example
 * ```typescript
 * const erc20Abi: Abi = [
 *   { type: 'function', name: 'balanceOf', inputs: [{ type: 'address' }], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
 *   { type: 'function', name: 'transfer', inputs: [{ type: 'address' }, { type: 'uint256' }], outputs: [{ type: 'bool' }], stateMutability: 'nonpayable' },
 *   { type: 'event', name: 'Transfer', inputs: [{ type: 'address', indexed: true }, { type: 'address', indexed: true }, { type: 'uint256' }] }
 * ] as const
 * ```
 */
export type Abi = readonly AbiItem[]
import type * as Effect from 'effect/Effect'
import type { WalletClientService } from '../WalletClient/index.js'

/**
 * Block identifier for event filtering.
 * Can be a named tag or a block number.
 * @since 0.0.1
 */
export type BlockTag = 'latest' | 'earliest' | 'pending' | 'safe' | 'finalized' | bigint

/**
 * Filter options for querying contract events.
 * @since 0.0.1
 */
export interface EventFilter {
  /** Start block for the query */
  readonly fromBlock?: BlockTag
  /** End block for the query */
  readonly toBlock?: BlockTag
  /** Indexed argument filters */
  readonly args?: Record<string, unknown>
}

/**
 * Decoded event from a contract log.
 * @since 0.0.1
 */
export interface DecodedEvent {
  /** Name of the event */
  readonly eventName: string
  /** Decoded event arguments */
  readonly args: Record<string, unknown>
  /** Block number where the event was emitted */
  readonly blockNumber: bigint
  /** Transaction hash that emitted the event */
  readonly transactionHash: HexType
  /** Log index within the block */
  readonly logIndex: number
}

/**
 * Base error class for contract operations.
 * @since 0.0.1
 */
export class ContractError extends Error {
  readonly _tag: string = 'ContractError'
  override readonly name: string = 'ContractError'
  /**
   * Creates a new ContractError.
   * @param message - Human-readable error message
   * @param cause - Optional underlying error that caused this failure
   */
  constructor(message: string, readonly cause?: Error) {
    super(message, cause ? { cause } : undefined)
  }
}

/**
 * Error thrown when a contract read call fails.
 * @since 0.0.1
 */
export class ContractCallError extends ContractError {
  override readonly _tag = 'ContractCallError'
  override readonly name = 'ContractCallError'
  /**
   * Creates a new ContractCallError.
   * @param message - Human-readable error message
   * @param cause - Optional underlying error that caused this failure
   */
  constructor(message: string, cause?: Error) {
    super(message, cause)
  }
}

/**
 * Error thrown when a contract write transaction fails.
 * @since 0.0.1
 */
export class ContractWriteError extends ContractError {
  override readonly _tag = 'ContractWriteError'
  override readonly name = 'ContractWriteError'
  /**
   * Creates a new ContractWriteError.
   * @param message - Human-readable error message
   * @param cause - Optional underlying error that caused this failure
   */
  constructor(message: string, cause?: Error) {
    super(message, cause)
  }
}

/**
 * Error thrown when fetching contract events fails.
 * @since 0.0.1
 */
export class ContractEventError extends ContractError {
  override readonly _tag = 'ContractEventError'
  override readonly name = 'ContractEventError'
  /**
   * Creates a new ContractEventError.
   * @param message - Human-readable error message
   * @param cause - Optional underlying error that caused this failure
   */
  constructor(message: string, cause?: Error) {
    super(message, cause)
  }
}

/**
 * Type-safe contract instance with read, write, simulate, and event methods.
 * @since 0.0.1
 */
export interface ContractInstance<TAbi extends Abi> {
  /** Contract address */
  readonly address: AddressType
  /** Contract ABI */
  readonly abi: TAbi
  /** Read-only contract methods (view/pure functions) */
  readonly read: ContractReadMethods<TAbi>
  /** State-changing contract methods */
  readonly write: ContractWriteMethods<TAbi>
  /** Simulate state-changing methods without sending transactions */
  readonly simulate: ContractSimulateMethods<TAbi>
  /** Query contract events */
  readonly getEvents: <E extends ExtractEventNames<TAbi>>(
    eventName: E,
    filter?: EventFilter
  ) => Effect.Effect<DecodedEvent[], ContractEventError>
}

type ExtractViewFunctions<TAbi extends Abi> = Extract<
  TAbi[number],
  { type: 'function'; stateMutability: 'view' | 'pure' }
>

type ExtractWriteFunctions<TAbi extends Abi> = Extract<
  TAbi[number],
  { type: 'function'; stateMutability: 'nonpayable' | 'payable' }
>

type ExtractEvents<TAbi extends Abi> = Extract<
  TAbi[number],
  { type: 'event' }
>

type ExtractEventNames<TAbi extends Abi> = ExtractEvents<TAbi> extends { name: infer N } 
  ? N extends string ? N : never 
  : never

type AbiInputsToArgs<TInputs extends readonly { type: string; name?: string }[]> = {
  [K in keyof TInputs]: AbiTypeToTs<TInputs[K]['type']>
}

type AbiTypeToTs<T extends string> = 
  T extends `uint${string}` ? bigint :
  T extends `int${string}` ? bigint :
  T extends 'address' ? AddressType :
  T extends 'bool' ? boolean :
  T extends 'string' ? string :
  T extends `bytes${string}` ? HexType :
  T extends 'bytes' ? HexType :
  T extends `${string}[]` ? readonly unknown[] :
  T extends `tuple` ? Record<string, unknown> :
  unknown

type AbiOutputToTs<TOutputs extends readonly { type: string }[]> = 
  TOutputs extends readonly [{ type: infer T }] 
    ? T extends string ? AbiTypeToTs<T> : unknown
    : TOutputs extends readonly [] 
      ? void
      : Record<string, unknown>

type ContractReadMethods<TAbi extends Abi> = {
  [F in ExtractViewFunctions<TAbi> as F['name'] extends string ? F['name'] : never]: (
    ...args: F extends { inputs: infer I } 
      ? I extends readonly { type: string }[] 
        ? AbiInputsToArgs<I>
        : []
      : []
  ) => Effect.Effect<
    F extends { outputs: infer O } 
      ? O extends readonly { type: string }[] 
        ? AbiOutputToTs<O>
        : unknown
      : unknown,
    ContractCallError
  >
}

type ContractWriteMethods<TAbi extends Abi> = {
  [F in ExtractWriteFunctions<TAbi> as F['name'] extends string ? F['name'] : never]: (
    ...args: F extends { inputs: infer I } 
      ? I extends readonly { type: string }[] 
        ? AbiInputsToArgs<I>
        : []
      : []
  ) => Effect.Effect<HexType, ContractWriteError, WalletClientService>
}

type ContractSimulateMethods<TAbi extends Abi> = {
  [F in ExtractWriteFunctions<TAbi> as F['name'] extends string ? F['name'] : never]: (
    ...args: F extends { inputs: infer I } 
      ? I extends readonly { type: string }[] 
        ? AbiInputsToArgs<I>
        : []
      : []
  ) => Effect.Effect<
    F extends { outputs: infer O } 
      ? O extends readonly { type: string }[] 
        ? AbiOutputToTs<O>
        : unknown
      : unknown,
    ContractCallError
  >
}
