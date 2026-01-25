import { describe, it, expect } from 'vitest'
import { BeaconBlockRoot } from '@tevm/voltaire'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as BeaconBlockRootEffect from './index.js'

const VALID_ROOT = '0x' + '00'.repeat(32)
const VALID_ROOT_BYTES = new Uint8Array(32).fill(0)

describe('BeaconBlockRoot', () => {
  describe('BeaconBlockRootSchema', () => {
    it('decodes valid hex string to BeaconBlockRootType', () => {
      const result = Schema.decodeSync(BeaconBlockRootEffect.BeaconBlockRootSchema)(VALID_ROOT)
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(32)
    })

    it('fails for invalid hex string', () => {
      expect(() => Schema.decodeSync(BeaconBlockRootEffect.BeaconBlockRootSchema)('invalid')).toThrow()
    })

    it('fails for wrong length', () => {
      expect(() => Schema.decodeSync(BeaconBlockRootEffect.BeaconBlockRootSchema)('0x1234')).toThrow()
    })

    it('encodes BeaconBlockRootType back to string', () => {
      const root = BeaconBlockRoot.from(VALID_ROOT)
      const result = Schema.encodeSync(BeaconBlockRootEffect.BeaconBlockRootSchema)(root)
      expect(typeof result).toBe('string')
      expect(result.startsWith('0x')).toBe(true)
    })
  })

  describe('from', () => {
    it('creates BeaconBlockRoot from hex string', async () => {
      const result = await Effect.runPromise(BeaconBlockRootEffect.from(VALID_ROOT))
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(32)
    })

    it('creates BeaconBlockRoot from bytes', async () => {
      const result = await Effect.runPromise(BeaconBlockRootEffect.from(VALID_ROOT_BYTES))
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(32)
    })

    it('fails for invalid input', async () => {
      const exit = await Effect.runPromiseExit(BeaconBlockRootEffect.from('invalid'))
      expect(Exit.isFailure(exit)).toBe(true)
    })
  })

  describe('toHex', () => {
    it('converts BeaconBlockRoot to hex string', () => {
      const root = BeaconBlockRoot.from(VALID_ROOT)
      const result = BeaconBlockRootEffect.toHex(root)
      expect(typeof result).toBe('string')
      expect(result.startsWith('0x')).toBe(true)
      expect(result.length).toBe(66)
    })
  })
})
