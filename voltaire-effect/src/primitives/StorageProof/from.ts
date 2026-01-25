import { StorageProof } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'

type StorageProofType = StorageProof.StorageProofType
type StorageProofLike = StorageProof.StorageProofLike

export const from = (value: StorageProofLike): Effect.Effect<StorageProofType, Error> =>
  Effect.try({
    try: () => StorageProof.from(value),
    catch: (e) => e as Error
  })
