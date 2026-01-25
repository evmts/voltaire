import { StateProof } from '@tevm/voltaire'
import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

type StateProofType = StateProof.StateProofType

const StateProofTypeSchema = S.declare<StateProofType>(
  (u): u is StateProofType => {
    if (typeof u !== 'object' || u === null) return false
    const obj = u as StateProofType
    return (
      'address' in obj &&
      'accountProof' in obj &&
      'balance' in obj &&
      'codeHash' in obj &&
      'nonce' in obj &&
      'storageHash' in obj &&
      'storageProof' in obj &&
      Array.isArray(obj.accountProof) &&
      Array.isArray(obj.storageProof)
    )
  },
  { identifier: 'StateProof' }
)

export const Schema: S.Schema<StateProofType, StateProofType> = S.transformOrFail(
  StateProofTypeSchema,
  StateProofTypeSchema,
  {
    strict: true,
    decode: (t, _options, _ast) => ParseResult.succeed(t),
    encode: (t) => ParseResult.succeed(t)
  }
).annotations({ identifier: 'StateProofSchema' })

export type { StateProofType }
