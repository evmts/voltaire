/**
 * @fileoverview Common Effect Schemas for JSON-RPC primitives.
 * Provides shared schemas for Ethereum JSON-RPC request/response validation.
 *
 * @module jsonrpc/schemas/common
 * @since 0.1.0
 */

import * as S from "effect/Schema";

// =============================================================================
// JSON-RPC Primitives
// =============================================================================

/**
 * Schema for JSON-RPC request/response ID.
 * Per spec, id can be number, string, or null.
 */
export const JsonRpcIdSchema = S.Union(S.Number, S.String, S.Null);

/** Type for JsonRpcIdSchema */
export type JsonRpcId = S.Schema.Type<typeof JsonRpcIdSchema>;

/**
 * JSON-RPC version literal.
 */
export const JsonRpcVersionSchema = S.Literal("2.0");

// =============================================================================
// Ethereum Hex Primitives (RPC wire format)
// =============================================================================

/**
 * Generic hex string schema.
 * Matches any 0x-prefixed hex string.
 */
export const HexSchema = S.String.pipe(
	S.pattern(/^0x[a-fA-F0-9]*$/, {
		message: () => "Expected hex string with 0x prefix",
	}),
);

/** Type for HexSchema */
export type Hex = S.Schema.Type<typeof HexSchema>;

/**
 * Address hex string schema (40 hex chars = 20 bytes).
 */
export const AddressHexSchema = S.String.pipe(
	S.pattern(/^0x[a-fA-F0-9]{40}$/, {
		message: () => "Expected 20-byte address hex string",
	}),
);

/** Type for AddressHexSchema */
export type AddressHex = S.Schema.Type<typeof AddressHexSchema>;

/**
 * Bytes32 hex string schema (64 hex chars = 32 bytes).
 * Used for hashes, storage keys, etc.
 */
export const Bytes32HexSchema = S.String.pipe(
	S.pattern(/^0x[a-fA-F0-9]{64}$/, {
		message: () => "Expected 32-byte hex string",
	}),
);

/** Type for Bytes32HexSchema */
export type Bytes32Hex = S.Schema.Type<typeof Bytes32HexSchema>;

/**
 * Quantity hex schema.
 * Ethereum RPC uses hex encoding for all quantities (no leading zeros except for 0x0).
 * For validation we accept any hex, the node handles encoding.
 */
export const QuantityHexSchema = HexSchema;

/** Type for QuantityHexSchema */
export type QuantityHex = S.Schema.Type<typeof QuantityHexSchema>;

// =============================================================================
// Block Tag
// =============================================================================

/**
 * Block tag schema.
 * Accepts named tags or hex block numbers.
 */
export const BlockTagSchema = S.Union(
	S.Literal("latest"),
	S.Literal("earliest"),
	S.Literal("pending"),
	S.Literal("safe"),
	S.Literal("finalized"),
	QuantityHexSchema,
);

/** Type for BlockTagSchema */
export type BlockTag = S.Schema.Type<typeof BlockTagSchema>;

// =============================================================================
// Transaction Request (eth_call, eth_estimateGas params)
// =============================================================================

/**
 * Transaction request object schema.
 * Used for eth_call, eth_estimateGas, eth_sendTransaction params.
 */
export const TransactionRequestSchema = S.Struct({
	from: S.optional(AddressHexSchema),
	to: S.optional(S.NullOr(AddressHexSchema)),
	gas: S.optional(QuantityHexSchema),
	gasPrice: S.optional(QuantityHexSchema),
	maxFeePerGas: S.optional(QuantityHexSchema),
	maxPriorityFeePerGas: S.optional(QuantityHexSchema),
	value: S.optional(QuantityHexSchema),
	data: S.optional(HexSchema),
	input: S.optional(HexSchema),
	nonce: S.optional(QuantityHexSchema),
	// EIP-2930 access list
	accessList: S.optional(
		S.Array(
			S.Struct({
				address: AddressHexSchema,
				storageKeys: S.Array(Bytes32HexSchema),
			}),
		),
	),
	// EIP-4844 blob fields
	maxFeePerBlobGas: S.optional(QuantityHexSchema),
	blobVersionedHashes: S.optional(S.Array(Bytes32HexSchema)),
	// EIP-7702 authorization list
	authorizationList: S.optional(
		S.Array(
			S.Struct({
				chainId: QuantityHexSchema,
				address: AddressHexSchema,
				nonce: QuantityHexSchema,
				v: QuantityHexSchema,
				r: Bytes32HexSchema,
				s: Bytes32HexSchema,
			}),
		),
	),
});

/** Type for TransactionRequestSchema */
export type TransactionRequest = S.Schema.Type<typeof TransactionRequestSchema>;

// =============================================================================
// Log Filter (eth_getLogs, eth_newFilter params)
// =============================================================================

/**
 * Topic filter value.
 * Can be a single topic, array of topics (OR), or null (wildcard).
 */
export const TopicFilterValueSchema = S.Union(
	Bytes32HexSchema,
	S.Array(Bytes32HexSchema),
	S.Null,
);

/**
 * Log filter schema.
 * Used for eth_getLogs, eth_newFilter params.
 */
export const LogFilterSchema = S.Struct({
	address: S.optional(S.Union(AddressHexSchema, S.Array(AddressHexSchema))),
	topics: S.optional(S.Array(TopicFilterValueSchema)),
	fromBlock: S.optional(BlockTagSchema),
	toBlock: S.optional(BlockTagSchema),
	blockHash: S.optional(Bytes32HexSchema),
});

/** Type for LogFilterSchema */
export type LogFilter = S.Schema.Type<typeof LogFilterSchema>;

// =============================================================================
// State Override (eth_call state overrides)
// =============================================================================

/**
 * Account state override schema.
 * Used for eth_call state overrides.
 */
export const AccountStateOverrideSchema = S.Struct({
	balance: S.optional(QuantityHexSchema),
	nonce: S.optional(QuantityHexSchema),
	code: S.optional(HexSchema),
	state: S.optional(S.Record({ key: Bytes32HexSchema, value: Bytes32HexSchema })),
	stateDiff: S.optional(
		S.Record({ key: Bytes32HexSchema, value: Bytes32HexSchema }),
	),
});

/**
 * State override set schema.
 * Maps addresses to account state overrides.
 */
export const StateOverrideSetSchema = S.Record({
	key: AddressHexSchema,
	value: AccountStateOverrideSchema,
});

/** Type for StateOverrideSetSchema */
export type StateOverrideSet = S.Schema.Type<typeof StateOverrideSetSchema>;

// =============================================================================
// Block Override (eth_call block overrides)
// =============================================================================

/**
 * Block override schema.
 * Used for eth_call block parameter overrides.
 */
export const BlockOverrideSchema = S.Struct({
	number: S.optional(QuantityHexSchema),
	difficulty: S.optional(QuantityHexSchema),
	time: S.optional(QuantityHexSchema),
	gasLimit: S.optional(QuantityHexSchema),
	coinbase: S.optional(AddressHexSchema),
	random: S.optional(Bytes32HexSchema),
	baseFee: S.optional(QuantityHexSchema),
	blobBaseFee: S.optional(QuantityHexSchema),
});

/** Type for BlockOverrideSchema */
export type BlockOverride = S.Schema.Type<typeof BlockOverrideSchema>;

// =============================================================================
// RPC Result Types
// =============================================================================

/**
 * Log RPC response schema.
 */
export const LogRpcSchema = S.Struct({
	address: AddressHexSchema,
	topics: S.Array(Bytes32HexSchema),
	data: HexSchema,
	blockNumber: S.NullOr(QuantityHexSchema),
	transactionHash: S.NullOr(Bytes32HexSchema),
	transactionIndex: S.NullOr(QuantityHexSchema),
	blockHash: S.NullOr(Bytes32HexSchema),
	logIndex: S.NullOr(QuantityHexSchema),
	removed: S.Boolean,
});

/** Type for LogRpcSchema */
export type LogRpc = S.Schema.Type<typeof LogRpcSchema>;

/**
 * Access list item RPC schema.
 */
export const AccessListItemRpcSchema = S.Struct({
	address: AddressHexSchema,
	storageKeys: S.Array(Bytes32HexSchema),
});

/**
 * Transaction RPC response schema.
 * Represents a transaction as returned by eth_getTransactionByHash etc.
 */
export const TransactionRpcSchema = S.Struct({
	hash: Bytes32HexSchema,
	nonce: QuantityHexSchema,
	blockHash: S.NullOr(Bytes32HexSchema),
	blockNumber: S.NullOr(QuantityHexSchema),
	transactionIndex: S.NullOr(QuantityHexSchema),
	from: AddressHexSchema,
	to: S.NullOr(AddressHexSchema),
	value: QuantityHexSchema,
	gasPrice: S.optional(QuantityHexSchema),
	gas: QuantityHexSchema,
	input: HexSchema,
	// EIP-2718 type
	type: S.optional(QuantityHexSchema),
	// EIP-2930
	accessList: S.optional(S.Array(AccessListItemRpcSchema)),
	chainId: S.optional(QuantityHexSchema),
	// EIP-1559
	maxFeePerGas: S.optional(QuantityHexSchema),
	maxPriorityFeePerGas: S.optional(QuantityHexSchema),
	// EIP-4844
	maxFeePerBlobGas: S.optional(QuantityHexSchema),
	blobVersionedHashes: S.optional(S.Array(Bytes32HexSchema)),
	// Signature
	v: QuantityHexSchema,
	r: Bytes32HexSchema,
	s: Bytes32HexSchema,
	yParity: S.optional(QuantityHexSchema),
});

/** Type for TransactionRpcSchema */
export type TransactionRpc = S.Schema.Type<typeof TransactionRpcSchema>;

/**
 * Receipt RPC response schema.
 */
export const ReceiptRpcSchema = S.Struct({
	transactionHash: Bytes32HexSchema,
	transactionIndex: QuantityHexSchema,
	blockHash: Bytes32HexSchema,
	blockNumber: QuantityHexSchema,
	from: AddressHexSchema,
	to: S.NullOr(AddressHexSchema),
	cumulativeGasUsed: QuantityHexSchema,
	gasUsed: QuantityHexSchema,
	effectiveGasPrice: QuantityHexSchema,
	contractAddress: S.NullOr(AddressHexSchema),
	logs: S.Array(LogRpcSchema),
	logsBloom: HexSchema,
	type: QuantityHexSchema,
	// Post-Byzantium
	status: S.optional(QuantityHexSchema),
	// Pre-Byzantium
	root: S.optional(Bytes32HexSchema),
	// EIP-4844
	blobGasUsed: S.optional(QuantityHexSchema),
	blobGasPrice: S.optional(QuantityHexSchema),
});

/** Type for ReceiptRpcSchema */
export type ReceiptRpc = S.Schema.Type<typeof ReceiptRpcSchema>;

/**
 * Withdrawal RPC schema (post-Shanghai).
 */
export const WithdrawalRpcSchema = S.Struct({
	index: QuantityHexSchema,
	validatorIndex: QuantityHexSchema,
	address: AddressHexSchema,
	amount: QuantityHexSchema,
});

/** Type for WithdrawalRpcSchema */
export type WithdrawalRpc = S.Schema.Type<typeof WithdrawalRpcSchema>;

/**
 * Block RPC response schema (without full transactions).
 */
export const BlockRpcSchema = S.Struct({
	number: S.NullOr(QuantityHexSchema),
	hash: S.NullOr(Bytes32HexSchema),
	parentHash: Bytes32HexSchema,
	nonce: S.optional(S.NullOr(HexSchema)),
	sha3Uncles: Bytes32HexSchema,
	logsBloom: S.NullOr(HexSchema),
	transactionsRoot: Bytes32HexSchema,
	stateRoot: Bytes32HexSchema,
	receiptsRoot: Bytes32HexSchema,
	miner: AddressHexSchema,
	difficulty: S.optional(QuantityHexSchema),
	totalDifficulty: S.optional(S.NullOr(QuantityHexSchema)),
	extraData: HexSchema,
	size: QuantityHexSchema,
	gasLimit: QuantityHexSchema,
	gasUsed: QuantityHexSchema,
	timestamp: QuantityHexSchema,
	// Transactions can be hashes or full objects
	transactions: S.Union(S.Array(Bytes32HexSchema), S.Array(TransactionRpcSchema)),
	uncles: S.Array(Bytes32HexSchema),
	// EIP-1559
	baseFeePerGas: S.optional(QuantityHexSchema),
	// Post-Shanghai
	withdrawals: S.optional(S.Array(WithdrawalRpcSchema)),
	withdrawalsRoot: S.optional(Bytes32HexSchema),
	// EIP-4844
	blobGasUsed: S.optional(QuantityHexSchema),
	excessBlobGas: S.optional(QuantityHexSchema),
	// EIP-4788
	parentBeaconBlockRoot: S.optional(Bytes32HexSchema),
	// PoW
	mixHash: S.optional(Bytes32HexSchema),
});

/** Type for BlockRpcSchema */
export type BlockRpc = S.Schema.Type<typeof BlockRpcSchema>;

/**
 * Sync status RPC response schema.
 */
export const SyncStatusRpcSchema = S.Union(
	S.Boolean,
	S.Struct({
		startingBlock: QuantityHexSchema,
		currentBlock: QuantityHexSchema,
		highestBlock: QuantityHexSchema,
	}),
);

/** Type for SyncStatusRpcSchema */
export type SyncStatusRpc = S.Schema.Type<typeof SyncStatusRpcSchema>;

/**
 * Fee history RPC response schema.
 */
export const FeeHistoryRpcSchema = S.Struct({
	oldestBlock: QuantityHexSchema,
	baseFeePerGas: S.Array(QuantityHexSchema),
	gasUsedRatio: S.Array(S.Number),
	reward: S.optional(S.Array(S.Array(QuantityHexSchema))),
	baseFeePerBlobGas: S.optional(S.Array(QuantityHexSchema)),
	blobGasUsedRatio: S.optional(S.Array(S.Number)),
});

/** Type for FeeHistoryRpcSchema */
export type FeeHistoryRpc = S.Schema.Type<typeof FeeHistoryRpcSchema>;

/**
 * Access list result RPC response schema.
 */
export const AccessListResultRpcSchema = S.Struct({
	accessList: S.Array(AccessListItemRpcSchema),
	gasUsed: QuantityHexSchema,
	error: S.optional(S.String),
});

/** Type for AccessListResultRpcSchema */
export type AccessListResultRpc = S.Schema.Type<typeof AccessListResultRpcSchema>;

/**
 * Proof RPC response schema (eth_getProof).
 */
export const AccountProofRpcSchema = S.Struct({
	address: AddressHexSchema,
	accountProof: S.Array(HexSchema),
	balance: QuantityHexSchema,
	codeHash: Bytes32HexSchema,
	nonce: QuantityHexSchema,
	storageHash: Bytes32HexSchema,
	storageProof: S.Array(
		S.Struct({
			key: Bytes32HexSchema,
			value: QuantityHexSchema,
			proof: S.Array(HexSchema),
		}),
	),
});

/** Type for AccountProofRpcSchema */
export type AccountProofRpc = S.Schema.Type<typeof AccountProofRpcSchema>;
