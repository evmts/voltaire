import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'
import { Selector } from '@tevm/voltaire'

/**
 * Branded type representing a 4-byte EVM function selector.
 * Function selectors are the first 4 bytes of the keccak256 hash of a function signature.
 *
 * @example
 * ```typescript
 * import { Selector } from 'voltaire-effect/primitives'
 *
 * const selector: SelectorType = Selector.from('0xa9059cbb')
 * ```
 *
 * @since 0.0.1
 */
export type SelectorType = Uint8Array & { readonly __tag: 'Selector'; readonly length: 4 }

const SelectorTypeSchema = S.declare<SelectorType>(
  (u): u is SelectorType => u instanceof Uint8Array && u.length === 4,
  { identifier: 'Selector' }
)

/**
 * Effect Schema for validating and parsing EVM function selectors.
 * Accepts a hex string or Uint8Array and transforms it into a branded SelectorType.
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { SelectorSchema } from 'voltaire-effect/primitives/Selector'
 *
 * const parse = S.decodeSync(SelectorSchema)
 * const selector = parse('0xa9059cbb') // transfer(address,uint256)
 * ```
 *
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
