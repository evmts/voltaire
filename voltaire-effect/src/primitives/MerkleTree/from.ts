import { MerkleTree, BrandedHash } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'

export const from = (leaves: BrandedHash.HashType[]): Effect.Effect<MerkleTree.MerkleTreeType, Error> =>
  Effect.try({
    try: () => MerkleTree.from(leaves),
    catch: (e) => e as Error
  })
