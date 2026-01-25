import { MerkleTree, BrandedHash } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'

export const verify = (proof: MerkleTree.MerkleProofType, expectedRoot: BrandedHash.HashType): Effect.Effect<boolean, Error> =>
  Effect.try({
    try: () => MerkleTree.verify(proof, expectedRoot),
    catch: (e) => e as Error
  })
