/**
 * @fileoverview EventLog module for working with EVM event logs.
 * @module EventLog
 * @since 0.0.1
 *
 * @description
 * Event logs are emitted by smart contracts to record important state changes
 * and provide an efficient way to query historical data. Each log contains:
 * - The emitting contract's address
 * - Up to 4 indexed topics for efficient filtering
 * - Arbitrary data bytes for non-indexed parameters
 * - Metadata about the block and transaction
 *
 * This module provides:
 * - Effect Schema for validation
 * - Type definitions for event logs
 *
 * @example
 * ```typescript
 * import * as EventLog from 'voltaire-effect/primitives/EventLog'
 * import * as Schema from 'effect/Schema'
 *
 * // Parse event log from JSON-RPC response
 * const log = Schema.decodeSync(EventLog.Schema)({
 *   address: contractAddress,
 *   topics: [
 *     transferEventSignature,  // Topic 0: keccak256("Transfer(address,address,uint256)")
 *     fromAddressTopic,        // Topic 1: indexed from address
 *     toAddressTopic           // Topic 2: indexed to address
 *   ],
 *   data: encodedAmount,       // ABI-encoded non-indexed parameters
 *   blockNumber: 12345678n,
 *   transactionHash: txHash,
 *   logIndex: 0
 * })
 *
 * // Access log properties
 * console.log(log.address)      // Contract that emitted event
 * console.log(log.topics[0])    // Event signature
 * console.log(log.data)         // Encoded parameters
 * console.log(log.blockNumber)  // Block number
 * console.log(log.logIndex)     // Position in transaction
 * ```
 *
 * @see {@link EventLogSchema} for Effect Schema integration
 * @see {@link Schema} for the default export alias
 * @see {@link EventLogType} for the validated type
 */
export { EventLogSchema, Schema, EventLogTypeSchema, type EventLogType } from './EventLogSchema.js'
