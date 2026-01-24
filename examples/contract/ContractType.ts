/**
 * Contract Instance Type Definitions - Copyable Implementation
 *
 * This is a reference implementation of contract types.
 * Copy this into your codebase and customize as needed.
 *
 * @module examples/contract/ContractType
 */

import type {
	Abi,
	AbiItem as Item,
	AddressType,
	BlockNumberType,
	EncodeTopicsArgs,
	EventStream,
	EventType,
	FunctionType,
	HashType,
	Parameter,
	ParametersToObject,
	ParametersToPrimitiveTypes,
	TransactionHashType,
	TypedProvider,
} from "@tevm/voltaire";

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
> = Extract<
	TAbi[number],
	FunctionType<TName, string, readonly Parameter[], readonly Parameter[]>
>;

/**
 * Get event from ABI by name
 */
export type GetEvent<
	TAbi extends readonly Item[],
	TName extends string,
> = Extract<TAbi[number], EventType<TName, readonly Parameter[]>>;

/**
 * Unwrap single-element tuple to just the value
 */
type UnwrapSingleOutput<T extends readonly unknown[]> = T extends readonly [
	infer Single,
]
	? Single
	: T;

/**
 * Read methods interface - view/pure functions that use eth_call
 *
 * Arguments are typed from ABI inputs, returns are typed from ABI outputs
 */
export type ContractReadMethods<TAbi extends readonly Item[]> = {
	[TFunc in ExtractReadFunctions<TAbi> as TFunc["name"]]: (
		...args: ParametersToPrimitiveTypes<TFunc["inputs"]>
	) => Promise<
		UnwrapSingleOutput<ParametersToPrimitiveTypes<TFunc["outputs"]>>
	>;
};

/**
 * Write methods interface - nonpayable/payable functions that use eth_sendTransaction
 *
 * Arguments are typed from ABI inputs, returns transaction hash
 */
export type ContractWriteMethods<TAbi extends readonly Item[]> = {
	[TFunc in ExtractWriteFunctions<TAbi> as TFunc["name"]]: (
		...args: ParametersToPrimitiveTypes<TFunc["inputs"]>
	) => Promise<TransactionHashType>;
};

/**
 * Gas estimation methods interface
 *
 * Same signature as write methods but returns gas estimate
 */
export type ContractEstimateGasMethods<TAbi extends readonly Item[]> = {
	[TFunc in ExtractWriteFunctions<TAbi> as TFunc["name"]]: (
		...args: ParametersToPrimitiveTypes<TFunc["inputs"]>
	) => Promise<bigint>;
};

/**
 * Decoded event log with typed args from ABI
 */
export type DecodedEventLog<TEvent extends EventType> = {
	/** Event name */
	eventName: TEvent["name"];
	/** Decoded event arguments (typed from ABI) */
	args: ParametersToObject<TEvent["inputs"]>;
	/** Block number where event was emitted */
	blockNumber: BlockNumberType;
	/** Block hash */
	blockHash: HashType;
	/** Transaction hash */
	transactionHash: TransactionHashType;
	/** Log index within the block */
	logIndex: number;
};

/**
 * Event filter options
 */
export type EventFilterOptions = {
	/** Start block (inclusive) */
	fromBlock?: BlockNumberType | bigint | "latest" | "earliest" | "pending";
	/** End block (inclusive) - if omitted, continues with live events */
	toBlock?: BlockNumberType | bigint | "latest" | "earliest" | "pending";
};

/**
 * Event filters interface - returns EventStream instances
 *
 * Filter args are typed from indexed event parameters
 */
export type ContractEventFilters<TAbi extends readonly Item[]> = {
	[TEvent in ExtractEvents<TAbi> as TEvent["name"]]: (
		filter?: EncodeTopicsArgs<TEvent["inputs"]>,
	) => EventStream<TEvent>;
};

/**
 * Contract instance - typed interface for interacting with deployed contracts
 *
 * @template TAbi - The contract ABI as a const tuple
 */
export type ContractInstance<TAbi extends readonly Item[]> = {
	/** Contract address */
	readonly address: AddressType;

	/** Contract ABI instance with encode/decode methods */
	readonly abi: Abi<TAbi>;

	/**
	 * Read-only calls (view/pure functions)
	 *
	 * Executes eth_call and decodes the result.
	 * Arguments and return types are inferred from ABI.
	 *
	 * @example
	 * ```typescript
	 * // balance is typed as bigint (from uint256 output)
	 * const balance = await contract.read.balanceOf(address);
	 *
	 * // symbol is typed as string
	 * const symbol = await contract.read.symbol();
	 * ```
	 */
	readonly read: ContractReadMethods<TAbi>;

	/**
	 * Write calls (nonpayable/payable functions)
	 *
	 * Sends transaction via eth_sendTransaction.
	 * Arguments are typed from ABI, returns TransactionHashType.
	 *
	 * @example
	 * ```typescript
	 * // args typed: (to: AddressType, amount: bigint)
	 * const txHash = await contract.write.transfer(to, 1000n);
	 * ```
	 */
	readonly write: ContractWriteMethods<TAbi>;

	/**
	 * Gas estimation for write methods
	 *
	 * Same signature as write methods but returns gas estimate as bigint.
	 *
	 * @example
	 * ```typescript
	 * const gas = await contract.estimateGas.transfer(to, 1000n);
	 * ```
	 */
	readonly estimateGas: ContractEstimateGasMethods<TAbi>;

	/**
	 * Event filters - async generators for streaming events
	 *
	 * Filter args are typed from indexed event parameters.
	 * Decoded log args are typed from all event parameters.
	 *
	 * @example
	 * ```typescript
	 * // filter typed: { from?: AddressType, to?: AddressType }
	 * // log.args typed: { from: AddressType, to: AddressType, value: bigint }
	 * for await (const log of contract.events.Transfer({ from: address })) {
	 *   console.log(log.args.from, log.args.to, log.args.value);
	 * }
	 * ```
	 */
	readonly events: ContractEventFilters<TAbi>;
};

/**
 * Options for creating a Contract instance
 */
export type ContractOptions<TAbi extends readonly Item[]> = {
	/** Contract address */
	address: AddressType | `0x${string}`;
	/** Contract ABI */
	abi: TAbi;
	/** EIP-1193 provider */
	provider: TypedProvider;
};
