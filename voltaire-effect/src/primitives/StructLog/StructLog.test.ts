import { describe, it, expect } from 'vitest'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as StructLogEffect from './index.js'

describe('StructLog', () => {
  const validStructLog = {
    pc: 0,
    op: 'PUSH1',
    gas: 1000000n,
    gasCost: 3n,
    depth: 0,
    stack: ['0x60']
  }

  describe('StructLogSchema', () => {
    it('decodes valid struct log', () => {
      const result = Schema.decodeSync(StructLogEffect.StructLogSchema)(validStructLog)
      expect(result.pc).toBe(0)
      expect(result.op).toBe('PUSH1')
      expect(result.gas).toBe(1000000n)
    })

    it('decodes struct log with optional fields', () => {
      const withOptionals = {
        ...validStructLog,
        memory: ['0x00'],
        storage: { '0x00': '0x01' },
        refund: 100n,
        error: 'test error'
      }
      const result = Schema.decodeSync(StructLogEffect.StructLogSchema)(withOptionals)
      expect(result.memory).toEqual(['0x00'])
      expect(result.storage).toEqual({ '0x00': '0x01' })
      expect(result.refund).toBe(100n)
      expect(result.error).toBe('test error')
    })

    it('fails for missing required fields', () => {
      expect(() => Schema.decodeSync(StructLogEffect.StructLogSchema)({
        pc: 0,
        op: 'PUSH1'
      } as any)).toThrow()
    })
  })

  describe('from', () => {
    it('creates struct log from valid data', async () => {
      const result = await Effect.runPromise(StructLogEffect.from(validStructLog))
      expect(result.pc).toBe(0)
      expect(result.op).toBe('PUSH1')
    })

    it('creates struct log with optional memory', async () => {
      const result = await Effect.runPromise(StructLogEffect.from({
        ...validStructLog,
        memory: ['0x00', '0x01']
      }))
      expect(result.memory).toEqual(['0x00', '0x01'])
    })
  })
})
