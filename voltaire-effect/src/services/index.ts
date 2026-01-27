/**
 * @fileoverview Main services module exports for voltaire-effect.
 *
 * @module services
 * @since 0.0.1
 *
 * @description
 * This is the main entry point for all voltaire-effect services. It re-exports
 * all service definitions, implementations, and related types.
 *
 * ## Service Categories
 *
 * ### Transport
 * Low-level JSON-RPC communication with Ethereum nodes.
 * - {@link TransportService} - Service interface
 * - {@link HttpTransport} - HTTP transport layer
 * - {@link WebSocketTransport} - WebSocket transport layer
 * - {@link BrowserTransport} - Browser wallet (window.ethereum) transport
 * - {@link CustomTransport} - Custom EIP-1193 provider transport
 * - {@link TestTransport} - Mock transport for testing
 * - {@link RateLimitedTransport} - Rate-limited transport wrapper
 *
 * ### Provider
 * Read-only blockchain operations (blocks, transactions, balances).
 * - {@link ProviderService} - Service interface
 * - {@link Provider} - Live implementation layer
 *
 * ### ENS
 * Ethereum Name Service resolution (names, reverse lookups, records).
 * - {@link EnsService} - Service interface
 * - {@link DefaultEns} - Live implementation layer
 *
 * ### Signer
 * Signing and transaction operations.
 * - {@link SignerService} - Service interface
 * - {@link Signer} - Namespace with Live layer and composition helpers
 *
 * ### Account
 * Cryptographic signing implementations.
 * - {@link AccountService} - Service interface
 * - {@link LocalAccount} - Local private key signing
 * - {@link JsonRpcAccount} - Remote JSON-RPC signing
 *
 * ### Contract
 * Type-safe smart contract interactions.
 * - {@link Contract} - Factory to create contract instances
 *
 * @example Typical usage pattern
 * ```typescript
 * import { Effect } from 'effect'
 * import {
 *   ProviderService,
 *   Provider,
 *   HttpTransport
 * } from 'voltaire-effect'
 *
 * const program = Effect.gen(function* () {
 *   const provider = yield* ProviderService
 *   return yield* provider.getBlockNumber()
 * }).pipe(
 *   Effect.provide(Provider),
 *   Effect.provide(HttpTransport('https://mainnet.infura.io/v3/YOUR_KEY'))
 * )
 *
 * await Effect.runPromise(program)
 * ```
 */

// Blockchain exports
export {
	type Block,
	BlockchainError,
	BlockchainService,
	type BlockchainShape,
	ForkBlockchain,
	type ForkBlockchainOptions,
	type HexInput as BlockchainHexInput,
	InMemoryBlockchain,
} from "../blockchain/index.js";
// TransactionStream exports
export {
	makeTransactionStream,
	TransactionStream,
	TransactionStreamError,
	TransactionStreamService,
	type TransactionStreamShape,
} from "../transaction/index.js";
// AbiEncoder exports
export {
	AbiDecodeError,
	AbiEncodeError,
	AbiEncoderService,
	type AbiEncoderShape,
	DefaultAbiEncoder,
} from "./AbiEncoder/index.js";
// Account exports
export {
	AccountError,
	AccountService,
	type AccountShape,
	JsonRpcAccount,
	LocalAccount,
	type UnsignedTransaction,
} from "./Account/index.js";
// BlockStream exports
export {
	BlockStream,
	BlockStreamError,
	BlockStreamService,
	type BlockStreamShape,
	makeBlockStream,
} from "./BlockStream/index.js";
// Cache exports
export {
	CacheService,
	type CacheShape,
	MemoryCache,
	type MemoryCacheOptions,
	NoopCache,
} from "./Cache/index.js";
// Ccip exports
export {
	CcipError,
	type CcipRequest,
	CcipService,
	type CcipShape,
	DefaultCcip,
	NoopCcip,
} from "./Ccip/index.js";
// Chain exports
export {
	arbitrum,
	arbitrumBlockExplorers,
	arbitrumConfig,
	arbitrumContracts,
	type BlockExplorerConfig,
	BlockExplorerService,
	base,
	baseBlockExplorers,
	baseConfig,
	baseContracts,
	type ChainConfig,
	type ChainContract,
	ChainService,
	type ContractsConfig,
	ContractsService,
	mainnet,
	mainnetBlockExplorers,
	mainnetConfig,
	mainnetContracts,
	optimism,
	optimismBlockExplorers,
	optimismConfig,
	optimismContracts,
	polygon,
	polygonBlockExplorers,
	polygonConfig,
	polygonContracts,
	type RpcUrlsConfig,
	rpcUrlsByChainId,
	sepolia,
	sepoliaBlockExplorers,
	sepoliaConfig,
	sepoliaContracts,
} from "./Chain/index.js";
// Contract exports
export {
	type Abi as ContractAbi,
	type AbiItem as ContractAbiItem,
	type BlockTag as ContractBlockTag,
	Contract,
	ContractCallError,
	ContractError,
	ContractEventError,
	type ContractInstance,
	ContractWriteError,
	type DecodedEvent,
	type EventFilter,
} from "./Contract/index.js";
// Debug exports
export {
	Debug,
	DebugService,
	type DebugShape,
	type DebugTraceConfig,
} from "./Debug/index.js";
// Engine API exports
export {
	EngineApi,
	EngineApiService,
	type EngineApiShape,
} from "./EngineApi/index.js";
// ENS exports
export {
	DefaultEns,
	ENS_REGISTRY_ADDRESS,
	ENS_UNIVERSAL_RESOLVER_ADDRESS,
	EnsError,
	EnsService,
	type EnsShape,
	type GetEnsAddressParams,
	type GetEnsAvatarParams,
	type GetEnsNameParams,
	type GetEnsResolverParams,
	type GetEnsTextParams,
	getEnsAddress,
	getEnsAvatar,
	getEnsName,
	getEnsResolver,
	getEnsText,
} from "./Ens/index.js";
// FeeEstimator exports
export {
	DefaultFeeEstimator,
	FeeEstimationError,
	FeeEstimatorService,
	type FeeEstimatorShape,
	type FeeValues,
	type FeeValuesEIP1559,
	type FeeValuesLegacy,
	makeFeeEstimator,
} from "./FeeEstimator/index.js";
// Formatter exports
export {
	ArbitrumFormatter,
	DefaultFormatter,
	FormatError,
	FormatterService,
	type FormatterShape,
	OptimismFormatter,
	ZkSyncFormatter,
} from "./Formatter/index.js";
// Kzg exports
export {
	DefaultKzg,
	KzgError,
	KzgService,
	type KzgShape,
	NoopKzg,
} from "./Kzg/index.js";
// Multicall functions (not a service - just Effect functions depending on TransportService)
export {
	aggregate3,
	BalanceResolver,
	GetBalance,
	MULTICALL3_ADDRESS,
	type MulticallCall,
	MulticallError,
	type MulticallResult,
} from "./Multicall/index.js";
// NonceManager exports
export {
	DefaultNonceManager,
	NonceError,
	NonceManagerService,
	type NonceManagerShape,
} from "./NonceManager/index.js";
// Provider exports
export {
	type AccessListType,
	Account as ProviderAccount,
	AccountService as ProviderAccountService,
	type AccountShape as ProviderAccountShape,
	type BackfillBlocksError,
	Blocks,
	BlocksService,
	type BlocksShape,
	type BlockTag as ProviderBlockTag,
	type BlockType,
	type CallError,
	type CallRequest,
	type CreateAccessListError,
	type CreateBlockFilterError,
	type CreateEventFilterError,
	type CreatePendingTransactionFilterError,
	type EstimateGasError,
	type EventFilter as ProviderEventFilter,
	Events,
	EventsService,
	type EventsShape,
	type FeeHistoryType,
	type FilterChanges as ProviderFilterChanges,
	type FilterId as ProviderFilterId,
	type GetBalanceError,
	type GetBlobBaseFeeError,
	type GetBlockError,
	type GetBlockNumberError,
	type GetBlockTransactionCountError,
	type GetChainIdError,
	type GetCodeError,
	type GetFeeHistoryError,
	type GetFilterChangesError,
	type GetFilterLogsError,
	type GetGasPriceError,
	type GetLogsError,
	type GetMaxPriorityFeePerGasError,
	type GetProofError,
	type GetStorageAtError,
	type GetTransactionConfirmationsError,
	type GetTransactionCountError,
	type GetTransactionError,
	type GetTransactionReceiptError,
	type GetUncleError,
	type LogFilter as ProviderLogFilter,
	type LogType,
	Network,
	NetworkService,
	type NetworkShape,
	Provider,
	ProviderConfirmationsPendingError,
	type ProviderError,
	ProviderNotFoundError,
	ProviderReceiptPendingError,
	ProviderResponseError,
	ProviderService,
	type ProviderShape,
	ProviderStreamError,
	ProviderTimeoutError,
	ProviderValidationError,
	type ReceiptType,
	type SendRawTransactionError,
	type SimulateV1BlockResult,
	type SimulateV1CallResult,
	type SimulateV1Payload,
	type SimulateV1Result,
	type SimulateV2Payload,
	type SimulateV2Result,
	Simulation,
	SimulationService,
	type SimulationShape,
	Streaming,
	StreamingService,
	type StreamingShape,
	type SyncingStatus,
	Transaction,
	TransactionService,
	type TransactionShape,
	type TransactionType,
	type UninstallFilterError,
	type WaitForTransactionReceiptError,
	type WatchBlocksError,
	type WorkResult,
} from "./Provider/index.js";
// Preset exports (layer composition helpers)
export {
	ArbitrumProvider,
	BaseProvider,
	type ComposedServices,
	createProvider,
	MainnetFullProvider,
	MainnetProvider,
	OptimismProvider,
	PolygonProvider,
	SepoliaProvider,
} from "./presets/index.js";
// RateLimiter exports
export {
	DefaultRateLimiter,
	makeRateLimiter,
	NoopRateLimiter,
	type RateLimitBehavior,
	RateLimitError,
	type RateLimiterConfig,
	RateLimiterService,
	type RateLimiterShape,
} from "./RateLimiter/index.js";
// RawProvider exports
export {
	RawProviderService,
	type RawProviderShape,
	RawProviderTransport,
	type RequestArguments as RawRequestArguments,
} from "./RawProvider/index.js";
// RpcBatch exports
export {
	EthBlockNumber,
	EthCall,
	EthChainId,
	EthEstimateGas,
	EthGasPrice,
	EthGetBalance,
	EthGetBlockByHash,
	EthGetBlockByNumber,
	EthGetCode,
	EthGetLogs,
	EthGetStorageAt,
	EthGetTransactionByHash,
	EthGetTransactionCount,
	EthGetTransactionReceipt,
	GenericRpcRequest,
	makeRpcResolver,
	RpcBatch,
	RpcBatchService,
	type RpcBatchShape,
	type RpcRequest,
} from "./RpcBatch/index.js";
// Signer exports
export {
	Signer,
	SignerError,
	SignerService,
	type SignerShape,
	type TransactionRequest,
} from "./Signer/index.js";
// TransactionSerializer exports
export {
	DefaultTransactionSerializer,
	DeserializeError,
	SerializeError,
	TransactionSerializerService,
} from "./TransactionSerializer/index.js";
// Transport exports
export {
	BrowserTransport,
	CustomTransport,
	type CustomTransportConfig,
	CustomTransportFromFn,
	cacheEnabledRef,
	type EIP1193Provider,
	HttpTransport,
	IdGenerator,
	IdGeneratorLive,
	type IdGeneratorShape,
	makeIdGenerator,
	nextId,
	RateLimitedTransport,
	retryScheduleRef,
	TestTransport,
	TransportError,
	TransportService,
	type TransportShape,
	timeoutRef,
	tracingRef,
	WebSocketTransport,
	withoutCache,
	withRetrySchedule,
	withTimeout,
	withTracing,
} from "./Transport/index.js";
