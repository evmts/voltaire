/**
 * @fileoverview Effect-based module for working with 32-byte Ethereum hash values.
 *
 * This module provides type-safe, Effect-wrapped operations for creating,
 * validating, and converting cryptographic hash values commonly used in
 * Ethereum (transaction hashes, block hashes, storage keys, etc.).
 *
 * @module Hash
 * @since 0.0.1
 *
 * @example
 * ```typescript
 * import * as Hash from 'voltaire-effect/primitives/Hash'
 * import * as Effect from 'effect/Effect'
 *
 * // Create from hex string
 * const hash = await Effect.runPromise(
 *   Hash.fromHex('0x' + 'ab'.repeat(32))
 * )
 *
 * // Convert back to hex
 * const hex = Effect.runSync(Hash.toHex(hash))
 *
 * // Use with Effect Schema for validation
 * import * as S from 'effect/Schema'
 * const validated = S.decodeSync(Hash.Schema)('0x' + '00'.repeat(32))
 * ```
 *
 * @see {@link from} - Create Hash from string or bytes
 * @see {@link fromHex} - Create Hash from hex string
 * @see {@link fromBytes} - Create Hash from Uint8Array
 * @see {@link toHex} - Convert Hash to hex string
 * @see {@link toBytes} - Convert Hash to Uint8Array
 * @see {@link HashSchema} - Effect Schema for validation
 */

export { HashSchema, HashSchema as Schema } from './HashSchema.js'

export { assert } from './assert.js'
export { clone } from './clone.js'
export { concat } from './concat.js'
export { equals } from './equals.js'
export { format } from './format.js'
export { from } from './from.js'
export { fromBytes } from './fromBytes.js'
export { fromHex } from './fromHex.js'
export { isHash, isHashSync } from './isHash.js'
export { isValidHex } from './isValidHex.js'
export { isZero } from './isZero.js'
export { keccak256, keccak256Hex, keccak256String } from './keccak256.js'
export { merkleRoot } from './merkleRoot.js'
export { random } from './random.js'
export { slice } from './slice.js'
export { toBytes } from './toBytes.js'
export { toHex } from './toHex.js'
export { toString } from './toString.js'

export type { HashType } from '@tevm/voltaire/Hash'
