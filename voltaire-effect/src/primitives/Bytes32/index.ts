/**
 * @fileoverview Bytes32 module for Effect-based 32-byte fixed-size data handling.
 *
 * @description
 * Provides Effect-wrapped functions and schemas for working with 32-byte
 * (256-bit) fixed-size data. All functions return Effects instead of throwing,
 * enabling composable error handling and railway-oriented programming.
 *
 * 32-byte values are ubiquitous in Ethereum:
 * - Keccak256 hashes (e.g., transaction hashes, block hashes)
 * - Storage slot keys and values
 * - Private keys
 * - Merkle tree nodes
 * - EIP-712 typed data hashes
 *
 * Unlike {@link Bytes} which handles arbitrary-length byte arrays, this module
 * enforces exactly 32 bytes.
 *
 * This module provides:
 * - {@link from} - Create Bytes32 from various inputs (fallible)
 * - {@link Schema} - Effect Schema for validation/parsing
 *
 * @example
 * ```typescript
 * import * as Bytes32 from 'voltaire-effect/primitives/Bytes32'
 * import * as Effect from 'effect/Effect'
 *
 * // Create from 64-char hex string
 * const hash = await Effect.runPromise(
 *   Bytes32.from('0x' + 'ab'.repeat(32))
 * )
 *
 * // Create from bigint (left-padded)
 * const slot = await Effect.runPromise(Bytes32.from(1n))
 * // 0x0000...0001
 *
 * // Use Schema for validation
 * import * as S from 'effect/Schema'
 * const validated = S.decodeSync(Bytes32.Schema)('0x' + 'ff'.repeat(32))
 * ```
 *
 * @module voltaire-effect/primitives/Bytes32
 * @since 0.0.1
 */

import type { Bytes32Type as _Bytes32Type } from '@tevm/voltaire/Bytes'

export { Schema } from './Bytes32Schema.js'
export { from } from './from.js'

/**
 * Type for 32-byte data as branded Uint8Array.
 *
 * @description
 * A Uint8Array branded as Bytes32Type is guaranteed to have exactly
 * 32 bytes. The branding ensures type safety when working with
 * Ethereum primitives that require 32-byte data.
 *
 * Common uses:
 * - Keccak256 hash outputs
 * - Storage slot keys
 * - Private keys
 * - Block and transaction hashes
 *
 * @see {@link from} - Create Bytes32Type values
 * @since 0.0.1
 */
export type Bytes32Type = _Bytes32Type

/**
 * Input types accepted for Bytes32 construction.
 *
 * @description
 * Union of types that can be converted to Bytes32:
 * - `Bytes32Type`: Already a Bytes32 (passthrough)
 * - `string`: Hex string (must be 66 chars: 0x + 64 hex chars)
 * - `Uint8Array`: Must be exactly 32 bytes
 * - `bigint`: Will be left-padded to 32 bytes
 * - `number`: Will be left-padded to 32 bytes
 *
 * @see {@link from} - Function that accepts Bytes32Like
 * @since 0.0.1
 */
export type Bytes32Like = Bytes32Type | string | Uint8Array | bigint | number
