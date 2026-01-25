import { describe, it, expect } from 'vitest'
import * as S from 'effect/Schema'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as SignedData from './index.js'

describe('SignedData', () => {
  describe('Schema', () => {
    it('validates Uint8Array', () => {
      const data = new Uint8Array([0x19, 0x45, 1, 2, 3])
      const result = S.is(SignedData.Schema)(data)
      expect(result).toBe(true)
    })

    it('rejects non-Uint8Array', () => {
      const result = S.is(SignedData.Schema)('not bytes')
      expect(result).toBe(false)
    })
  })

  describe('SignedDataVersionSchema', () => {
    it('validates version 0x00', () => {
      expect(S.is(SignedData.SignedDataVersionSchema)(0x00)).toBe(true)
    })

    it('validates version 0x01', () => {
      expect(S.is(SignedData.SignedDataVersionSchema)(0x01)).toBe(true)
    })

    it('validates version 0x45', () => {
      expect(S.is(SignedData.SignedDataVersionSchema)(0x45)).toBe(true)
    })

    it('rejects invalid version', () => {
      expect(S.is(SignedData.SignedDataVersionSchema)(0x02)).toBe(false)
    })
  })

  describe('from', () => {
    it('creates signed data with personal message version', async () => {
      const result = await Effect.runPromise(
        SignedData.from(0x45, new Uint8Array(), new Uint8Array([1, 2, 3]))
      )
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result[0]).toBe(0x19)
      expect(result[1]).toBe(0x45)
    })

    it('fails for invalid version', async () => {
      const exit = await Effect.runPromiseExit(
        SignedData.from(0x02 as SignedData.SignedDataVersion, new Uint8Array(), new Uint8Array())
      )
      expect(Exit.isFailure(exit)).toBe(true)
    })
  })
})
