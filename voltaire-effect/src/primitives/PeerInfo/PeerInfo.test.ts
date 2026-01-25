import { describe, it, expect } from 'vitest'
import { PeerInfo } from '@tevm/voltaire'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as PeerInfoEffect from './index.js'

const validPeerInfo = {
  id: 'enode://abc123@192.168.1.1:30303',
  name: 'Geth/v1.10.26-stable',
  caps: ['eth/67', 'snap/1'],
  network: {
    localAddress: '192.168.1.2:30303',
    remoteAddress: '192.168.1.1:30303',
    inbound: false,
    trusted: false,
    static: true
  },
  protocols: {}
}

describe('PeerInfo', () => {
  describe('PeerInfoSchema', () => {
    it('decodes valid peer info object', () => {
      const result = Schema.decodeSync(PeerInfoEffect.PeerInfoSchema)(validPeerInfo)
      expect(result.name).toBe('Geth/v1.10.26-stable')
      expect(result.caps).toContain('eth/67')
    })

    it('fails for invalid object', () => {
      expect(() => Schema.decodeSync(PeerInfoEffect.PeerInfoSchema)({ invalid: true })).toThrow()
    })

    it('fails for null', () => {
      expect(() => Schema.decodeSync(PeerInfoEffect.PeerInfoSchema)(null)).toThrow()
    })

    it('encodes PeerInfo back to object', () => {
      const peerInfo = PeerInfo.from(validPeerInfo)
      const result = Schema.encodeSync(PeerInfoEffect.PeerInfoSchema)(peerInfo)
      expect(result).toHaveProperty('name')
    })
  })

  describe('from', () => {
    it('creates PeerInfo from valid object', async () => {
      const result = await Effect.runPromise(PeerInfoEffect.from(validPeerInfo))
      expect(result.name).toBe('Geth/v1.10.26-stable')
    })

    it('accesses network properties', async () => {
      const result = await Effect.runPromise(PeerInfoEffect.from(validPeerInfo))
      expect(result.network.inbound).toBe(false)
      expect(result.network.static).toBe(true)
    })

    it('fails for invalid object', async () => {
      const exit = await Effect.runPromiseExit(PeerInfoEffect.from({ invalid: true }))
      expect(Exit.isFailure(exit)).toBe(true)
    })
  })
})
