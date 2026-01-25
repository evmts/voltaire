/**
 * @fileoverview Bundler Schema definitions for ERC-4337 account abstraction.
 * 
 * Bundlers are off-chain actors in ERC-4337 that collect UserOperations from
 * the mempool and submit them to the EntryPoint contract. They are compensated
 * for gas costs through the UserOperation fees.
 * 
 * This module provides Effect Schema definitions for validating Bundler addresses.
 * 
 * @see https://eips.ethereum.org/EIPS/eip-4337#bundlers
 * @module BundlerSchema
 * @since 0.0.1
 */
import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'
import { Address } from '@tevm/voltaire'

/**
 * Branded type representing an ERC-4337 Bundler address.
 * 
 * Bundlers collect UserOperations and submit them as bundles to the EntryPoint.
 * 
 * @since 0.0.1
 */
export type BundlerType = Uint8Array & { readonly __tag: 'Bundler' }

const BundlerTypeSchema = S.declare<BundlerType>(
  (u): u is BundlerType => u instanceof Uint8Array && u.length === 20,
  { identifier: 'Bundler' }
)

/**
 * Effect Schema for validating ERC-4337 Bundler addresses.
 * 
 * Accepts hex strings or Uint8Array and returns branded BundlerType.
 * Validates that the address is exactly 20 bytes.
 * 
 * @example
 * ```typescript
 * import * as Schema from 'effect/Schema'
 * import { BundlerSchema } from 'voltaire-effect/primitives/Bundler'
 * 
 * const bundler = Schema.decodeSync(BundlerSchema)(
 *   '0x1234567890123456789012345678901234567890'
 * )
 * ```
 * 
 * @throws ParseError - When address is invalid or not 20 bytes
 * @since 0.0.1
 */
export const BundlerSchema: S.Schema<BundlerType, string | Uint8Array> = S.transformOrFail(
  S.Union(S.String, S.Uint8ArrayFromSelf),
  BundlerTypeSchema,
  {
    strict: true,
    decode: (value, _options, ast) => {
      try {
        if (typeof value === 'string') {
          return ParseResult.succeed(Address(value) as unknown as BundlerType)
        }
        if (value.length !== 20) {
          throw new Error('Bundler address must be exactly 20 bytes')
        }
        return ParseResult.succeed(value as unknown as BundlerType)
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, value, (e as Error).message))
      }
    },
    encode: (bundler) => ParseResult.succeed(Address.toHex(bundler as any))
  }
).annotations({ identifier: 'BundlerSchema' })
