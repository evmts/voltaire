import { describe, it, expect } from 'vitest'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'
import * as TraceConfigEffect from './index.js'

describe('TraceConfig', () => {
  describe('TraceConfigSchema', () => {
    it('decodes empty config', () => {
      const result = Schema.decodeSync(TraceConfigEffect.TraceConfigSchema)({})
      expect(typeof result).toBe('object')
    })

    it('decodes config with disable flags', () => {
      const result = Schema.decodeSync(TraceConfigEffect.TraceConfigSchema)({
        disableStorage: true,
        disableMemory: true
      })
      expect(result.disableStorage).toBe(true)
      expect(result.disableMemory).toBe(true)
    })

    it('decodes config with tracer', () => {
      const result = Schema.decodeSync(TraceConfigEffect.TraceConfigSchema)({
        tracer: 'callTracer'
      })
      expect(result.tracer).toBe('callTracer')
    })

    it('decodes config with timeout', () => {
      const result = Schema.decodeSync(TraceConfigEffect.TraceConfigSchema)({
        timeout: '30s'
      })
      expect(result.timeout).toBe('30s')
    })
  })

  describe('from', () => {
    it('creates trace config with defaults', async () => {
      const result = await Effect.runPromise(TraceConfigEffect.from())
      expect(typeof result).toBe('object')
    })

    it('creates trace config with options', async () => {
      const result = await Effect.runPromise(TraceConfigEffect.from({
        disableStorage: true,
        disableStack: true,
        tracer: 'callTracer'
      }))
      expect(result.disableStorage).toBe(true)
      expect(result.disableStack).toBe(true)
      expect(result.tracer).toBe('callTracer')
    })

    it('creates trace config with tracerConfig', async () => {
      const result = await Effect.runPromise(TraceConfigEffect.from({
        tracer: 'prestateTracer',
        tracerConfig: { diffMode: true }
      }))
      expect(result.tracer).toBe('prestateTracer')
      expect(result.tracerConfig).toEqual({ diffMode: true })
    })
  })
})
