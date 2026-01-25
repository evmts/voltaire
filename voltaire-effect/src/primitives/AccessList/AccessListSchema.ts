/**
 * @fileoverview Effect Schema definitions for EIP-2930 Access Lists.
 * Provides type-safe validation and parsing of access list data.
 *
 * @module AccessList/AccessListSchema
 * @since 0.0.1
 */

import { AccessList, type BrandedAccessList, type Item } from '@tevm/voltaire/AccessList'
import type { AddressType } from '@tevm/voltaire/Address'
import type { HashType } from '@tevm/voltaire/Hash'
import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

/**
 * Raw access list item input type (JSON-compatible).
 * Represents a single address with its accessed storage keys.
 *
 * @description
 * This type represents the JSON-serializable format for a single access list
 * entry. Each entry specifies a contract address and the storage slots that
 * will be accessed during transaction execution.
 *
 * @since 0.0.1
 *
 * @example
 * ```typescript
 * const item: AccessListItemInput = {
 *   address: '0x742d35Cc6634C0532925a3b844Bc9e7595f251e3',
 *   storageKeys: [
 *     '0x0000000000000000000000000000000000000000000000000000000000000001',
 *     '0x0000000000000000000000000000000000000000000000000000000000000002'
 *   ]
 * }
 * ```
 */
export type AccessListItemInput = {
  /**
   * The contract address as hex string.
   * Must be a valid 20-byte Ethereum address with '0x' prefix.
   */
  address: string
  /**
   * Array of storage slot keys as hex strings.
   * Each key must be a 32-byte hex string with '0x' prefix.
   */
  storageKeys: readonly string[]
}

/**
 * Raw access list input type (JSON-compatible).
 * Array of address/storage key pairs for EIP-2930 transactions.
 *
 * @description
 * Represents the complete access list as an array of items, where each item
 * declares an address and its storage slots. This format is JSON-compatible
 * and matches the RPC representation used by Ethereum nodes.
 *
 * @since 0.0.1
 *
 * @example
 * ```typescript
 * const accessList: AccessListInput = [
 *   {
 *     address: '0x742d35Cc6634C0532925a3b844Bc9e7595f251e3',
 *     storageKeys: ['0x0...1']
 *   },
 *   {
 *     address: '0xAnotherAddress...',
 *     storageKeys: ['0x0...a', '0x0...b']
 *   }
 * ]
 * ```
 */
export type AccessListInput = readonly AccessListItemInput[]

/**
 * Internal schema for validating branded AccessList type.
 * @internal
 */
const AccessListTypeSchema = S.declare<BrandedAccessList>(
  (u): u is BrandedAccessList => Array.isArray(u) && AccessList.is(u),
  { identifier: 'AccessList' }
)

/**
 * Internal schema for access list item input.
 * @internal
 */
const AccessListItemInputSchema = S.Struct({
  address: S.String,
  storageKeys: S.Array(S.String)
})

/**
 * Internal schema for access list input array.
 * @internal
 */
const AccessListInputSchema = S.Array(AccessListItemInputSchema)

/**
 * Effect Schema for validating and parsing EIP-2930 Access Lists.
 *
 * @description
 * Transforms JSON-compatible access list input (with hex strings) into
 * the branded `BrandedAccessList` type with proper byte arrays. Handles
 * both encoding (to JSON) and decoding (from JSON) directions.
 *
 * The schema performs:
 * - Validation of address format (20 bytes)
 * - Validation of storage key format (32 bytes each)
 * - Conversion from hex strings to Uint8Array
 * - Branding of the result as BrandedAccessList
 *
 * @since 0.0.1
 *
 * @example
 * ```typescript
 * import * as Schema from 'effect/Schema'
 * import { AccessListSchema } from 'voltaire-effect/primitives/AccessList'
 *
 * // Decode from JSON format
 * const accessList = Schema.decodeSync(AccessListSchema)([
 *   {
 *     address: '0x742d35Cc6634C0532925a3b844Bc9e7595f251e3',
 *     storageKeys: ['0x0000000000000000000000000000000000000000000000000000000000000001']
 *   }
 * ])
 *
 * // Encode back to JSON format
 * const json = Schema.encodeSync(AccessListSchema)(accessList)
 * ```
 *
 * @example
 * ```typescript
 * // Use with Effect for error handling
 * import * as Effect from 'effect/Effect'
 *
 * const result = Effect.runSync(
 *   Schema.decodeUnknown(AccessListSchema)(userInput).pipe(
 *     Effect.catchAll((e) => Effect.succeed([]))
 *   )
 * )
 * ```
 *
 * @throws {ParseError} When input validation fails (invalid address or storage key format).
 *
 * @see {@link AccessListInput} for the input type format
 * @see {@link AccessListItemInput} for individual item format
 */
export const AccessListSchema: S.Schema<BrandedAccessList, AccessListInput> = S.transformOrFail(
  AccessListInputSchema,
  AccessListTypeSchema,
  {
    strict: true,
    decode: (input, _options, ast) => {
      try {
        const items: Item[] = input.map(item => ({
          address: parseAddress(item.address),
          storageKeys: item.storageKeys.map(parseHash)
        }))
        return ParseResult.succeed(AccessList.from(items))
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, input, (e as Error).message))
      }
    },
    encode: (list) => {
      const items: AccessListItemInput[] = list.map(item => ({
        address: toHexString(item.address),
        storageKeys: item.storageKeys.map(toHexString)
      }))
      return ParseResult.succeed(items)
    }
  }
).annotations({ identifier: 'AccessListSchema' })

function parseAddress(hex: string): AddressType {
  const bytes = hexToBytes(hex, 20)
  return bytes as AddressType
}

function parseHash(hex: string): HashType {
  const bytes = hexToBytes(hex, 32)
  return bytes as HashType
}

function hexToBytes(hex: string, expectedLength: number): Uint8Array {
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex
  if (cleanHex.length !== expectedLength * 2) {
    throw new Error(`Expected ${expectedLength} bytes, got ${cleanHex.length / 2}`)
  }
  const bytes = new Uint8Array(expectedLength)
  for (let i = 0; i < expectedLength; i++) {
    bytes[i] = parseInt(cleanHex.slice(i * 2, i * 2 + 2), 16)
  }
  return bytes
}

function toHexString(bytes: Uint8Array): string {
  return '0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}
