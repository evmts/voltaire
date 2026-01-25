import { describe, it, expect } from 'vitest'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'
import * as TraceResultEffect from './index.js'

describe('TraceResult', () => {
  const validTraceResult = {
    gas: 50000n,
    failed: false,
    returnValue: new Uint8Array([0x00, 0x01])
  }

  describe('TraceResultSchema', () => {
    it('decodes valid trace result', () => {
      const result = Schema.decodeSync(TraceResultEffect.TraceResultSchema)(validTraceResult)
      expect(result.gas).toBe(50000n)
      expect(result.failed).toBe(false)
      expect(result.returnValue).toBeInstanceOf(Uint8Array)
    })

    it('decodes trace result with structLogs', () => {
      const withLogs = {
        ...validTraceResult,
        structLogs: [{ pc: 0, op: 'PUSH1', gas: 1000000n, gasCost: 3n, depth: 0, stack: [] }]
      }
      const result = Schema.decodeSync(TraceResultEffect.TraceResultSchema)(withLogs)
      expect(result.structLogs).toBeDefined()
      expect(result.structLogs?.length).toBe(1)
    })

    it('fails for missing required fields', () => {
      expect(() => Schema.decodeSync(TraceResultEffect.TraceResultSchema)({
        gas: 50000n,
        failed: false
      } as any)).toThrow()
    })
  })

  describe('from', () => {
    it('creates trace result from valid data', async () => {
      const result = await Effect.runPromise(TraceResultEffect.from(validTraceResult))
      expect(result.gas).toBe(50000n)
      expect(result.failed).toBe(false)
    })

    it('creates trace result with empty returnValue', async () => {
      const result = await Effect.runPromise(TraceResultEffect.from({
        gas: 21000n,
        failed: false,
        returnValue: new Uint8Array()
      }))
      expect(result.returnValue.length).toBe(0)
    })

    it('creates failed trace result', async () => {
      const result = await Effect.runPromise(TraceResultEffect.from({
        gas: 50000n,
        failed: true,
        returnValue: new Uint8Array([0x08, 0xc3, 0x79, 0xa0])
      }))
      expect(result.failed).toBe(true)
    })
  })
})
