import { describe, it, expect } from 'vitest'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as CallDataEffect from './index.js'

describe('CallData', () => {
  describe('CallDataSchema', () => {
    it('decodes valid hex string', () => {
      const result = Schema.decodeSync(CallDataEffect.CallDataSchema)('0xa9059cbb')
      expect(result).toBe('0xa9059cbb')
    })

    it('decodes empty calldata', () => {
      const result = Schema.decodeSync(CallDataEffect.CallDataSchema)('0x')
      expect(result).toBe('0x')
    })

    it('decodes full transfer calldata', () => {
      const transferCalldata = '0xa9059cbb000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb922660000000000000000000000000000000000000000000000000de0b6b3a7640000'
      const result = Schema.decodeSync(CallDataEffect.CallDataSchema)(transferCalldata)
      expect(result).toBe(transferCalldata)
    })

    it('fails for invalid hex string', () => {
      expect(() => Schema.decodeSync(CallDataEffect.CallDataSchema)('invalid')).toThrow()
    })

    it('fails for non-prefixed hex', () => {
      expect(() => Schema.decodeSync(CallDataEffect.CallDataSchema)('a9059cbb')).toThrow()
    })

    it('encodes CallDataType back to string', () => {
      const calldata = '0xa9059cbb' as CallDataEffect.CallDataType
      const result = Schema.encodeSync(CallDataEffect.CallDataSchema)(calldata)
      expect(result).toBe('0xa9059cbb')
    })
  })

  describe('from', () => {
    it('creates CallData from valid hex', async () => {
      const result = await Effect.runPromise(CallDataEffect.from('0xa9059cbb'))
      expect(result).toBe('0xa9059cbb')
    })

    it('creates empty CallData', async () => {
      const result = await Effect.runPromise(CallDataEffect.from('0x'))
      expect(result).toBe('0x')
    })

    it('creates CallData for ERC20 transfer', async () => {
      const transferCalldata = '0xa9059cbb000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb922660000000000000000000000000000000000000000000000000de0b6b3a7640000'
      const result = await Effect.runPromise(CallDataEffect.from(transferCalldata))
      expect(result).toBe(transferCalldata)
    })

    it('fails for invalid hex', async () => {
      const exit = await Effect.runPromiseExit(CallDataEffect.from('not-hex'))
      expect(Exit.isFailure(exit)).toBe(true)
    })

    it('fails for non-prefixed hex', async () => {
      const exit = await Effect.runPromiseExit(CallDataEffect.from('a9059cbb'))
      expect(Exit.isFailure(exit)).toBe(true)
    })
  })

  describe('empty', () => {
    it('creates empty calldata', () => {
      const result = CallDataEffect.empty()
      expect(result).toBe('0x')
    })
  })
})
