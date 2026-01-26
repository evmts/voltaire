/**
 * @fileoverview Effect Schema definitions for transaction receipts and logs.
 * Provides type-safe validation for receipt data from RPC responses.
 *
 * @module Receipt/ReceiptSchema
 * @since 0.0.1
 */

import type { AddressType } from "@tevm/voltaire/Address";
import type { HashType } from "@tevm/voltaire/Hash";
import * as S from "effect/Schema";
import { Hex as AddressSchema } from "../Address/Hex.js";

/**
 * Type representing an event log emitted during transaction execution.
 *
 * @description
 * Event logs are emitted by smart contracts during transaction execution
 * using the LOG0-LOG4 EVM opcodes. They contain:
 * - The emitting contract address
 * - Up to 4 indexed topics (32 bytes each)
 * - Arbitrary data payload
 * - Location metadata (block, transaction, log index)
 *
 * @since 0.0.1
 *
 * @example
 * ```typescript
 * const log: LogType = {
 *   address: contractAddress,      // Contract that emitted
 *   topics: [eventSignature, ...], // Indexed params
 *   data: new Uint8Array([...]),   // Non-indexed params
 *   blockNumber: 12345n,
 *   transactionHash: txHash,
 *   transactionIndex: 0,
 *   blockHash: blockHash,
 *   logIndex: 0,
 *   removed: false
 * }
 * ```
 */
export interface LogType {
	/**
	 * Address of the contract that emitted this log.
	 * 20-byte Ethereum address.
	 */
	readonly address: AddressType;
	/**
	 * Array of indexed event parameters.
	 * First topic is typically the event signature hash.
	 * Max 4 topics (LOG4 opcode limit).
	 */
	readonly topics: readonly HashType[];
	/**
	 * ABI-encoded non-indexed event parameters.
	 */
	readonly data: Uint8Array;
	/**
	 * Block number containing this log.
	 */
	readonly blockNumber: bigint;
	/**
	 * Hash of the transaction that emitted this log.
	 */
	readonly transactionHash: HashType;
	/**
	 * Index of the transaction within the block.
	 */
	readonly transactionIndex: number;
	/**
	 * Hash of the block containing this log.
	 */
	readonly blockHash: HashType;
	/**
	 * Index of this log within the block's logs array.
	 */
	readonly logIndex: number;
	/**
	 * Whether this log was removed due to chain reorganization.
	 * True if the log is no longer valid.
	 */
	readonly removed: boolean;
}

/**
 * Type representing a transaction receipt with execution results.
 *
 * @description
 * A transaction receipt is created when a transaction is included in a block.
 * It contains the results of transaction execution including:
 * - Execution status or state root (pre/post-Byzantium)
 * - Gas consumption
 * - Event logs emitted
 * - Contract creation address (if applicable)
 *
 * @since 0.0.1
 *
 * @example
 * ```typescript
 * const receipt: ReceiptType = {
 *   transactionHash: txHash,
 *   blockNumber: 12345n,
 *   blockHash: blockHash,
 *   transactionIndex: 0,
 *   from: senderAddress,
 *   to: recipientAddress,
 *   cumulativeGasUsed: 21000n,
 *   gasUsed: 21000n,
 *   effectiveGasPrice: 1000000000n,
 *   contractAddress: null,
 *   logs: [],
 *   logsBloom: new Uint8Array(256),
 *   type: 'eip1559',
 *   status: 1
 * }
 * ```
 */
export interface ReceiptType {
	/**
	 * Hash of the transaction this receipt belongs to.
	 * 32-byte Keccak-256 hash.
	 */
	readonly transactionHash: HashType;
	/**
	 * Block number containing this transaction.
	 */
	readonly blockNumber: bigint;
	/**
	 * Hash of the block containing this transaction.
	 * 32-byte block hash.
	 */
	readonly blockHash: HashType;
	/**
	 * Position of this transaction within the block.
	 * 0-indexed.
	 */
	readonly transactionIndex: number;
	/**
	 * Address of the transaction sender.
	 * 20-byte Ethereum address.
	 */
	readonly from: AddressType;
	/**
	 * Address of the transaction recipient.
	 * Null for contract creation transactions.
	 */
	readonly to: AddressType | null;
	/**
	 * Total gas used in the block up to and including this transaction.
	 * Used for calculating position-based gas refunds.
	 */
	readonly cumulativeGasUsed: bigint;
	/**
	 * Gas consumed by this specific transaction.
	 */
	readonly gasUsed: bigint;
	/**
	 * Address of the created contract.
	 * Only set when this is a contract creation transaction (to is null).
	 */
	readonly contractAddress: AddressType | null;
	/**
	 * Array of event logs emitted during transaction execution.
	 */
	readonly logs: readonly LogType[];
	/**
	 * 256-byte bloom filter for efficient log querying.
	 * Contains encoded log addresses and topics.
	 */
	readonly logsBloom: Uint8Array;
	/**
	 * Transaction execution status.
	 * 0 = failed (reverted), 1 = success (post-Byzantium receipts).
	 */
	readonly status?: 0 | 1;
	/**
	 * State root (pre-Byzantium receipts only).
	 */
	readonly root?: HashType;
	/**
	 * Effective gas price paid by this transaction.
	 */
	readonly effectiveGasPrice: bigint;
	/**
	 * Transaction type identifier.
	 */
	readonly type: "legacy" | "eip2930" | "eip1559" | "eip4844" | "eip7702";
	/**
	 * Blob gas used (EIP-4844).
	 */
	readonly blobGasUsed?: bigint;
	/**
	 * Blob gas price (EIP-4844).
	 */
	readonly blobGasPrice?: bigint;
}

/**
 * Internal schema for validating HashType.
 * @internal
 */
const HashTypeSchema = S.declare<HashType>(
	(u): u is HashType => u instanceof Uint8Array && u.length === 32,
	{ identifier: "HashType" },
);

/**
 * Internal schema for nullable addresses.
 * @internal
 */
const NullableAddressSchema = S.NullOr(AddressSchema);

/**
 * Internal schema for validating LogType.
 * @internal
 */
const LogTypeSchema = S.declare<LogType>(
	(u): u is LogType => {
		if (typeof u !== "object" || u === null) return false;
		const log = u as Record<string, unknown>;
		return (
			"address" in log &&
			log.address instanceof Uint8Array &&
			"topics" in log &&
			Array.isArray(log.topics) &&
			"data" in log &&
			log.data instanceof Uint8Array &&
			"logIndex" in log &&
			typeof log.logIndex === "number"
		);
	},
	{ identifier: "Log" },
);

/**
 * Effect Schema for validating branded ReceiptType.
 *
 * @description
 * Runtime type guard that validates an unknown value conforms to ReceiptType.
 * Checks for required fields: transactionHash, blockNumber, blockHash, effectiveGasPrice, type.
 * Validates that either status (post-Byzantium) OR root (pre-Byzantium) is present, not both.
 *
 * @since 0.0.1
 *
 * @see {@link ReceiptSchema} for the full transforming schema
 */
export const ReceiptTypeSchema = S.declare<ReceiptType>(
	(u): u is ReceiptType => {
		if (typeof u !== "object" || u === null) return false;
		const receipt = u as Record<string, unknown>;
		const hasTransactionHash =
			"transactionHash" in receipt &&
			receipt.transactionHash instanceof Uint8Array;
		const hasBlockNumber =
			"blockNumber" in receipt && typeof receipt.blockNumber === "bigint";
		const hasBlockHash =
			"blockHash" in receipt && receipt.blockHash instanceof Uint8Array;
		const hasEffectiveGasPrice =
			"effectiveGasPrice" in receipt &&
			typeof receipt.effectiveGasPrice === "bigint";
		const hasType =
			"type" in receipt &&
			(receipt.type === "legacy" ||
				receipt.type === "eip2930" ||
				receipt.type === "eip1559" ||
				receipt.type === "eip4844" ||
				receipt.type === "eip7702");
		const hasStatus =
			"status" in receipt &&
			(receipt.status === 0 || receipt.status === 1);
		const hasRoot =
			"root" in receipt && receipt.root instanceof Uint8Array;

		// Must have either status OR root, not both
		const hasValidStatusOrRoot =
			(hasStatus && !hasRoot) || (!hasStatus && hasRoot);

		return (
			hasTransactionHash &&
			hasBlockNumber &&
			hasBlockHash &&
			hasEffectiveGasPrice &&
			hasType &&
			hasValidStatusOrRoot
		);
	},
	{ identifier: "Receipt" },
);

/**
 * Internal structured schema for log input validation.
 * @internal
 */
const LogSchemaInternal = S.Struct({
	address: AddressSchema,
	topics: S.Array(HashTypeSchema),
	data: S.Uint8ArrayFromSelf,
	blockNumber: S.BigIntFromSelf,
	transactionHash: HashTypeSchema,
	transactionIndex: S.Number,
	blockHash: HashTypeSchema,
	logIndex: S.Number,
	removed: S.Boolean,
});

/**
 * Effect Schema for validating event logs.
 *
 * @description
 * Validates and transforms log data from RPC responses into LogType.
 * Handles address parsing and type conversions.
 *
 * @since 0.0.1
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { LogSchema } from 'voltaire-effect/primitives/Receipt'
 *
 * const log = S.decodeSync(LogSchema)({
 *   address: '0x742d35Cc6634C0532925a3b844Bc9e7595f251e3',
 *   topics: [topic0, topic1],
 *   data: new Uint8Array([]),
 *   blockNumber: 12345n,
 *   transactionHash: txHash,
 *   transactionIndex: 0,
 *   blockHash: blockHash,
 *   logIndex: 0,
 *   removed: false
 * })
 * ```
 *
 * @throws {ParseError} When log data is invalid or malformed.
 *
 * @see {@link LogType} for the output type
 */
export const LogSchema: S.Schema<
	LogType,
	S.Schema.Encoded<typeof LogSchemaInternal>
> = S.transform(LogSchemaInternal, LogTypeSchema, {
	strict: true,
	decode: (d) => d as LogType,
	encode: (e) => e,
});

/**
 * Transaction type literal schema.
 * @internal
 */
const TransactionTypeSchema = S.Literal(
	"legacy",
	"eip2930",
	"eip1559",
	"eip4844",
	"eip7702",
);

/**
 * Common receipt fields shared between Pre and Post-Byzantium receipts.
 * @internal
 */
const CommonReceiptFields = S.Struct({
	transactionHash: HashTypeSchema,
	blockNumber: S.BigIntFromSelf,
	blockHash: HashTypeSchema,
	transactionIndex: S.Number,
	from: AddressSchema,
	to: NullableAddressSchema,
	cumulativeGasUsed: S.BigIntFromSelf,
	gasUsed: S.BigIntFromSelf,
	effectiveGasPrice: S.BigIntFromSelf,
	contractAddress: NullableAddressSchema,
	logs: S.Array(LogSchema),
	logsBloom: S.Uint8ArrayFromSelf,
	type: TransactionTypeSchema,
	blobGasUsed: S.optional(S.BigIntFromSelf),
	blobGasPrice: S.optional(S.BigIntFromSelf),
});

/**
 * Pre-Byzantium receipt schema (uses root instead of status).
 * @internal
 */
const PreByzantiumReceiptSchema = S.extend(
	CommonReceiptFields,
	S.Struct({
		root: HashTypeSchema,
		status: S.optional(S.Never),
	}),
);

/**
 * Post-Byzantium receipt schema (uses status instead of root).
 * @internal
 */
const PostByzantiumReceiptSchema = S.extend(
	CommonReceiptFields,
	S.Struct({
		status: S.Literal(0, 1),
		root: S.optional(S.Never),
	}),
);

/**
 * Internal union schema for receipt input validation.
 * Handles both Pre-Byzantium (root) and Post-Byzantium (status) receipts.
 * @internal
 */
const ReceiptSchemaInternal = S.Union(
	PreByzantiumReceiptSchema,
	PostByzantiumReceiptSchema,
);

/**
 * Effect Schema for validating transaction receipts.
 *
 * @description
 * Validates and transforms receipt data from RPC responses into ReceiptType.
 * Handles:
 * - Address parsing (from, to, contractAddress)
 * - Hash validation (transactionHash, blockHash)
 * - Nested log validation
 * - Status validation (0 or 1)
 *
 * Use this schema to validate receipts returned from `eth_getTransactionReceipt`
 * or similar RPC calls.
 *
 * @since 0.0.1
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { ReceiptSchema } from 'voltaire-effect/primitives/Receipt'
 *
 * const receipt = S.decodeSync(ReceiptSchema)({
 *   transactionHash: txHash,
 *   blockNumber: 12345n,
 *   blockHash: blockHash,
 *   transactionIndex: 0,
 *   from: '0x742d35Cc6634C0532925a3b844Bc9e7595f251e3',
 *   to: '0xAnotherAddress...',
 *   cumulativeGasUsed: 21000n,
 *   gasUsed: 21000n,
 *   contractAddress: null,
 *   logs: [],
 *   logsBloom: new Uint8Array(256),
 *   status: 1
 * })
 * ```
 *
 * @example
 * ```typescript
 * // Check execution status
 * if (receipt.status === 1) {
 *   console.log('Transaction succeeded')
 * } else {
 *   console.log('Transaction failed')
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Use with Effect for error handling
 * import * as Effect from 'effect/Effect'
 *
 * const receipt = await Effect.runPromise(
 *   S.decodeUnknown(ReceiptSchema)(rpcResponse).pipe(
 *     Effect.catchAll((e) => Effect.fail(new Error('Invalid receipt')))
 *   )
 * )
 * ```
 *
 * @throws {ParseError} When receipt data is invalid or malformed.
 *
 * @see {@link ReceiptType} for the output type
 * @see {@link LogSchema} for nested log validation
 */
export const ReceiptSchema: S.Schema<
	ReceiptType,
	S.Schema.Encoded<typeof ReceiptSchemaInternal>
> = S.transform(ReceiptSchemaInternal, ReceiptTypeSchema, {
	strict: true,
	decode: (d) => d as ReceiptType,
	encode: (e) => e as S.Schema.Type<typeof ReceiptSchemaInternal>,
});

/**
 * Default schema export for receipt validation.
 * Alias for {@link ReceiptSchema}.
 *
 * @since 0.0.1
 * @see {@link ReceiptSchema}
 */
export { ReceiptSchema as Schema };
