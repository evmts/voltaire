import { describe, it, expect } from 'vitest'
import * as MerkleTree from './index.js'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'
import { Hash } from '@tevm/voltaire'

type HashType = ReturnType<typeof Hash.keccak256>

describe('MerkleTree', () => {
  const createLeaves = (count: number): HashType[] => {
    const leaves: HashType[] = []
    for (let i = 0; i < count; i++) {
      leaves.push(Hash.keccak256(new Uint8Array([i])))
    }
    return leaves
  }

  describe('Schema', () => {
    it('validates a valid MerkleTree', async () => {
      const leaves = createLeaves(4)
      const tree = await Effect.runPromise(MerkleTree.from(leaves))
      const result = Schema.decodeSync(MerkleTree.Schema)(tree)
      expect(result.root).toBeDefined()
      expect(result.leafCount).toBe(4)
    })

    it('rejects invalid objects', () => {
      expect(() => Schema.decodeSync(MerkleTree.Schema)({} as any)).toThrow()
    })
  })

  describe('ProofSchema', () => {
    it('validates a valid MerkleProof', async () => {
      const leaves = createLeaves(4)
      const proof = await Effect.runPromise(MerkleTree.getProof(leaves, 0))
      const result = Schema.decodeSync(MerkleTree.ProofSchema)(proof)
      expect(result.leaf).toBeDefined()
      expect(result.siblings).toBeDefined()
    })
  })

  describe('from', () => {
    it('creates tree from leaves', async () => {
      const leaves = createLeaves(4)
      const tree = await Effect.runPromise(MerkleTree.from(leaves))
      expect(tree.root).toBeInstanceOf(Uint8Array)
      expect(tree.leafCount).toBe(4)
      expect(tree.depth).toBeGreaterThan(0)
    })

    it('creates tree with single leaf', async () => {
      const leaves = createLeaves(1)
      const tree = await Effect.runPromise(MerkleTree.from(leaves))
      expect(tree.leafCount).toBe(1)
    })

    it('creates tree with power of 2 leaves', async () => {
      const leaves = createLeaves(8)
      const tree = await Effect.runPromise(MerkleTree.from(leaves))
      expect(tree.leafCount).toBe(8)
      expect(tree.depth).toBe(3)
    })

    it('fails on empty leaves', async () => {
      const result = await Effect.runPromiseExit(MerkleTree.from([]))
      expect(result._tag).toBe('Failure')
    })
  })

  describe('getProof', () => {
    it('generates proof for first leaf', async () => {
      const leaves = createLeaves(4)
      const proof = await Effect.runPromise(MerkleTree.getProof(leaves, 0))
      expect(proof.leaf).toEqual(leaves[0])
      expect(proof.leafIndex).toBe(0)
      expect(proof.siblings.length).toBeGreaterThan(0)
    })

    it('generates proof for last leaf', async () => {
      const leaves = createLeaves(4)
      const proof = await Effect.runPromise(MerkleTree.getProof(leaves, 3))
      expect(proof.leaf).toEqual(leaves[3])
      expect(proof.leafIndex).toBe(3)
    })

    it('fails on out-of-bounds index', async () => {
      const leaves = createLeaves(4)
      const result = await Effect.runPromiseExit(MerkleTree.getProof(leaves, 10))
      expect(result._tag).toBe('Failure')
    })

    it('fails on negative index', async () => {
      const leaves = createLeaves(4)
      const result = await Effect.runPromiseExit(MerkleTree.getProof(leaves, -1))
      expect(result._tag).toBe('Failure')
    })
  })

  describe('verify', () => {
    it('verifies valid proof', async () => {
      const leaves = createLeaves(4)
      const tree = await Effect.runPromise(MerkleTree.from(leaves))
      const proof = await Effect.runPromise(MerkleTree.getProof(leaves, 2))
      const isValid = await Effect.runPromise(MerkleTree.verify(proof, tree.root))
      expect(isValid).toBe(true)
    })

    it('rejects proof with wrong root', async () => {
      const leaves = createLeaves(4)
      const proof = await Effect.runPromise(MerkleTree.getProof(leaves, 0))
      const wrongRoot = Hash.fromBytes(new Uint8Array(32).fill(0xff))
      const isValid = await Effect.runPromise(MerkleTree.verify(proof, wrongRoot))
      expect(isValid).toBe(false)
    })

    it('verifies proof for all leaves', async () => {
      const leaves = createLeaves(8)
      const tree = await Effect.runPromise(MerkleTree.from(leaves))
      
      for (let i = 0; i < leaves.length; i++) {
        const proof = await Effect.runPromise(MerkleTree.getProof(leaves, i))
        const isValid = await Effect.runPromise(MerkleTree.verify(proof, tree.root))
        expect(isValid).toBe(true)
      }
    })
  })
})
