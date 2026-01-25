import { describe, it, expect } from 'vitest'
import { NodeInfo } from '@tevm/voltaire'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as NodeInfoEffect from './index.js'

const validNodeInfo = {
  enode: 'enode://abc123@192.168.1.1:30303',
  id: 'abc123',
  ip: '192.168.1.1',
  listenAddr: '192.168.1.1:30303',
  name: 'Geth/v1.10.26-stable',
  ports: {
    discovery: 30303,
    listener: 30303
  },
  protocols: {}
}

describe('NodeInfo', () => {
  describe('NodeInfoSchema', () => {
    it('decodes valid node info object', () => {
      const result = Schema.decodeSync(NodeInfoEffect.NodeInfoSchema)(validNodeInfo)
      expect(result.enode).toBe('enode://abc123@192.168.1.1:30303')
      expect(result.name).toBe('Geth/v1.10.26-stable')
    })

    it('fails for invalid object', () => {
      expect(() => Schema.decodeSync(NodeInfoEffect.NodeInfoSchema)({ invalid: true })).toThrow()
    })

    it('fails for null', () => {
      expect(() => Schema.decodeSync(NodeInfoEffect.NodeInfoSchema)(null)).toThrow()
    })

    it('encodes NodeInfo back to object', () => {
      const nodeInfo = NodeInfo.from(validNodeInfo)
      const result = Schema.encodeSync(NodeInfoEffect.NodeInfoSchema)(nodeInfo)
      expect(result).toHaveProperty('enode')
    })
  })

  describe('from', () => {
    it('creates NodeInfo from valid object', async () => {
      const result = await Effect.runPromise(NodeInfoEffect.from(validNodeInfo))
      expect(result.name).toBe('Geth/v1.10.26-stable')
    })

    it('fails for invalid object', async () => {
      const exit = await Effect.runPromiseExit(NodeInfoEffect.from({ invalid: true }))
      expect(Exit.isFailure(exit)).toBe(true)
    })
  })
})
