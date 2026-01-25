import { describe, it, expect } from 'vitest'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as BlockBodyEffect from './index.js'

describe('BlockBody', () => {
  describe('from', () => {
    it('creates BlockBody from params', async () => {
      const params = {
        transactions: [],
        ommers: [],
        withdrawals: []
      }
      const result = await Effect.runPromise(BlockBodyEffect.from(params))
      expect(result).toBeDefined()
      expect(result.transactions).toEqual([])
      expect(result.ommers).toEqual([])
    })
  })

  describe('fromRpc', () => {
    it('creates BlockBody from RPC format', async () => {
      const rpc = {
        transactions: [],
        uncles: [],
        withdrawals: []
      }
      const result = await Effect.runPromise(BlockBodyEffect.fromRpc(rpc))
      expect(result).toBeDefined()
      expect(result.transactions).toEqual([])
    })
  })
})
