import { describe, it, expect } from 'vitest'
import { PeerId } from '@tevm/voltaire'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as PeerIdEffect from './index.js'

describe('PeerId', () => {
  describe('PeerIdSchema', () => {
    it('decodes valid enode URL', () => {
      const enode = 'enode://abc123@192.168.1.1:30303'
      const result = Schema.decodeSync(PeerIdEffect.PeerIdSchema)(enode)
      expect(typeof result).toBe('string')
      expect(result).toBe(enode)
    })

    it('decodes node ID string', () => {
      const nodeId = 'abc123def456'
      const result = Schema.decodeSync(PeerIdEffect.PeerIdSchema)(nodeId)
      expect(result).toBe(nodeId)
    })

    it('fails for empty string', () => {
      expect(() => Schema.decodeSync(PeerIdEffect.PeerIdSchema)('')).toThrow()
    })

    it('encodes PeerId back to string', () => {
      const peerId = PeerId.from('enode://abc123@192.168.1.1:30303')
      const result = Schema.encodeSync(PeerIdEffect.PeerIdSchema)(peerId)
      expect(result).toBe('enode://abc123@192.168.1.1:30303')
    })
  })

  describe('from', () => {
    it('creates PeerId from enode URL', async () => {
      const enode = 'enode://abc123@192.168.1.1:30303'
      const result = await Effect.runPromise(PeerIdEffect.from(enode))
      expect(result).toBe(enode)
    })

    it('creates PeerId from node ID', async () => {
      const nodeId = 'abc123def456'
      const result = await Effect.runPromise(PeerIdEffect.from(nodeId))
      expect(result).toBe(nodeId)
    })

    it('fails for empty string', async () => {
      const exit = await Effect.runPromiseExit(PeerIdEffect.from(''))
      expect(Exit.isFailure(exit)).toBe(true)
    })
  })
})
