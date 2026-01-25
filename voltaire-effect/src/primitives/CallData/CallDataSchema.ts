import { Hex as VoltaireHex, type HexType } from '@tevm/voltaire/Hex'
import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

/**
 * Branded type representing EVM call data.
 * Call data is the input data sent with a transaction to a smart contract.
 * @since 0.0.1
 */
export type CallDataType = HexType & { readonly __tag: 'CallData' }

const CallDataTypeSchema = S.declare<CallDataType>(
  (u): u is CallDataType => {
    if (typeof u !== 'string') return false
    try {
      VoltaireHex(u)
      return true
    } catch {
      return false
    }
  },
  { identifier: 'CallData' }
)

/**
 * Effect Schema for validating and parsing EVM call data.
 * Transforms hex strings into branded CallDataType values.
 *
 * @example
 * ```typescript
 * import * as CallData from 'voltaire-effect/CallData'
 * import * as Schema from 'effect/Schema'
 *
 * const data = Schema.decodeSync(CallData.CallDataSchema)('0xa9059cbb...')
 * ```
 * @since 0.0.1
 */
export const CallDataSchema: S.Schema<CallDataType, string> = S.transformOrFail(
  S.String,
  CallDataTypeSchema,
  {
    strict: true,
    decode: (s, _options, ast) => {
      try {
        return ParseResult.succeed(VoltaireHex(s) as CallDataType)
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, s, (e as Error).message))
      }
    },
    encode: (h) => ParseResult.succeed(h)
  }
).annotations({ identifier: 'CallDataSchema' })
