import { StorageProof } from '@tevm/voltaire'
import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

type StorageProofType = StorageProof.StorageProofType

const StorageProofTypeSchema = S.declare<StorageProofType>(
  (u): u is StorageProofType => {
    if (typeof u !== 'object' || u === null) return false
    const obj = u as StorageProofType
    return (
      'key' in obj &&
      'value' in obj &&
      'proof' in obj &&
      Array.isArray(obj.proof)
    )
  },
  { identifier: 'StorageProof' }
)

export const Schema: S.Schema<StorageProofType, StorageProofType> = S.transformOrFail(
  StorageProofTypeSchema,
  StorageProofTypeSchema,
  {
    strict: true,
    decode: (t, _options, _ast) => ParseResult.succeed(t),
    encode: (t) => ParseResult.succeed(t)
  }
).annotations({ identifier: 'StorageProofSchema' })

export type { StorageProofType }
