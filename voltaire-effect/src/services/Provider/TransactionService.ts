/**
 * @fileoverview Transaction service definition for transaction-related JSON-RPC calls.
 *
 * @module TransactionService
 * @since 0.3.0
 */

import type { HexType } from "@tevm/voltaire/Hex";
import * as Context from "effect/Context";
import type * as Effect from "effect/Effect";
import type {
	BlockTag,
	GetTransactionByBlockHashAndIndexError,
	GetTransactionByBlockNumberAndIndexError,
	GetTransactionConfirmationsError,
	GetTransactionError,
	GetTransactionReceiptError,
	HashInput,
	ReceiptType,
	RpcTransactionRequest,
	SendRawTransactionError,
	SendTransactionError,
	TransactionIndexInput,
	TransactionType,
	WaitForTransactionReceiptError,
} from "./ProviderService.js";

/**
 * Shape of the Transaction service.
 *
 * @since 0.3.0
 */
export type TransactionShape = {
	/** Gets a transaction by hash */
	readonly getTransaction: (
		hash: HashInput,
	) => Effect.Effect<TransactionType, GetTransactionError>;
	/** Gets a transaction receipt */
	readonly getTransactionReceipt: (
		hash: HashInput,
	) => Effect.Effect<ReceiptType, GetTransactionReceiptError>;
	/** Gets a transaction by block hash and index (if supported) */
	readonly getTransactionByBlockHashAndIndex?: (
		blockHash: HashInput,
		index: TransactionIndexInput,
	) => Effect.Effect<TransactionType, GetTransactionByBlockHashAndIndexError>;
	/** Gets a transaction by block number/tag and index (if supported) */
	readonly getTransactionByBlockNumberAndIndex?: (
		blockTag: BlockTag | bigint,
		index: TransactionIndexInput,
	) => Effect.Effect<TransactionType, GetTransactionByBlockNumberAndIndexError>;
	/** Sends a signed raw transaction */
	readonly sendRawTransaction: (
		signedTx: HexType | `0x${string}`,
	) => Effect.Effect<`0x${string}`, SendRawTransactionError>;
	/** Sends a transaction via unlocked JSON-RPC account (if supported) */
	readonly sendTransaction?: (
		tx: RpcTransactionRequest,
	) => Effect.Effect<`0x${string}`, SendTransactionError>;
	/** Waits for a transaction to be confirmed */
	readonly waitForTransactionReceipt: (
		hash: HashInput,
		opts?: {
			confirmations?: number;
			timeout?: number;
			pollingInterval?: number;
		},
	) => Effect.Effect<ReceiptType, WaitForTransactionReceiptError>;
	/** Gets the number of confirmations for a transaction */
	readonly getTransactionConfirmations: (
		hash: HashInput,
	) => Effect.Effect<bigint, GetTransactionConfirmationsError>;
};

/**
 * Transaction service for transaction-related JSON-RPC operations.
 *
 * @since 0.3.0
 */
export class TransactionService extends Context.Tag("TransactionService")<
	TransactionService,
	TransactionShape
>() {}
