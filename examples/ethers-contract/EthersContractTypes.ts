/**
 * Ethers-style Contract Type Definitions - Copyable Implementation
 *
 * Types following ethers v6 Contract patterns.
 * Copy into your codebase and customize as needed.
 *
 * @module examples/ethers-contract/EthersContractTypes
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
import type { BlockNumberType } from "../../src/primitives/BlockNumber/BlockNumberType.js";
import type { HashType } from "../../src/primitives/Hash/HashType.js";
import type { TransactionHashType } from "../../src/primitives/TransactionHash/TransactionHashType.js";
import type { TypedProvider } from "../../src/provider/TypedProvider.js";

// ============================================================================
// ABI Extraction Types
// ============================================================================

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
 * Extract all functions from ABI
 */
export type ExtractFunctions<TAbi extends readonly Item[]> = Extract<
	TAbi[number],
	FunctionType<string, any, any, any>
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
> = Extract<TAbi[number], FunctionType<TName, any, any, any>>;

/**
 * Get event from ABI by name
 */
export type GetEvent<
	TAbi extends readonly Item[],
	TName extends string,
> = Extract<TAbi[number], EventType<TName, any>>;

// ============================================================================
// Output Types
// ============================================================================

/**
 * Unwrap single-element tuple
 */
type UnwrapSingleOutput<T extends readonly unknown[]> = T extends readonly [
	infer Single,
]
	? Single
	: T;

// ============================================================================
// Runner Types
// ============================================================================

/**
 * Provider capabilities - for read operations
 */
export interface ProviderLike {
	request(args: { method: string; params?: unknown[] }): Promise<unknown>;
}

/**
 * Signer capabilities - for write operations
 */
export interface SignerLike extends ProviderLike {
	getAddress(): Promise<string>;
	signMessage?(message: string | Uint8Array): Promise<string>;
}

/**
 * Contract runner - either provider or signer
 */
export type ContractRunner = ProviderLike | SignerLike;

// ============================================================================
// Transaction Types
// ============================================================================

/**
 * Transaction request for contract calls
 */
export interface ContractTransactionRequest {
	to?: string;
	from?: string;
	data?: string;
	value?: bigint;
	gasLimit?: bigint;
	gasPrice?: bigint;
	maxFeePerGas?: bigint;
	maxPriorityFeePerGas?: bigint;
	nonce?: number;
	chainId?: bigint;
}

/**
 * Transaction response from send operations
 */
export interface ContractTransactionResponse {
	hash: TransactionHashType;
	from: string;
	to: string | null;
	data: string;
	value: bigint;
	nonce: number;
	gasLimit: bigint;
	gasPrice?: bigint;
	maxFeePerGas?: bigint;
	maxPriorityFeePerGas?: bigint;
	chainId: bigint;
	blockNumber: number | null;
	blockHash: string | null;
	timestamp?: number;
	confirmations: number;

	wait(confirms?: number): Promise<ContractTransactionReceipt | null>;
}

/**
 * Transaction receipt with decoded logs
 */
export interface ContractTransactionReceipt {
	to: string | null;
	from: string;
	contractAddress: string | null;
	hash: TransactionHashType;
	blockNumber: number;
	blockHash: string;
	logsBloom: string;
	gasUsed: bigint;
	cumulativeGasUsed: bigint;
	status: number;
	logs: DecodedEventLog[];
}

// ============================================================================
// Event Types
// ============================================================================

/**
 * Decoded event log
 */
export interface DecodedEventLog<TEvent extends EventType = EventType> {
	eventName: TEvent["name"];
	args: ParametersToObject<TEvent["inputs"]>;
	blockNumber: BlockNumberType;
	blockHash: HashType;
	transactionHash: TransactionHashType;
	logIndex: number;
	address: string;
	topics: string[];
	data: string;
}

/**
 * Event filter for subscriptions
 */
export interface EventFilter {
	address?: string;
	topics?: (string | string[] | null)[];
}

/**
 * Prepared topic filter from contract.filters.EventName()
 */
export interface PreparedTopicFilter<TEvent extends EventType = EventType> {
	fragment: TEvent;
	getTopicFilter(): Promise<(string | null)[]>;
}

/**
 * Event listener function
 */
export type ContractEventListener<TEvent extends EventType = EventType> = (
	...args: [...ParametersToPrimitiveTypes<TEvent["inputs"]>, DecodedEventLog<TEvent>]
) => void;

// ============================================================================
// Wrapped Method Types
// ============================================================================

/**
 * Wrapped contract function with additional methods
 */
export interface WrappedContractMethod<
	TArgs extends readonly unknown[] = readonly unknown[],
	TResult = unknown,
> {
	(...args: [...TArgs, ContractTransactionRequest?]): Promise<TResult>;

	/** Execute as view call (eth_call) */
	staticCall(
		...args: [...TArgs, ContractTransactionRequest?]
	): Promise<TResult>;

	/** Send transaction (eth_sendTransaction) */
	send(
		...args: [...TArgs, ContractTransactionRequest?]
	): Promise<ContractTransactionResponse>;

	/** Estimate gas */
	estimateGas(
		...args: [...TArgs, ContractTransactionRequest?]
	): Promise<bigint>;

	/** Build transaction without sending */
	populateTransaction(
		...args: [...TArgs, ContractTransactionRequest?]
	): Promise<ContractTransactionRequest>;

	/** Function name */
	name: string;

	/** Function fragment (only for non-ambiguous) */
	fragment: FunctionType;

	/** Get fragment handling overloads */
	getFragment(...args: TArgs): FunctionType;
}

/**
 * Wrapped event filter factory
 */
export interface WrappedContractEvent<TEvent extends EventType = EventType> {
	(...args: EncodeTopicsArgs<TEvent["inputs"]>): PreparedTopicFilter<TEvent>;

	/** Event name */
	name: string;

	/** Event fragment */
	fragment: TEvent;

	/** Get fragment */
	getFragment(): TEvent;
}

// ============================================================================
// Contract Interface Types
// ============================================================================

/**
 * Read methods (view/pure) - returns decoded result
 */
export type ContractReadMethods<TAbi extends readonly Item[]> = {
	[TFunc in ExtractReadFunctions<TAbi> as TFunc["name"]]: WrappedContractMethod<
		ParametersToPrimitiveTypes<TFunc["inputs"]>,
		UnwrapSingleOutput<ParametersToPrimitiveTypes<TFunc["outputs"]>>
	>;
};

/**
 * Write methods (nonpayable/payable) - returns tx response
 */
export type ContractWriteMethods<TAbi extends readonly Item[]> = {
	[TFunc in ExtractWriteFunctions<TAbi> as TFunc["name"]]: WrappedContractMethod<
		ParametersToPrimitiveTypes<TFunc["inputs"]>,
		ContractTransactionResponse
	>;
};

/**
 * All contract methods combined
 */
export type ContractMethods<TAbi extends readonly Item[]> =
	ContractReadMethods<TAbi> & ContractWriteMethods<TAbi>;

/**
 * Event filters proxy
 */
export type ContractFilters<TAbi extends readonly Item[]> = {
	[TEvent in ExtractEvents<TAbi> as TEvent["name"]]: WrappedContractEvent<TEvent>;
};

// ============================================================================
// Contract Instance Type
// ============================================================================

/**
 * Ethers-style Contract instance
 */
export interface EthersContract<TAbi extends readonly Item[] = readonly Item[]> {
	/** Original target (address or ENS) */
	readonly target: string;

	/** Parsed ABI Interface */
	readonly interface: Abi<TAbi>;

	/** Connected runner (provider/signer) */
	readonly runner: ContractRunner | null;

	/** Event filters proxy */
	readonly filters: ContractFilters<TAbi>;

	/** Fallback/receive method (if ABI has one) */
	readonly fallback: WrappedContractMethod | null;

	/** Get resolved address */
	getAddress(): Promise<string>;

	/** Get deployed bytecode */
	getDeployedCode(): Promise<string | null>;

	/** Wait for deployment */
	waitForDeployment(): Promise<EthersContract<TAbi>>;

	/** Get deployment transaction (if from factory) */
	deploymentTransaction(): ContractTransactionResponse | null;

	/** Create new instance with different runner */
	connect(runner: ContractRunner): EthersContract<TAbi>;

	/** Create new instance with different address */
	attach(target: string): EthersContract<TAbi>;

	/** Get function by name/signature */
	getFunction(key: string): WrappedContractMethod;

	/** Get event by name/signature */
	getEvent(key: string): WrappedContractEvent;

	/** Query historical logs */
	queryFilter(
		event: string | EventType | PreparedTopicFilter,
		fromBlock?: number | bigint | "latest" | "earliest",
		toBlock?: number | bigint | "latest" | "earliest",
	): Promise<DecodedEventLog[]>;

	/** Subscribe to event */
	on<TEvent extends ExtractEvents<TAbi>>(
		event: TEvent["name"] | TEvent | PreparedTopicFilter<TEvent>,
		listener: ContractEventListener<TEvent>,
	): Promise<EthersContract<TAbi>>;

	/** Subscribe once */
	once<TEvent extends ExtractEvents<TAbi>>(
		event: TEvent["name"] | TEvent | PreparedTopicFilter<TEvent>,
		listener: ContractEventListener<TEvent>,
	): Promise<EthersContract<TAbi>>;

	/** Unsubscribe */
	off<TEvent extends ExtractEvents<TAbi>>(
		event: TEvent["name"] | TEvent | PreparedTopicFilter<TEvent>,
		listener?: ContractEventListener<TEvent>,
	): Promise<EthersContract<TAbi>>;

	/** Emit event to listeners */
	emit(event: string, ...args: unknown[]): Promise<boolean>;

	/** Count listeners */
	listenerCount(event?: string): Promise<number>;

	/** Get listeners */
	listeners(event?: string): Promise<ContractEventListener[]>;

	/** Remove all listeners */
	removeAllListeners(event?: string): Promise<EthersContract<TAbi>>;

	// Dynamic methods from ABI - accessed via Proxy
	[key: string]: unknown;
}

// ============================================================================
// Contract Factory Types
// ============================================================================

/**
 * Contract Factory for deployment
 */
export interface ContractFactoryInterface<
	TAbi extends readonly Item[] = readonly Item[],
> {
	/** Parsed ABI Interface */
	readonly interface: Abi<TAbi>;

	/** Deployment bytecode */
	readonly bytecode: string;

	/** Connected runner */
	readonly runner: ContractRunner | null;

	/** Create Contract at existing address */
	attach(target: string): EthersContract<TAbi>;

	/** Build deployment transaction */
	getDeployTransaction(
		...args: unknown[]
	): Promise<ContractTransactionRequest>;

	/** Deploy contract */
	deploy(...args: unknown[]): Promise<EthersContract<TAbi>>;

	/** Create new factory with different runner */
	connect(runner: ContractRunner): ContractFactoryInterface<TAbi>;
}

// ============================================================================
// Constructor Options
// ============================================================================

/**
 * Options for creating EthersContract
 */
export interface EthersContractOptions<TAbi extends readonly Item[]> {
	/** Contract address or ENS name */
	target: string;
	/** Contract ABI */
	abi: TAbi;
	/** Provider or Signer */
	runner?: ContractRunner | null;
}

/**
 * Options for creating ContractFactory
 */
export interface ContractFactoryOptions<TAbi extends readonly Item[]> {
	/** Contract ABI */
	abi: TAbi;
	/** Deployment bytecode */
	bytecode: string | Uint8Array | { object: string };
	/** Provider or Signer */
	runner?: ContractRunner | null;
}
