/**
 * @fileoverview Effect Schema for EVM event logs.
 * @module EventLog/EventLogSchema
 * @since 0.0.1
 *
 * @description
 * Event logs are the primary mechanism for smart contracts to emit events.
 * Each log contains the emitting contract's address, indexed topics for filtering,
 * and arbitrary data bytes.
 */

import type { EventLogType } from "@tevm/voltaire/EventLog";
import * as EventLog from "@tevm/voltaire/EventLog";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";
import { Hex as AddressSchema } from "../Address/Hex.js";
import { Hex as HashSchema } from "../Hash/index.js";

/**
 * Internal schema for validating EventLog structure.
 * @internal
 */
const EventLogTypeSchema = S.declare<EventLogType>(
	(u): u is EventLogType => {
		if (typeof u !== "object" || u === null) return false;
		const log = u as Record<string, unknown>;
		return (
			"address" in log &&
			log.address instanceof Uint8Array &&
			(log.address as Uint8Array).length === 20 &&
			"topics" in log &&
			Array.isArray(log.topics) &&
			"data" in log &&
			log.data instanceof Uint8Array
		);
	},
	{ identifier: "EventLog" },
);

/**
 * Internal structured schema for EventLog input.
 * @internal
 */
const EventLogSchemaInternal = S.Struct({
	address: AddressSchema,
	topics: S.Array(HashSchema),
	data: S.Uint8ArrayFromSelf,
	blockNumber: S.optional(S.BigIntFromSelf),
	transactionHash: S.optional(HashSchema),
	transactionIndex: S.optional(S.Number),
	blockHash: S.optional(HashSchema),
	logIndex: S.optional(S.Number),
	removed: S.optional(S.Boolean),
});

/**
 * Effect Schema for validating EVM event logs.
 *
 * @description
 * Validates and transforms event log data into a typed EventLogType.
 * Event logs contain:
 * - address: The contract that emitted the event (20 bytes)
 * - topics: Array of indexed parameters (up to 4, each 32 bytes)
 * - data: Non-indexed parameters encoded as bytes
 * - blockNumber: Block containing this log (optional)
 * - transactionHash: Transaction that emitted this log (optional)
 * - transactionIndex: Index of transaction in block (optional)
 * - blockHash: Hash of block containing this log (optional)
 * - logIndex: Index of log within transaction (optional)
 * - removed: True if log was removed due to chain reorg (optional)
 *
 * @example
 * ```typescript
 * import * as EventLog from 'voltaire-effect/primitives/EventLog'
 * import * as Schema from 'effect/Schema'
 *
 * const parse = Schema.decodeSync(EventLog.Schema)
 *
 * // Parse a Transfer event log
 * const log = parse({
 *   address: contractAddress,  // 20-byte address
 *   topics: [
 *     transferEventSignature,  // Topic 0: event signature
 *     fromAddressTopic,        // Topic 1: from address (padded)
 *     toAddressTopic           // Topic 2: to address (padded)
 *   ],
 *   data: encodedAmount,       // Non-indexed amount parameter
 *   blockNumber: 12345678n,
 *   logIndex: 0
 * })
 *
 * // Access log properties
 * console.log(log.address)  // Contract address
 * console.log(log.topics)   // Indexed parameters
 * console.log(log.data)     // Encoded data
 * ```
 *
 * @throws {ParseError} When log structure is invalid
 * @see {@link EventLogType} for the output type
 * @since 0.0.1
 */
export const Rpc: S.Schema<
	EventLogType,
	S.Schema.Encoded<typeof EventLogSchemaInternal>
> = S.transformOrFail(EventLogSchemaInternal, EventLogTypeSchema, {
	strict: true,
	decode: (d, _options, ast) => {
		try {
			return ParseResult.succeed(
				EventLog.from({
					address: d.address,
					topics: d.topics,
					data: d.data,
					blockNumber: d.blockNumber,
					transactionHash: d.transactionHash,
					transactionIndex: d.transactionIndex,
					blockHash: d.blockHash,
					logIndex: d.logIndex,
					removed: d.removed,
				}),
			);
		} catch (e) {
			return ParseResult.fail(
				new ParseResult.Type(ast, d, (e as Error).message),
			);
		}
	},
	encode: (e) =>
		ParseResult.succeed({
			address: e.address,
			topics: [...e.topics],
			data: e.data,
			blockNumber: e.blockNumber,
			transactionHash: e.transactionHash,
			transactionIndex: e.transactionIndex,
			blockHash: e.blockHash,
			logIndex: e.logIndex,
			removed: e.removed,
		}),
}).annotations({ identifier: "EventLog.Rpc" });

export { Rpc as EventLogSchema };
export { Rpc as Schema };
export { EventLogTypeSchema };

/**
 * Type representing an EVM event log entry.
 *
 * @description
 * Contains all data for an emitted event:
 * - address: Emitting contract address
 * - topics: Indexed event parameters (for filtering)
 * - data: Non-indexed parameters (ABI encoded)
 * - Metadata: block, transaction, and log indices
 *
 * @see {@link EventLogSchema} for creating instances
 * @since 0.0.1
 */
export type { EventLogType };
