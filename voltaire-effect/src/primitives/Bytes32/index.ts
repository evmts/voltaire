/**
 * @module Bytes32
 * @description Effect Schemas for 32-byte fixed-size data.
 *
 * ## Schemas
 *
 * | Schema | Input | Output |
 * |--------|-------|--------|
 * | `Bytes32.Hex` | string | Bytes32Type |
 * | `Bytes32.Bytes` | Uint8Array | Bytes32Type |
 *
 * ## Usage
 *
 * ```typescript
 * import * as Bytes32 from 'voltaire-effect/primitives/Bytes32'
 * import * as S from 'effect/Schema'
 *
 * // Decode from hex string (must be 66 chars: 0x + 64 hex chars)
 * const b32 = S.decodeSync(Bytes32.Hex)('0x' + 'ab'.repeat(32))
 *
 * // Encode to hex string
 * const hex = S.encodeSync(Bytes32.Hex)(b32)
 *
 * // Decode from Uint8Array (must be exactly 32 bytes)
 * const b32FromBytes = S.decodeSync(Bytes32.Bytes)(new Uint8Array(32))
 * ```
 *
 * ## Common Uses
 *
 * - Keccak256 hashes
 * - Storage slot keys
 * - Private keys
 * - Block and transaction hashes
 * - EIP-712 typed data hashes
 *
 * @since 0.1.0
 */

import type { Bytes32Type as _Bytes32Type } from "@tevm/voltaire/Bytes";

// Schemas
export { Hex } from "./Hex.js";
export { Bytes } from "./Bytes.js";
/** @deprecated Use Bytes32.Hex or Bytes32.Bytes instead */
export { Schema } from "./Bytes32Schema.js";

// Deprecated - use S.decodeSync(Bytes32.Hex) instead
/** @deprecated Use S.decodeSync(Bytes32.Hex) or S.decodeSync(Bytes32.Bytes) instead */

/**
 * Type for 32-byte data as branded Uint8Array.
 *
 * @description
 * A Uint8Array branded as Bytes32Type is guaranteed to have exactly
 * 32 bytes. The branding ensures type safety when working with
 * Ethereum primitives that require 32-byte data.
 *
 * @since 0.0.1
 */
export type Bytes32Type = _Bytes32Type;

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
 * @since 0.0.1
 */
export type Bytes32Like = Bytes32Type | string | Uint8Array | bigint | number;
