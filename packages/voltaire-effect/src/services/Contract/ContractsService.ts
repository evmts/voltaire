/**
 * @fileoverview ContractRegistryService for pre-configured contract instances.
 *
 * @module ContractRegistryService
 * @since 0.5.0
 *
 * @description
 * Provides a service for defining and accessing a collection of typed contract
 * instances. Define your contracts once with their ABIs and addresses, then
 * access them as a named map throughout your application.
 *
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import { ContractRegistryService, makeContractRegistry, Provider, HttpTransport } from 'voltaire-effect'
 *
 * const erc20Abi = [...] as const
 *
 * const contractsConfig = {
 *   USDC: {
 *     abi: erc20Abi,
 *     address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
 *   },
 *   WETH: {
 *     abi: erc20Abi,
 *     address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
 *   }
 * } as const
 *
 * const Contracts = makeContractRegistry(contractsConfig)
 *
 * const program = Effect.gen(function* () {
 *   const contracts = yield* ContractRegistryService
 *   const usdcBalance = yield* contracts.USDC.read.balanceOf(userAddress)
 *   const wethBalance = yield* contracts.WETH.read.balanceOf(userAddress)
 *   return { usdcBalance, wethBalance }
 * }).pipe(
 *   Effect.provide(Contracts),
 *   Effect.provide(Provider),
 *   Effect.provide(HttpTransport('https://...'))
 * )
 * ```
 */

import type { BrandedAddress } from "@tevm/voltaire";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { ProviderService } from "../Provider/index.js";
import { Contract } from "./Contract.js";
import type { Abi, ContractInstance } from "./ContractTypes.js";

type AddressType = BrandedAddress.AddressType;

/**
 * Configuration for a single contract.
 *
 * @since 0.5.0
 */
export interface ContractDef<TAbi extends Abi = Abi> {
	/** The contract ABI */
	readonly abi: TAbi;
	/** The contract address (optional - can be set later via at()) */
	readonly address?: AddressType | `0x${string}`;
}

/**
 * Configuration map for multiple contracts.
 *
 * @since 0.5.0
 */
export type ContractRegistryConfig = {
	readonly [name: string]: ContractDef;
};

/**
 * Factory for creating contract instances when address is not pre-configured.
 *
 * @since 0.5.0
 */
export interface ContractFactory<TAbi extends Abi> {
	/** The contract ABI */
	readonly abi: TAbi;
	/** Create a contract instance at the given address */
	readonly at: (
		address: AddressType | `0x${string}`,
	) => Effect.Effect<ContractInstance<TAbi>, never, ProviderService>;
}

/**
 * Maps contract config to contract instances.
 *
 * @since 0.5.0
 */
export type ContractRegistryShape<TConfig extends ContractRegistryConfig> = {
	readonly [K in keyof TConfig]: TConfig[K]["address"] extends
		| AddressType
		| `0x${string}`
		? ContractInstance<TConfig[K]["abi"]>
		: ContractFactory<TConfig[K]["abi"]>;
};

/**
 * Base shape for contract registry - allows any contract name to instance mapping.
 *
 * @since 0.5.0
 */
export type ContractRegistryBase = Record<
	string,
	ContractInstance<Abi> | ContractFactory<Abi>
>;

/**
 * Service for accessing pre-configured contract instances.
 *
 * @description
 * Provides a named map of contract instances based on the configuration.
 * Contracts with addresses are fully instantiated ContractInstances.
 * Contracts without addresses provide a factory to create instances at any address.
 *
 * @since 0.5.0
 */
export class ContractRegistryService extends Context.Tag(
	"ContractRegistryService",
)<ContractRegistryService, ContractRegistryBase>() {}

/**
 * Creates a Layer that provides configured contract instances.
 *
 * @param config - Map of contract names to their configurations (abi + optional address)
 * @returns Layer providing ContractRegistryService with typed contract instances
 *
 * @since 0.5.0
 *
 * @example With addresses (fully typed instances)
 * ```typescript
 * const Contracts = makeContractRegistry({
 *   USDC: {
 *     abi: erc20Abi,
 *     address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
 *   }
 * })
 *
 * const program = Effect.gen(function* () {
 *   const { USDC } = yield* ContractRegistryService
 *   return yield* USDC.read.balanceOf(userAddress)
 * })
 * ```
 *
 * @example Without addresses (factory pattern)
 * ```typescript
 * const Contracts = makeContractRegistry({
 *   ERC20: { abi: erc20Abi }  // no address
 * })
 *
 * const program = Effect.gen(function* () {
 *   const { ERC20 } = yield* ContractRegistryService
 *   const token = yield* ERC20.at('0x...')  // create at specific address
 *   return yield* token.read.balanceOf(userAddress)
 * })
 * ```
 */
export const makeContractRegistry = <const TConfig extends ContractRegistryConfig>(
	config: TConfig,
): Layer.Layer<ContractRegistryService, never, ProviderService> =>
	Layer.effect(
		ContractRegistryService,
		Effect.gen(function* () {
			const registry: ContractRegistryBase = {};

			for (const [name, contractDef] of Object.entries(config)) {
				if (contractDef.address !== undefined) {
					// Address provided - create full instance
					const instance = yield* Contract(contractDef.address, contractDef.abi);
					registry[name] = instance;
				} else {
					// No address - create factory
					const factory: ContractFactory<Abi> = {
						abi: contractDef.abi,
						at: (address) => Contract(address, contractDef.abi),
					};
					registry[name] = factory;
				}
			}

			return registry;
		}),
	);

/**
 * Type helper to extract the contracts type from a config.
 *
 * @since 0.5.0
 *
 * @example
 * ```typescript
 * const config = {
 *   USDC: { abi: erc20Abi, address: '0x...' }
 * } as const
 *
 * type MyContracts = InferContractRegistry<typeof config>
 * // { USDC: ContractInstance<typeof erc20Abi> }
 * ```
 */
export type InferContractRegistry<TConfig extends ContractRegistryConfig> =
	ContractRegistryShape<TConfig>;
