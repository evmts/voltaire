/**
 * @fileoverview Transaction serializer service definition.
 *
 * @module TransactionSerializerService
 * @since 0.1.0
 *
 * @description
 * Provides an Effect-based service for serializing and deserializing
 * Ethereum transactions. Supports all transaction types (Legacy, EIP-2930,
 * EIP-1559, EIP-4844, EIP-7702).
 *
 * The service provides:
 * - Transaction serialization to RLP-encoded bytes
 * - Transaction deserialization from RLP-encoded bytes
 * - Signing payload extraction for transaction signing
 *
 * @see {@link DefaultTransactionSerializer} - The default implementation
 */

import * as Context from "effect/Context";
import * as Data from "effect/Data";
import type * as Effect from "effect/Effect";

/**
 * Error thrown when transaction serialization fails.
 *
 * @since 0.1.0
 */
export class SerializeError extends Data.TaggedError("SerializeError")<{
	/** The transaction that failed to serialize */
	readonly transaction: unknown;
	/** Human-readable error message */
	readonly message: string;
	/** Underlying error that caused the failure */
	readonly cause?: unknown;
}> {}

/**
 * Error thrown when transaction deserialization fails.
 *
 * @since 0.1.0
 */
export class DeserializeError extends Data.TaggedError("DeserializeError")<{
	/** The bytes that failed to deserialize */
	readonly bytes: Uint8Array;
	/** Human-readable error message */
	readonly message: string;
	/** Underlying error that caused the failure */
	readonly cause?: unknown;
}> {}

/**
 * Transaction serializer service for encoding/decoding transactions.
 *
 * @description
 * Provides methods for serializing transactions to bytes and deserializing
 * bytes back to transactions. Also provides signing payload extraction
 * for use with external signers.
 *
 * @since 0.1.0
 *
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import { TransactionSerializerService, DefaultTransactionSerializer } from 'voltaire-effect'
 *
 * const program = Effect.gen(function* () {
 *   const serializer = yield* TransactionSerializerService
 *   const bytes = yield* serializer.serialize(tx)
 *   const decoded = yield* serializer.deserialize(bytes)
 * }).pipe(Effect.provide(DefaultTransactionSerializer.Live))
 * ```
 */
export class TransactionSerializerService extends Context.Tag(
	"TransactionSerializerService",
)<
	TransactionSerializerService,
	{
		/**
		 * Serialize a transaction to RLP-encoded bytes.
		 *
		 * @param tx - The transaction to serialize
		 * @returns RLP-encoded transaction bytes
		 */
		readonly serialize: (
			tx: unknown,
		) => Effect.Effect<Uint8Array, SerializeError>;

		/**
		 * Deserialize RLP-encoded bytes to a transaction.
		 *
		 * @param bytes - The RLP-encoded transaction bytes
		 * @returns The deserialized transaction
		 */
		readonly deserialize: (
			bytes: Uint8Array,
		) => Effect.Effect<unknown, DeserializeError>;

		/**
		 * Get the signing payload (hash) for a transaction.
		 *
		 * @description
		 * Returns the hash that should be signed to create a valid transaction
		 * signature. This is the RLP-encoded unsigned transaction hashed with
		 * Keccak-256.
		 *
		 * @param tx - The transaction to get signing payload for
		 * @returns The signing hash as bytes
		 */
		readonly getSigningPayload: (
			tx: unknown,
		) => Effect.Effect<Uint8Array, SerializeError>;
	}
>() {}
