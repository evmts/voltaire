/**
 * Viem Contract Types - Copyable Implementation
 *
 * TypeScript type definitions that mirror viem's contract types.
 * Copy this into your codebase and customize as needed.
 *
 * @module examples/viem-contract/ViemContractTypes
 */

import type { Abi } from "../../src/primitives/Abi/AbiConstructor.js";
import type { Item } from "../../src/primitives/Abi/AbiType.js";
import type {
	Parameter,
	ParametersToObject,
	ParametersToPrimitiveTypes,
} from "../../src/primitives/Abi/Parameter.js";
import type {
	EncodeTopicsArgs,
	EventType,
} from "../../src/primitives/Abi/event/EventType.js";
import type { FunctionType } from "../../src/primitives/Abi/function/FunctionType.js";
import type { AddressType } from "../../src/primitives/Address/AddressType.js";

// =============================================================================
// Client Types
// =============================================================================

/**
 * EIP-1193 compatible provider/client interface
 */
export type Client = {
	request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
	account?: Account;
	pollingInterval?: number;
};

/**
 * Account type - can be address string, object with address, or raw bytes
 */
export type Account =
	| `0x${string}`
	| { address: `0x${string}` }
	| AddressType
	| undefined;

// =============================================================================
// ABI Type Extraction
// =============================================================================

/**
 * Extract view/pure functions from ABI
 */
export type ExtractReadFunctions<TAbi extends readonly Item[]> = Extract<
	TAbi[number],
	FunctionType<
		string,
		"view" | "pure",
		readonly Parameter[],
		readonly Parameter[]
	>
>;

/**
 * Extract nonpayable/payable functions from ABI
 */
export type ExtractWriteFunctions<TAbi extends readonly Item[]> = Extract<
	TAbi[number],
	FunctionType<
		string,
		"nonpayable" | "payable",
		readonly Parameter[],
		readonly Parameter[]
	>
>;

/**
 * Extract events from ABI
 */
export type ExtractEvents<TAbi extends readonly Item[]> = Extract<
	TAbi[number],
	EventType<string, readonly Parameter[]>
>;

/**
 * Get function from ABI by name
 */
export type GetFunction<
	TAbi extends readonly Item[],
	TName extends string,
> = Extract<TAbi[number], FunctionType<TName, unknown, unknown, unknown>>;

/**
 * Get event from ABI by name
 */
export type GetEvent<
	TAbi extends readonly Item[],
	TName extends string,
> = Extract<TAbi[number], EventType<TName, unknown>>;

/**
 * Unwrap single-element tuple to just the value
 */
type UnwrapSingleOutput<T extends readonly unknown[]> = T extends readonly [
	infer Single,
]
	? Single
	: T;

// =============================================================================
// Action Parameters
// =============================================================================

/**
 * Common contract parameters shared by all actions
 */
export type ContractParameters<
	TAbi extends readonly Item[] = readonly Item[],
	TFunctionName extends string = string,
> = {
	/** Contract ABI */
	abi: TAbi;
	/** Contract address */
	address: `0x${string}` | AddressType;
	/** Function name to call */
	functionName: TFunctionName;
	/** Function arguments */
	args?: readonly unknown[];
};

/**
 * Parameters for readContract
 */
export type ReadContractParameters<
	TAbi extends readonly Item[] = readonly Item[],
	TFunctionName extends string = string,
> = ContractParameters<TAbi, TFunctionName> & {
	/** Block tag or number */
	blockTag?: "latest" | "earliest" | "pending" | "safe" | "finalized";
	blockNumber?: `0x${string}` | bigint;
};

/**
 * Return type for readContract - inferred from ABI
 */
export type ReadContractReturnType<
	TAbi extends readonly Item[],
	TFunctionName extends string,
> = GetFunction<TAbi, TFunctionName> extends FunctionType<
	unknown,
	unknown,
	unknown,
	infer TOutputs
>
	? UnwrapSingleOutput<ParametersToPrimitiveTypes<TOutputs>>
	: unknown;

/**
 * Parameters for writeContract
 */
export type WriteContractParameters<
	TAbi extends readonly Item[] = readonly Item[],
	TFunctionName extends string = string,
> = ContractParameters<TAbi, TFunctionName> & {
	/** Account to send transaction from */
	account?: Account;
	/** Optional data suffix to append to calldata */
	dataSuffix?: `0x${string}`;
	/** Gas limit */
	gas?: bigint;
	/** Gas price */
	gasPrice?: bigint;
	/** Max fee per gas (EIP-1559) */
	maxFeePerGas?: bigint;
	/** Max priority fee per gas (EIP-1559) */
	maxPriorityFeePerGas?: bigint;
	/** Transaction nonce */
	nonce?: number;
	/** Value to send with transaction */
	value?: bigint;
};

/**
 * Return type for writeContract - always transaction hash
 */
export type WriteContractReturnType = `0x${string}`;

/**
 * Parameters for simulateContract
 */
export type SimulateContractParameters<
	TAbi extends readonly Item[] = readonly Item[],
	TFunctionName extends string = string,
> = ContractParameters<TAbi, TFunctionName> & {
	/** Account to simulate from */
	account?: Account;
	/** Optional data suffix */
	dataSuffix?: `0x${string}`;
	/** Block tag or number */
	blockTag?: "latest" | "earliest" | "pending" | "safe" | "finalized";
	blockNumber?: `0x${string}` | bigint;
	/** Gas limit */
	gas?: bigint;
	/** Value to send */
	value?: bigint;
};

/**
 * Return type for simulateContract
 */
export type SimulateContractReturnType<
	TAbi extends readonly Item[] = readonly Item[],
	TFunctionName extends string = string,
> = {
	/** The simulation result */
	result: ReadContractReturnType<TAbi, TFunctionName>;
	/** Request object that can be passed to writeContract */
	request: {
		abi: readonly Item[];
		address: `0x${string}`;
		args: readonly unknown[];
		dataSuffix?: `0x${string}`;
		functionName: TFunctionName;
		account?: `0x${string}`;
	};
};

/**
 * Parameters for estimateContractGas
 */
export type EstimateContractGasParameters<
	TAbi extends readonly Item[] = readonly Item[],
	TFunctionName extends string = string,
> = ContractParameters<TAbi, TFunctionName> & {
	/** Account to estimate from */
	account?: Account;
	/** Optional data suffix */
	dataSuffix?: `0x${string}`;
	/** Value to send */
	value?: bigint;
};

/**
 * Return type for estimateContractGas - always bigint
 */
export type EstimateContractGasReturnType = bigint;

/**
 * Parameters for watchContractEvent
 */
export type WatchContractEventParameters<
	TAbi extends readonly Item[] = readonly Item[],
	TEventName extends string | undefined = undefined,
> = {
	/** Contract ABI */
	abi: TAbi;
	/** Contract address */
	address: `0x${string}` | AddressType;
	/** Event name to watch (optional - watches all events if not specified) */
	eventName?: TEventName;
	/** Event filter arguments for indexed parameters */
	args?: TEventName extends string
		? GetEvent<TAbi, TEventName> extends EventType<unknown, infer TInputs>
			? EncodeTopicsArgs<TInputs>
			: never
		: never;
	/** Callback when logs are received */
	onLogs: (logs: WatchContractEventLog<TAbi, TEventName>[]) => void;
	/** Callback on error */
	onError?: (error: unknown) => void;
	/** Whether to batch logs (default: true) */
	batch?: boolean;
	/** Starting block number */
	fromBlock?: bigint;
	/** Polling interval in ms */
	pollingInterval?: number;
	/** Strict mode - throw on decode errors */
	strict?: boolean;
};

/**
 * Decoded event log type
 */
export type WatchContractEventLog<
	TAbi extends readonly Item[],
	TEventName extends string | undefined,
> = TEventName extends string
	? GetEvent<TAbi, TEventName> extends EventType<TEventName, infer TInputs>
		? {
				eventName: TEventName;
				args: ParametersToObject<TInputs>;
				address: `0x${string}`;
				blockHash: `0x${string}`;
				blockNumber: bigint;
				data: `0x${string}`;
				logIndex: number;
				topics: readonly `0x${string}`[];
				transactionHash: `0x${string}`;
				transactionIndex: number;
			}
		: never
	: {
			eventName?: string;
			args?: Record<string, unknown>;
			address: `0x${string}`;
			blockHash: `0x${string}`;
			blockNumber: bigint;
			data: `0x${string}`;
			logIndex: number;
			topics: readonly `0x${string}`[];
			transactionHash: `0x${string}`;
			transactionIndex: number;
		};

/**
 * Return type for watchContractEvent - unsubscribe function
 */
export type WatchContractEventReturnType = () => void;

// =============================================================================
// getContract Types
// =============================================================================

/**
 * Read methods interface
 */
export type ContractReadMethods<TAbi extends readonly Item[]> = {
	[TFunc in ExtractReadFunctions<TAbi> as TFunc["name"]]: (
		...args: TFunc["inputs"] extends readonly []
			? [options?: ReadContractOptions]
			: [
					args: ParametersToPrimitiveTypes<TFunc["inputs"]>,
					options?: ReadContractOptions,
				]
	) => Promise<
		UnwrapSingleOutput<ParametersToPrimitiveTypes<TFunc["outputs"]>>
	>;
};

/**
 * Write methods interface
 */
export type ContractWriteMethods<TAbi extends readonly Item[]> = {
	[TFunc in ExtractWriteFunctions<TAbi> as TFunc["name"]]: (
		...args: TFunc["inputs"] extends readonly []
			? [options?: WriteContractOptions]
			: [
					args: ParametersToPrimitiveTypes<TFunc["inputs"]>,
					options?: WriteContractOptions,
				]
	) => Promise<WriteContractReturnType>;
};

/**
 * Simulate methods interface
 */
export type ContractSimulateMethods<TAbi extends readonly Item[]> = {
	[TFunc in ExtractWriteFunctions<TAbi> as TFunc["name"]]: (
		...args: TFunc["inputs"] extends readonly []
			? [options?: SimulateContractOptions]
			: [
					args: ParametersToPrimitiveTypes<TFunc["inputs"]>,
					options?: SimulateContractOptions,
				]
	) => Promise<{
		result: UnwrapSingleOutput<ParametersToPrimitiveTypes<TFunc["outputs"]>>;
		request: {
			abi: readonly Item[];
			address: `0x${string}`;
			args: readonly unknown[];
			functionName: TFunc["name"];
			account?: `0x${string}`;
		};
	}>;
};

/**
 * EstimateGas methods interface
 */
export type ContractEstimateGasMethods<TAbi extends readonly Item[]> = {
	[TFunc in ExtractWriteFunctions<TAbi> as TFunc["name"]]: (
		...args: TFunc["inputs"] extends readonly []
			? [options?: EstimateGasOptions]
			: [
					args: ParametersToPrimitiveTypes<TFunc["inputs"]>,
					options?: EstimateGasOptions,
				]
	) => Promise<bigint>;
};

/**
 * WatchEvent methods interface
 */
export type ContractWatchEventMethods<TAbi extends readonly Item[]> = {
	[TEvent in ExtractEvents<TAbi> as TEvent["name"]]: (
		...args: Parameters<
			(
				filterArgs?: EncodeTopicsArgs<TEvent["inputs"]>,
				options?: WatchEventOptions<TAbi, TEvent["name"]>,
			) => void
		>
	) => WatchContractEventReturnType;
};

/**
 * Options for read calls
 */
export type ReadContractOptions = {
	blockTag?: "latest" | "earliest" | "pending" | "safe" | "finalized";
	blockNumber?: `0x${string}` | bigint;
};

/**
 * Options for write calls
 */
export type WriteContractOptions = {
	account?: Account;
	gas?: bigint;
	gasPrice?: bigint;
	maxFeePerGas?: bigint;
	maxPriorityFeePerGas?: bigint;
	nonce?: number;
	value?: bigint;
	dataSuffix?: `0x${string}`;
};

/**
 * Options for simulate calls
 */
export type SimulateContractOptions = {
	account?: Account;
	blockTag?: "latest" | "earliest" | "pending" | "safe" | "finalized";
	blockNumber?: `0x${string}` | bigint;
	gas?: bigint;
	value?: bigint;
	dataSuffix?: `0x${string}`;
};

/**
 * Options for gas estimation
 */
export type EstimateGasOptions = {
	account?: Account;
	value?: bigint;
	dataSuffix?: `0x${string}`;
};

/**
 * Options for watching events
 */
export type WatchEventOptions<
	TAbi extends readonly Item[],
	TEventName extends string,
> = {
	onLogs: (logs: WatchContractEventLog<TAbi, TEventName>[]) => void;
	onError?: (error: unknown) => void;
	batch?: boolean;
	fromBlock?: bigint;
	pollingInterval?: number;
	strict?: boolean;
};

/**
 * getContract parameters
 */
export type GetContractParameters<TAbi extends readonly Item[]> = {
	/** Contract ABI */
	abi: TAbi;
	/** Contract address */
	address: `0x${string}` | AddressType;
	/** Client(s) to use */
	client:
		| Client
		| {
				public?: Client;
				wallet?: Client;
		  };
};

/**
 * getContract return type
 */
export type GetContractReturnType<TAbi extends readonly Item[]> = {
	/** Contract address */
	address: `0x${string}`;
	/** Contract ABI */
	abi: TAbi;
	/** Read methods (view/pure functions) */
	read: ContractReadMethods<TAbi>;
	/** Write methods (nonpayable/payable functions) */
	write: ContractWriteMethods<TAbi>;
	/** Simulate methods */
	simulate: ContractSimulateMethods<TAbi>;
	/** Gas estimation methods */
	estimateGas: ContractEstimateGasMethods<TAbi>;
	/** Event watching methods */
	watchEvent: ContractWatchEventMethods<TAbi>;
};
