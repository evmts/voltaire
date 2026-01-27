/**
 * @fileoverview Contract factory for type-safe smart contract interactions.
 *
 * @module Contract
 * @since 0.0.1
 *
 * @description
 * This module provides the `Contract` factory function for creating type-safe
 * bindings to deployed smart contracts based on their ABI.
 *
 * **Note:** `Contract()` is a factory function, NOT a `Context.Tag` service.
 * It returns an Effect that yields a `ContractInstance` with `.read`, `.write`,
 * `.simulate`, and `.getEvents` methods. The factory depends on `ProviderService`
 * for read operations, and write operations additionally require `SignerService`.
 *
 * Main exports:
 * - {@link Contract} - Factory function to create contract instances
 *
 * Type exports:
 * - {@link ContractInstance} - Type-safe contract binding
 * - {@link Abi} - ABI definition type
 * - {@link AbiItem} - Single ABI entry type
 * - {@link EventFilter} - Event query parameters
 * - {@link DecodedEvent} - Decoded event log
 *
 * Error exports:
 * - {@link ContractError} - Base contract error
 * - {@link ContractCallError} - Read operation error
 * - {@link ContractWriteError} - Write operation error
 * - {@link ContractEventError} - Event query error
 *
 * @example Creating a contract instance
 * ```typescript
 * import { Effect } from 'effect'
 * import { Contract, Provider, HttpTransport } from 'voltaire-effect'
 *
 * const erc20Abi = [...] as const
 *
 * const program = Effect.gen(function* () {
 *   // Contract() is a factory - yields a contract instance, not a service
 *   const token = yield* Contract(tokenAddress, erc20Abi)
 *   const balance = yield* token.read.balanceOf(userAddress)
 *   return balance
 * }).pipe(
 *   Effect.provide(Provider),
 *   Effect.provide(HttpTransport('https://...'))
 * )
 * ```
 *
 * @see {@link ProviderService} - Required for all contract operations
 * @see {@link SignerService} - Required for write operations
 */

export { Contract } from "./Contract.js";
export {
	type Abi,
	type AbiItem,
	type BlockTag,
	ContractCallError,
	ContractError,
	ContractEventError,
	type ContractInstance,
	ContractWriteError,
	type DecodedEvent,
	type EventFilter,
	type WriteOptions,
} from "./ContractTypes.js";
