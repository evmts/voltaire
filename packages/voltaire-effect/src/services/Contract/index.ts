/**
 * @fileoverview Contract factory and registry for type-safe smart contract interactions.
 *
 * @module Contract
 * @since 0.0.1
 *
 * @description
 * This module provides two main features:
 *
 * 1. **Contract Factory** - `Contract()` function for creating individual contract instances
 * 2. **Contract Registry** - `ContractRegistryService` for managing multiple contracts as a named map
 *
 * ## Contract Factory
 *
 * `Contract()` is a factory function, NOT a `Context.Tag` service.
 * It returns an Effect that yields a `ContractInstance` with `.read`, `.write`,
 * `.simulate`, and `.getEvents` methods.
 *
 * ## Contract Registry
 *
 * For applications with multiple contracts, use `makeContractRegistry()` to define
 * all contracts once and access them via `ContractRegistryService`.
 *
 * Main exports:
 * - {@link Contract} - Factory function to create individual contract instances
 * - {@link ContractRegistryService} - Service for accessing pre-configured contracts
 * - {@link makeContractRegistry} - Creates a layer with configured contracts
 *
 * Type exports:
 * - {@link ContractInstance} - Type-safe contract binding
 * - {@link ContractFactory} - Factory for creating instances at runtime
 * - {@link ContractDef} - Single contract configuration
 * - {@link ContractRegistryConfig} - Configuration map for multiple contracts
 * - {@link Abi} - ABI definition type
 * - {@link AbiItem} - Single ABI entry type
 *
 * Error exports:
 * - {@link ContractError} - Base contract error
 * - {@link ContractCallError} - Read operation error
 * - {@link ContractWriteError} - Write operation error
 * - {@link ContractEventError} - Event query error
 *
 * @example Contract Factory (single contract)
 * ```typescript
 * import { Effect } from 'effect'
 * import { Contract, Provider, HttpTransport } from 'voltaire-effect'
 *
 * const program = Effect.gen(function* () {
 *   const token = yield* Contract(tokenAddress, erc20Abi)
 *   const balance = yield* token.read.balanceOf(userAddress)
 *   return balance
 * }).pipe(
 *   Effect.provide(Provider),
 *   Effect.provide(HttpTransport('https://...'))
 * )
 * ```
 *
 * @example Contract Registry (multiple contracts)
 * ```typescript
 * import { Effect } from 'effect'
 * import { ContractRegistryService, makeContractRegistry, Provider, HttpTransport } from 'voltaire-effect'
 *
 * const Contracts = makeContractRegistry({
 *   USDC: { abi: erc20Abi, address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' },
 *   WETH: { abi: erc20Abi, address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' },
 *   ERC20: { abi: erc20Abi }  // Factory - no address
 * })
 *
 * const program = Effect.gen(function* () {
 *   const contracts = yield* ContractRegistryService
 *   const usdcBalance = yield* contracts.USDC.read.balanceOf(userAddress)
 *   const token = yield* contracts.ERC20.at(dynamicAddress)  // Factory usage
 *   return usdcBalance
 * }).pipe(
 *   Effect.provide(Contracts),
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
export {
	type ContractDef,
	type ContractFactory,
	type ContractRegistryBase,
	type ContractRegistryConfig,
	ContractRegistryService,
	type ContractRegistryShape,
	type InferContractRegistry,
	makeContractRegistry,
} from "./ContractsService.js";
