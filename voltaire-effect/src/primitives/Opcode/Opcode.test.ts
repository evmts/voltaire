import { describe, it, expect } from 'vitest'
import { Opcode } from '@tevm/voltaire'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as OpcodeEffect from './index.js'

describe('Opcode', () => {
  describe('OpcodeSchema', () => {
    it('decodes valid opcode number', () => {
      const result = Schema.decodeSync(OpcodeEffect.OpcodeSchema)(0x01)
      expect(typeof result).toBe('number')
      expect(result).toBe(0x01)
    })

    it('decodes STOP opcode (0x00)', () => {
      const result = Schema.decodeSync(OpcodeEffect.OpcodeSchema)(0x00)
      expect(result).toBe(0x00)
    })

    it('decodes max opcode (0xFF)', () => {
      const result = Schema.decodeSync(OpcodeEffect.OpcodeSchema)(0xff)
      expect(result).toBe(0xff)
    })

    it('fails for values above 0xFF', () => {
      expect(() => Schema.decodeSync(OpcodeEffect.OpcodeSchema)(0x100)).toThrow()
    })

    it('fails for negative values', () => {
      expect(() => Schema.decodeSync(OpcodeEffect.OpcodeSchema)(-1)).toThrow()
    })

    it('encodes Opcode back to number', () => {
      const opcode = Opcode(0x60)
      const result = Schema.encodeSync(OpcodeEffect.OpcodeSchema)(opcode)
      expect(result).toBe(0x60)
    })
  })

  describe('from', () => {
    it('creates Opcode from number', async () => {
      const result = await Effect.runPromise(OpcodeEffect.from(0x01))
      expect(result).toBe(0x01)
    })

    it('creates PUSH1 opcode', async () => {
      const result = await Effect.runPromise(OpcodeEffect.from(0x60))
      expect(result).toBe(0x60)
    })

    it('fails for values above 0xFF', async () => {
      const exit = await Effect.runPromiseExit(OpcodeEffect.from(0x100))
      expect(Exit.isFailure(exit)).toBe(true)
    })

    it('fails for negative values', async () => {
      const exit = await Effect.runPromiseExit(OpcodeEffect.from(-1))
      expect(Exit.isFailure(exit)).toBe(true)
    })
  })
})
