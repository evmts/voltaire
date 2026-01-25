import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'
import { Domain } from '@tevm/voltaire'

/**
 * Type representing an EIP-712 typed data domain.
 * @since 0.0.1
 */
export type DomainType = ReturnType<typeof Domain.from>

const DomainTypeSchema = S.declare<DomainType>(
  (u): u is DomainType =>
    u !== null && typeof u === 'object',
  { identifier: 'Domain' }
)

/**
 * Input type for creating an EIP-712 domain.
 * @since 0.0.1
 */
export type DomainInput = {
  readonly name?: string
  readonly version?: string
  readonly chainId?: bigint | number
  readonly verifyingContract?: Uint8Array | string
  readonly salt?: Uint8Array | string
}

/**
 * Effect Schema for validating EIP-712 domain data.
 * Used for typed data signing (EIP-712).
 *
 * @example
 * ```typescript
 * import * as Domain from 'voltaire-effect/Domain'
 * import * as Schema from 'effect/Schema'
 *
 * const domain = Schema.decodeSync(Domain.DomainSchema)({
 *   name: 'MyApp',
 *   version: '1',
 *   chainId: 1n
 * })
 * ```
 * @since 0.0.1
 */
export const DomainSchema: S.Schema<DomainType, DomainInput> = S.transformOrFail(
  S.Struct({
    name: S.optional(S.String),
    version: S.optional(S.String),
    chainId: S.optional(S.Union(S.BigIntFromSelf, S.Number)),
    verifyingContract: S.optional(S.Union(S.Uint8ArrayFromSelf, S.String)),
    salt: S.optional(S.Union(S.Uint8ArrayFromSelf, S.String)),
  }),
  DomainTypeSchema,
  {
    strict: true,
    decode: (input, _options, ast) => {
      try {
        return ParseResult.succeed(Domain.from(input as any))
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, input, (e as Error).message))
      }
    },
    encode: (domain) => ParseResult.succeed({
      name: domain.name,
      version: domain.version,
      chainId: domain.chainId as any,
      verifyingContract: domain.verifyingContract as any,
      salt: domain.salt as any,
    })
  }
).annotations({ identifier: 'DomainSchema' })
