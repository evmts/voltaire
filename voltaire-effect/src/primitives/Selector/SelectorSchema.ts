/**
 * @fileoverview Effect Schema for EVM function selectors (4-byte identifiers).
 * Provides validation and parsing of function selectors used in EVM call data.
 * @module Selector/SelectorSchema
 * @since 0.0.1
 */

import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'
import { Selector } from '@tevm/voltaire'

/**
 * Branded type representing a 4-byte EVM function selector.
 * Function selectors are the first 4 bytes of the keccak256 hash of a function signature.
 *
 * @description
 * A Selector is a 4-byte identifier that uniquely identifies a function in a smart contract.
 * It is computed as the first 4 bytes of keccak256(signature), where signature is the
 * canonical function signature like "transfer(address,uint256)".
 *
 * @example
 * ```typescript
 * import { Selector } from 'voltaire-effect/primitives'
 *
 * const selector: SelectorType = Selector.from('0xa9059cbb')
 * // selector is a 4-byte Uint8Array with Selector brand
 * ```
 *
 * @see {@link SelectorSchema} for parsing and validation
 * @see {@link from} for creating selectors from various inputs
 * @since 0.0.1
 */
export type SelectorType = Uint8Array & { readonly __tag: 'Selector'; readonly length: 4 }

/**
 * Internal schema declaration for SelectorType validation.
 * Validates that input is a 4-byte Uint8Array.
 * @internal
 */
const SelectorTypeSchema = S.declare<SelectorType>(
  (u): u is SelectorType => u instanceof Uint8Array && u.length === 4,
  { identifier: 'Selector' }
)

/**
 * Effect Schema for validating and parsing EVM function selectors.
 * Accepts a hex string or Uint8Array and transforms it into a branded SelectorType.
 *
 * @description
 * This schema validates that the input represents a valid 4-byte function selector.
 * It accepts:
 * - Hex strings with or without 0x prefix (e.g., "0xa9059cbb" or "a9059cbb")
 * - Uint8Array of exactly 4 bytes
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { SelectorSchema } from 'voltaire-effect/primitives/Selector'
 *
 * // Parse from hex string
 * const parse = S.decodeSync(SelectorSchema)
 * const selector = parse('0xa9059cbb') // transfer(address,uint256)
 *
 * // Parse from Uint8Array
 * const fromBytes = parse(new Uint8Array([0xa9, 0x05, 0x9c, 0xbb]))
 * ```
 *
 * @throws {ParseError} When input is not a valid 4-byte selector
 * @see {@link SelectorType} for the output type
 * @see {@link from} for Effect-based creation
 * @since 0.0.1
 */
export const SelectorSchema: S.Schema<SelectorType, string | Uint8Array> = S.transformOrFail(
  S.Union(S.String, S.Uint8ArrayFromSelf),
  SelectorTypeSchema,
  {
    strict: true,
    decode: (value, _options, ast) => {
      try {
        return ParseResult.succeed(Selector.from(value) as unknown as SelectorType)
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, value, (e as Error).message))
      }
    },
    encode: (selector) => ParseResult.succeed(selector)
  }
).annotations({ identifier: 'SelectorSchema' })
