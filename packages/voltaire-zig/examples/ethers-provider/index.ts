/**
 * Ethers v6 Style Provider
 *
 * An ethers v6-compatible JsonRpcProvider implementation using Voltaire primitives.
 *
 * @module examples/ethers-provider
 */

export { EthersProvider, NetworkImpl } from "./EthersProvider.js";
export type {
	EthersProviderOptions,
	Network,
	Networkish,
	BlockTag,
	FeeData,
	Block,
	Log,
	TransactionReceipt,
	TransactionResponse,
	AccessListEntry,
	Signature,
	TransactionRequest,
	TransactionLike,
	Filter,
	EventFilter,
	ProviderEvent,
	Listener,
	JsonRpcPayload,
	JsonRpcResponse,
	JsonRpcError,
	ProviderError,
	Subscriber,
	EthersProvider as EthersProviderInterface,
} from "./EthersProviderTypes.js";
export { ErrorCode } from "./EthersProviderTypes.js";
