import { describe, it, expect } from 'vitest'
import { OpStep } from '@tevm/voltaire'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'
import * as OpStepEffect from './index.js'

const validOpStep = {
  pc: 0,
  op: 0x60,
  gas: 1000000n,
  gasCost: 3n,
  depth: 0
}

describe('OpStep', () => {
  describe('OpStepSchema', () => {
    it('decodes valid OpStep object', () => {
      const result = Schema.decodeSync(OpStepEffect.OpStepSchema)(validOpStep)
      expect(result.pc).toBe(0)
      expect(result.op).toBe(0x60)
      expect(result.gas).toBe(1000000n)
    })

    it('decodes OpStep with optional fields', () => {
      const input = {
        ...validOpStep,
        stack: [1n, 2n, 3n],
        error: 'out of gas'
      }
      const result = Schema.decodeSync(OpStepEffect.OpStepSchema)(input)
      expect(result.stack).toEqual([1n, 2n, 3n])
      expect(result.error).toBe('out of gas')
    })

    it('encodes OpStep back to object', () => {
      const opStep = OpStep.from(validOpStep as Parameters<typeof OpStep.from>[0])
      const result = Schema.encodeSync(OpStepEffect.OpStepSchema)(opStep)
      expect(result.pc).toBe(0)
      expect(result.op).toBe(0x60)
    })
  })

  describe('from', () => {
    it('creates OpStep from valid object', async () => {
      const result = await Effect.runPromise(OpStepEffect.from(validOpStep as Parameters<typeof OpStep.from>[0]))
      expect(result.pc).toBe(0)
      expect(result.gas).toBe(1000000n)
    })

    it('creates OpStep with optional stack', async () => {
      const input = {
        ...validOpStep,
        stack: [1n, 2n]
      } as unknown as Parameters<typeof OpStep.from>[0]
      const result = await Effect.runPromise(OpStepEffect.from(input))
      expect(result.stack).toEqual([1n, 2n])
    })
  })
})
