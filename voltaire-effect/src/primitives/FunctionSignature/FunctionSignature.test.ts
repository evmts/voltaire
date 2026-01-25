import { describe, it, expect } from 'vitest'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as FunctionSignature from './index.js'

describe('FunctionSignature', () => {
  describe('Schema', () => {
    it('decodes valid function signature', () => {
      const result = Schema.decodeSync(FunctionSignature.Schema)('transfer(address,uint256)')
      expect(result.name).toBe('transfer')
      expect(result.signature).toBe('transfer(address,uint256)')
      expect(result.selector).toBeInstanceOf(Uint8Array)
      expect(result.selector.length).toBe(4)
    })

    it('decodes simple function', () => {
      const result = Schema.decodeSync(FunctionSignature.Schema)('balanceOf(address)')
      expect(result.name).toBe('balanceOf')
    })

    it('encodes back to signature string', () => {
      const decoded = Schema.decodeSync(FunctionSignature.Schema)('approve(address,uint256)')
      const encoded = Schema.encodeSync(FunctionSignature.Schema)(decoded)
      expect(encoded).toBe('approve(address,uint256)')
    })
  })

  describe('from', () => {
    it('creates from signature string', async () => {
      const result = await Effect.runPromise(FunctionSignature.from('transfer(address,uint256)'))
      expect(result.name).toBe('transfer')
      expect(result.inputs).toContain('address')
      expect(result.inputs).toContain('uint256')
    })
  })

  describe('fromSignature', () => {
    it('creates from signature', async () => {
      const result = await Effect.runPromise(FunctionSignature.fromSignature('allowance(address,address)'))
      expect(result.name).toBe('allowance')
      expect(result.inputs.length).toBe(2)
    })

    it('fails for invalid signature', async () => {
      const exit = await Effect.runPromiseExit(FunctionSignature.fromSignature(''))
      expect(Exit.isFailure(exit)).toBe(true)
    })
  })
})
