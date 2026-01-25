import { MerkleTree, BrandedHash } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'

export const getProof = (leaves: BrandedHash.HashType[], leafIndex: number): Effect.Effect<MerkleTree.MerkleProofType, Error> =>
  Effect.try({
    try: () => MerkleTree.getProof(leaves, leafIndex),
    catch: (e) => e as Error
  })
