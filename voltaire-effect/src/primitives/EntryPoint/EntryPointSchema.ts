import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'
import { Address } from '@tevm/voltaire'

/**
 * Branded type representing an ERC-4337 EntryPoint contract address.
 * @since 0.0.1
 */
export type EntryPointType = Uint8Array & { readonly __tag: 'EntryPoint' }

const EntryPointTypeSchema = S.declare<EntryPointType>(
  (u): u is EntryPointType => u instanceof Uint8Array && u.length === 20,
  { identifier: 'EntryPoint' }
)

/**
 * Effect Schema for validating ERC-4337 EntryPoint addresses.
 * Accepts hex strings or Uint8Array and returns branded EntryPointType.
 *
 * @example
 * ```typescript
 * import * as EntryPoint from 'voltaire-effect/EntryPoint'
 * import * as Schema from 'effect/Schema'
 *
 * const entryPoint = Schema.decodeSync(EntryPoint.EntryPointSchema)(EntryPoint.ENTRYPOINT_V07)
 * ```
 * @since 0.0.1
 */
export const EntryPointSchema: S.Schema<EntryPointType, string | Uint8Array> = S.transformOrFail(
  S.Union(S.String, S.Uint8ArrayFromSelf),
  EntryPointTypeSchema,
  {
    strict: true,
    decode: (value, _options, ast) => {
      try {
        if (typeof value === 'string') {
          return ParseResult.succeed(Address(value) as unknown as EntryPointType)
        }
        if (value.length !== 20) {
          throw new Error('EntryPoint must be exactly 20 bytes')
        }
        return ParseResult.succeed(value as unknown as EntryPointType)
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, value, (e as Error).message))
      }
    },
    encode: (entryPoint) => ParseResult.succeed(Address.toHex(entryPoint as any))
  }
).annotations({ identifier: 'EntryPointSchema' })

/**
 * ERC-4337 EntryPoint v0.6 address.
 * @since 0.0.1
 */
export const ENTRYPOINT_V06 = '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789'

/**
 * ERC-4337 EntryPoint v0.7 address.
 * @since 0.0.1
 */
export const ENTRYPOINT_V07 = '0x0000000071727De22E5E9d8BAf0edAc6f37da032'
