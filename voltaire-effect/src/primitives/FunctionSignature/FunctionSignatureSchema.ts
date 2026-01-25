/**
 * @fileoverview Effect Schema for Solidity function signatures.
 * @module FunctionSignature/FunctionSignatureSchema
 * @since 0.0.1
 *
 * @description
 * Function signatures are the canonical representation of Solidity function definitions.
 * This module provides parsing and validation for signatures like "transfer(address,uint256)".
 */

import { FunctionSignature } from '@tevm/voltaire'
import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

/**
 * Represents a parsed Solidity function signature.
 *
 * @description
 * Contains the parsed components of a function signature:
 * - selector: The 4-byte function selector (first 4 bytes of keccak256(signature))
 * - signature: The original canonical signature string
 * - name: The function name extracted from the signature
 *
 * @example
 * ```typescript
 * import { FunctionSignature } from 'voltaire-effect/primitives'
 *
 * const sig: FunctionSignatureType = {
 *   selector: Uint8Array([0xa9, 0x05, 0x9c, 0xbb]),
 *   signature: 'transfer(address,uint256)',
 *   name: 'transfer'
 * }
 * ```
 *
 * @see {@link Schema} for creating instances
 * @since 0.0.1
 */
export type FunctionSignatureType = ReturnType<typeof FunctionSignature.from>

/**
 * Internal schema for FunctionSignature validation.
 * @internal
 */
const FunctionSignatureTypeSchema = S.declare<FunctionSignatureType>(
  (u): u is FunctionSignatureType => {
    if (typeof u !== 'object' || u === null) return false
    const obj = u as Record<string, unknown>
    return obj.selector instanceof Uint8Array && typeof obj.signature === 'string' && typeof obj.name === 'string'
  },
  { identifier: 'FunctionSignature' }
)

/**
 * Effect Schema for validating and parsing function signatures.
 *
 * @description
 * Parses a Solidity function signature string and extracts:
 * - The function name
 * - The 4-byte selector (keccak256 hash truncated)
 * - The canonical signature string
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { Schema } from 'voltaire-effect/primitives/FunctionSignature'
 *
 * const parse = S.decodeSync(Schema)
 *
 * // Parse ERC20 transfer
 * const sig = parse('transfer(address,uint256)')
 * console.log(sig.name)       // 'transfer'
 * console.log(sig.selector)   // Uint8Array [0xa9, 0x05, 0x9c, 0xbb]
 * console.log(sig.signature)  // 'transfer(address,uint256)'
 *
 * // Parse other functions
 * const balanceOf = parse('balanceOf(address)')
 * const approve = parse('approve(address,uint256)')
 * ```
 *
 * @throws {ParseError} When signature is malformed or invalid
 * @see {@link from} for Effect-based creation
 * @since 0.0.1
 */
export const Schema: S.Schema<FunctionSignatureType, string> = S.transformOrFail(
  S.String,
  FunctionSignatureTypeSchema,
  {
    strict: true,
    decode: (s, _options, ast) => {
      try {
        return ParseResult.succeed(FunctionSignature.from(s))
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, s, (e as Error).message))
      }
    },
    encode: (f) => ParseResult.succeed(f.signature)
  }
).annotations({ identifier: 'FunctionSignatureSchema' })
