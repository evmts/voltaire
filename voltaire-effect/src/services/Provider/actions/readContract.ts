/**
 * @fileoverview Standalone readContract action for type-safe contract reads.
 *
 * @module Provider/actions/readContract
 * @since 0.0.1
 *
 * @description
 * Provides a standalone action for reading contract data without needing
 * to create a Contract instance. This is similar to viem's readContract
 * function and is useful for one-off contract reads.
 *
 * @see {@link Contract} - For creating reusable contract instances
 * @see {@link ProviderService} - Required dependency
 */

import {
	Address,
	BrandedAbi,
	type Abi as BrandedAbiType,
	type BrandedAddress,
	type BrandedHex,
	Hex,
} from "@tevm/voltaire";
import * as Effect from "effect/Effect";
import {
	type AddressInput,
	type BlockTag,
	type CallError,
	ProviderService,
	ProviderValidationError,
} from "../ProviderService.js";

type AddressType = BrandedAddress.AddressType;
type HexType = BrandedHex.HexType;

/**
 * Represents a single ABI item.
 * @internal
 */
type AbiItem = { type: string; name?: string };

/**
 * ABI type that can be used with readContract.
 */
export type Abi = readonly AbiItem[];

/**
 * Error union for readContract.
 */
export type ReadContractError = CallError | ProviderValidationError;

/**
 * Extracts function names from an ABI that are view or pure.
 */
type ExtractViewFunctionNames<TAbi extends Abi> =
	TAbi extends readonly (infer Item)[]
		? Item extends {
				type: "function";
				name: infer Name;
				stateMutability: "view" | "pure";
			}
			? Name extends string
				? Name
				: never
			: Item extends { type: "function"; name: infer Name }
				? Name extends string
					? Name
					: never
				: never
		: never;

/**
 * Gets the inputs for a specific function from an ABI.
 */
type GetFunctionInputs<
	TAbi extends Abi,
	TFunctionName extends string,
> = TAbi extends readonly (infer Item)[]
	? Item extends { type: "function"; name: TFunctionName; inputs: infer Inputs }
		? Inputs extends readonly { type: string }[]
			? AbiInputsToArgs<Inputs>
			: readonly unknown[]
		: never
	: readonly unknown[];

/**
 * Maps ABI input types to TypeScript types.
 */
type AbiInputsToArgs<TInputs extends readonly { type: string }[]> = {
	[K in keyof TInputs]: AbiTypeToTS<TInputs[K]["type"]>;
};

/**
 * Maps a single ABI type to TypeScript type.
 */
type AbiTypeToTS<T extends string> = T extends `uint${string}` | `int${string}`
	? bigint
	: T extends "address"
		? AddressType | `0x${string}`
		: T extends "bool"
			? boolean
			: T extends `bytes${string}`
				? HexType | `0x${string}`
				: T extends "string"
					? string
					: T extends `${string}[]`
						? readonly unknown[]
						: T extends `(${string})`
							? readonly unknown[]
							: unknown;

/**
 * Gets the output type for a specific function from an ABI.
 */
type GetFunctionOutput<
	TAbi extends Abi,
	TFunctionName extends string,
> = TAbi extends readonly (infer Item)[]
	? Item extends {
			type: "function";
			name: TFunctionName;
			outputs: infer Outputs;
		}
		? Outputs extends readonly { type: string }[]
			? Outputs["length"] extends 0
				? undefined
				: Outputs["length"] extends 1
					? AbiTypeToTS<Outputs[0]["type"]>
					: {
							[K in keyof Outputs]: AbiTypeToTS<
								Outputs[K] extends { type: string } ? Outputs[K]["type"] : never
							>;
						}
			: unknown
		: never
	: unknown;

/**
 * Parameters for readContract action.
 *
 * @typeParam TAbi - The contract ABI type
 * @typeParam TFunctionName - The function name to call
 *
 * @since 0.0.1
 */
export interface ReadContractParams<
	TAbi extends Abi,
	TFunctionName extends string,
> {
	/** The contract address */
	readonly address: AddressInput;
	/** The contract ABI */
	readonly abi: TAbi;
	/** The function name to call */
	readonly functionName: TFunctionName;
	/** The function arguments */
	readonly args?: GetFunctionInputs<TAbi, TFunctionName>;
	/** The block tag to query at (default: 'latest') */
	readonly blockTag?: BlockTag;
}

/**
 * Reads data from a smart contract without creating a Contract instance.
 *
 * @description
 * This is a standalone action for reading contract state. It encodes the
 * function call, executes eth_call, and decodes the result. This is useful
 * for one-off reads or when you don't need a full Contract instance.
 *
 * The function provides full type inference when used with a const ABI:
 * - Function name autocomplete
 * - Argument type checking
 * - Return type inference
 *
 * Requires ProviderService to be provided.
 *
 * @typeParam TAbi - The contract ABI type
 * @typeParam TFunctionName - The function name to call
 *
 * @param params - The read contract parameters
 * @returns Effect yielding the decoded return value(s)
 *
 * @since 0.0.1
 *
 * @example Basic ERC-20 balance read
 * ```typescript
 * import { Effect } from 'effect'
 * import { readContract, Provider, HttpTransport } from 'voltaire-effect'
 *
 * const erc20Abi = [
 *   {
 *     type: 'function',
 *     name: 'balanceOf',
 *     stateMutability: 'view',
 *     inputs: [{ name: 'account', type: 'address' }],
 *     outputs: [{ type: 'uint256' }]
 *   }
 * ] as const
 *
 * const program = Effect.gen(function* () {
 *   const balance = yield* readContract({
 *     address: '0x6B175474E89094C44Da98b954EcdE6E286AB',
 *     abi: erc20Abi,
 *     functionName: 'balanceOf',
 *     args: ['0x1234567890123456789012345678901234567890']
 *   })
 *   return balance // bigint
 * }).pipe(
 *   Effect.provide(Provider),
 *   Effect.provide(HttpTransport('https://mainnet.infura.io/v3/YOUR_KEY'))
 * )
 * ```
 *
 * @example Function with no arguments
 * ```typescript
 * const supply = yield* readContract({
 *   address: tokenAddress,
 *   abi: erc20Abi,
 *   functionName: 'totalSupply'
 * })
 * ```
 *
 * @example Function with multiple return values
 * ```typescript
 * const pairAbi = [
 *   {
 *     type: 'function',
 *     name: 'getReserves',
 *     stateMutability: 'view',
 *     inputs: [],
 *     outputs: [
 *       { name: 'reserve0', type: 'uint112' },
 *       { name: 'reserve1', type: 'uint112' },
 *       { name: 'blockTimestampLast', type: 'uint32' }
 *     ]
 *   }
 * ] as const
 *
 * const reserves = yield* readContract({
 *   address: pairAddress,
 *   abi: pairAbi,
 *   functionName: 'getReserves'
 * })
 * // reserves is [bigint, bigint, bigint]
 * ```
 *
 * @example Specifying block tag
 * ```typescript
 * const balance = yield* readContract({
 *   address: tokenAddress,
 *   abi: erc20Abi,
 *   functionName: 'balanceOf',
 *   args: [account],
 *   blockTag: 'finalized'
 * })
 * ```
 *
 * @see {@link Contract} - For creating reusable contract instances
 * @see {@link ProviderService} - Required dependency
 */
export const readContract = <
	const TAbi extends Abi,
	TFunctionName extends ExtractViewFunctionNames<TAbi> & string,
>(
	params: ReadContractParams<TAbi, TFunctionName>,
): Effect.Effect<
	GetFunctionOutput<TAbi, TFunctionName>,
	ReadContractError,
	ProviderService
> =>
	Effect.gen(function* () {
		const provider = yield* ProviderService;

		const addressHex =
			typeof params.address === "string"
				? params.address
				: Address.toHex(params.address as AddressType);

		const data = BrandedAbi.encodeFunction(
			params.abi as unknown as BrandedAbiType,
			params.functionName,
			(params.args ?? []) as unknown[],
		);

		const result = yield* provider.call(
			{ to: addressHex, data },
			params.blockTag,
		);

		const fn = (params.abi as readonly AbiItem[]).find(
			(item): item is BrandedAbi.Function.FunctionType =>
				item.type === "function" && item.name === params.functionName,
		) as BrandedAbi.Function.FunctionType | undefined;

		if (!fn) {
			return yield* Effect.fail(
				new ProviderValidationError(
					{ functionName: params.functionName },
					`Function "${params.functionName}" not found in ABI`,
				),
			);
		}

		const bytes = Hex.toBytes(result);
		const decoded = BrandedAbi.Function.decodeResult(fn, bytes);

		if (fn.outputs.length === 1) {
			return decoded[0] as GetFunctionOutput<TAbi, TFunctionName>;
		}
		return decoded as GetFunctionOutput<TAbi, TFunctionName>;
	});
