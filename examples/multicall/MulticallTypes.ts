/**
 * Multicall Type Definitions
 *
 * TypeScript types for the multicall abstraction.
 *
 * @module examples/multicall/MulticallTypes
 */

import type { Item } from "../../src/primitives/Abi/AbiType.js";
import type {
	Parameter,
	ParametersToPrimitiveTypes,
} from "../../src/primitives/Abi/Parameter.js";
import type { FunctionType } from "../../src/primitives/Abi/function/FunctionType.js";
import type { TypedProvider } from "../../src/provider/TypedProvider.js";

/**
 * Block tag types
 */
export type BlockTag = "latest" | "earliest" | "pending" | "safe" | "finalized";

/**
 * Single contract call configuration
 *
 * @template TAbi - Contract ABI type
 * @template TFunctionName - Function name (inferred from ABI)
 */
export type ContractCall<
	TAbi extends readonly Item[] = readonly Item[],
	TFunctionName extends string = string,
> = {
	/** Contract address */
	address: `0x${string}`;
	/** Contract ABI */
	abi: TAbi;
	/** Function name to call */
	functionName: TFunctionName;
	/** Function arguments */
	args?: readonly unknown[];
};

/**
 * Multicall parameters
 */
export type MulticallParameters<
	TContracts extends readonly ContractCall[] = readonly ContractCall[],
	TAllowFailure extends boolean = true,
> = {
	/** Array of contract calls to batch */
	contracts: TContracts;
	/** Allow individual calls to fail (default: true) */
	allowFailure?: TAllowFailure;
	/** Block number to query at */
	blockNumber?: bigint;
	/** Block tag to query at */
	blockTag?: BlockTag;
	/** Custom Multicall3 contract address */
	multicallAddress?: `0x${string}`;
	/** Max calldata bytes per batch (default: 1024) */
	batchSize?: number;
	/** Use deployless mode (deploy Multicall3 inline) */
	deployless?: boolean;
};

/**
 * Success result (when allowFailure is true)
 */
export type MulticallSuccessResult<TResult = unknown> = {
	status: "success";
	result: TResult;
};

/**
 * Failure result (when allowFailure is true)
 */
export type MulticallFailureResult = {
	status: "failure";
	error: Error;
	result: undefined;
};

/**
 * Result type for a single call
 *
 * When `allowFailure: true`, returns `{ status, result, error }`
 * When `allowFailure: false`, returns just the result value
 */
export type MulticallResult<
	TResult = unknown,
	TAllowFailure extends boolean = true,
> = TAllowFailure extends true
	? MulticallSuccessResult<TResult> | MulticallFailureResult
	: TResult;

/**
 * Extract function from ABI by name
 */
type GetFunction<TAbi extends readonly Item[], TName extends string> = Extract<
	TAbi[number],
	FunctionType<TName, unknown, unknown, unknown>
>;

/**
 * Get function output type from ABI function
 */
type GetFunctionOutputType<TFunc extends FunctionType> =
	TFunc["outputs"] extends readonly Parameter[]
		? ParametersToPrimitiveTypes<TFunc["outputs"]> extends readonly [
				infer Single,
			]
			? Single
			: ParametersToPrimitiveTypes<TFunc["outputs"]>
		: unknown;

/**
 * Multicall return type - array of results matching input contracts
 *
 * Each result is typed based on the contract's ABI and function outputs.
 */
export type MulticallReturnType<
	TContracts extends readonly ContractCall[],
	TAllowFailure extends boolean = true,
> = {
	[K in keyof TContracts]: TContracts[K] extends ContractCall<
		infer TAbi,
		infer TFunctionName
	>
		? GetFunction<TAbi, TFunctionName> extends FunctionType
			? MulticallResult<
					GetFunctionOutputType<GetFunction<TAbi, TFunctionName>>,
					TAllowFailure
				>
			: MulticallResult<unknown, TAllowFailure>
		: MulticallResult<unknown, TAllowFailure>;
};

/**
 * Internal call structure for Multicall3.aggregate3
 */
export type Aggregate3Call = {
	target: `0x${string}`;
	allowFailure: boolean;
	callData: `0x${string}`;
};

/**
 * Internal result structure from Multicall3.aggregate3
 */
export type Aggregate3Result = {
	success: boolean;
	returnData: `0x${string}`;
};

/**
 * Multicall client options
 */
export type MulticallClientOptions = {
	/** EIP-1193 provider */
	provider: TypedProvider;
	/** Default Multicall3 address override */
	multicallAddress?: `0x${string}`;
	/** Default batch size */
	batchSize?: number;
};

/**
 * Multicall function signature
 */
export type MulticallFunction = <
	const TContracts extends readonly ContractCall[],
	TAllowFailure extends boolean = true,
>(
	provider: TypedProvider,
	parameters: MulticallParameters<TContracts, TAllowFailure>,
) => Promise<MulticallReturnType<TContracts, TAllowFailure>>;
