import { describe, it, expect } from 'vitest'
import * as Effect from 'effect/Effect'
import * as BinaryTreeEffect from './index.js'

describe('BinaryTree', () => {
  describe('init', () => {
    it('creates an empty tree', async () => {
      const tree = await Effect.runPromise(BinaryTreeEffect.init())
      expect(tree).toBeDefined()
      expect(tree.root).toBeDefined()
    })
  })

  describe('insert and get', () => {
    it('inserts and retrieves a value', async () => {
      const tree = await Effect.runPromise(BinaryTreeEffect.init())
      const key = new Uint8Array(32).fill(1)
      const value = new Uint8Array([1, 2, 3, 4])
      
      const newTree = await Effect.runPromise(BinaryTreeEffect.insert(tree, key, value))
      const retrieved = await Effect.runPromise(BinaryTreeEffect.get(newTree, key))
      
      expect(retrieved).toEqual(value)
    })

    it('returns null for missing key', async () => {
      const tree = await Effect.runPromise(BinaryTreeEffect.init())
      const key = new Uint8Array(32).fill(1)
      
      const result = await Effect.runPromise(BinaryTreeEffect.get(tree, key))
      expect(result).toBeNull()
    })
  })

  describe('rootHash', () => {
    it('returns a hash for empty tree', async () => {
      const tree = await Effect.runPromise(BinaryTreeEffect.init())
      const hash = BinaryTreeEffect.rootHash(tree)
      expect(hash).toBeInstanceOf(Uint8Array)
    })

    it('hash changes after insert', async () => {
      const tree = await Effect.runPromise(BinaryTreeEffect.init())
      const hashBefore = BinaryTreeEffect.rootHash(tree)
      
      const key = new Uint8Array(32).fill(1)
      const value = new Uint8Array([1, 2, 3])
      const newTree = await Effect.runPromise(BinaryTreeEffect.insert(tree, key, value))
      const hashAfter = BinaryTreeEffect.rootHash(newTree)
      
      expect(hashBefore).not.toEqual(hashAfter)
    })
  })
})
