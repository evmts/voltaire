import { describe, it, expect } from 'vitest'
import { License } from '@tevm/voltaire'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as LicenseEffect from './index.js'

describe('License', () => {
  describe('LicenseSchema', () => {
    it('decodes valid license string', () => {
      const result = Schema.decodeSync(LicenseEffect.LicenseSchema)('MIT')
      expect(typeof result).toBe('string')
      expect(result).toBe('MIT')
    })

    it('decodes Apache-2.0 license', () => {
      const result = Schema.decodeSync(LicenseEffect.LicenseSchema)('Apache-2.0')
      expect(result).toBe('Apache-2.0')
    })

    it('fails for empty string', () => {
      expect(() => Schema.decodeSync(LicenseEffect.LicenseSchema)('')).toThrow()
    })

    it('encodes LicenseType back to string', () => {
      const license = License.from('MIT')
      const result = Schema.encodeSync(LicenseEffect.LicenseSchema)(license)
      expect(result).toBe('MIT')
    })
  })

  describe('from', () => {
    it('creates License from string', async () => {
      const result = await Effect.runPromise(LicenseEffect.from('MIT'))
      expect(result).toBe('MIT')
    })

    it('creates License from UNLICENSED', async () => {
      const result = await Effect.runPromise(LicenseEffect.from('UNLICENSED'))
      expect(result).toBe('UNLICENSED')
    })

    it('fails for empty string', async () => {
      const exit = await Effect.runPromiseExit(LicenseEffect.from(''))
      expect(Exit.isFailure(exit)).toBe(true)
    })
  })
})
