import { describe, it, expect } from 'vitest'
import * as ContractResult from './index.js'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'

describe('ContractResultSchema', () => {
  it('decodes success result', () => {
    const input = { isSuccess: true, data: '0x1234' }
    const result = Schema.decodeSync(ContractResult.ContractResultSchema)(input)
    expect(result.success).toBe(true)
  })

  it('decodes failure result', () => {
    const input = { isSuccess: false, data: '0x08c379a0' }
    const result = Schema.decodeSync(ContractResult.ContractResultSchema)(input)
    expect(result.success).toBe(false)
  })
})

describe('ContractResult.from', () => {
  it('creates success result', async () => {
    const result = await Effect.runPromise(ContractResult.from(true, '0x1234'))
    expect(result.success).toBe(true)
  })

  it('creates failure result', async () => {
    const result = await Effect.runPromise(ContractResult.from(false, '0x08c379a0'))
    expect(result.success).toBe(false)
  })
})

describe('ContractResult.success', () => {
  it('creates success result from data', async () => {
    const data = new Uint8Array([0x12, 0x34])
    const result = await Effect.runPromise(ContractResult.success(data))
    expect(result.success).toBe(true)
  })
})

describe('ContractResult.failure', () => {
  it('creates failure result from revert reason', async () => {
    const revertReason = new Uint8Array([0x08, 0xc3, 0x79, 0xa0])
    const result = await Effect.runPromise(ContractResult.failure(revertReason))
    expect(result.success).toBe(false)
  })
})

describe('ContractResult.isSuccess', () => {
  it('returns true for success result', async () => {
    const result = await Effect.runPromise(ContractResult.from(true, '0x1234'))
    const isSuccess = await Effect.runPromise(ContractResult.isSuccess(result))
    expect(isSuccess).toBe(true)
  })

  it('returns false for failure result', async () => {
    const result = await Effect.runPromise(ContractResult.from(false, '0x08c379a0'))
    const isSuccess = await Effect.runPromise(ContractResult.isSuccess(result))
    expect(isSuccess).toBe(false)
  })
})

describe('ContractResult.unwrap', () => {
  it('unwraps success result', async () => {
    const result = await Effect.runPromise(ContractResult.from(true, '0x1234'))
    const data = await Effect.runPromise(ContractResult.unwrap(result))
    expect(data).toBeInstanceOf(Uint8Array)
  })

  it('fails on failure result', async () => {
    const result = await Effect.runPromise(ContractResult.from(false, '0x08c379a0'))
    const exit = await Effect.runPromiseExit(ContractResult.unwrap(result))
    expect(exit._tag).toBe('Failure')
  })
})

describe('ContractResult.unwrapOr', () => {
  it('returns data on success', async () => {
    const result = await Effect.runPromise(ContractResult.from(true, '0x1234'))
    const defaultData = new Uint8Array([0x00])
    const data = await Effect.runPromise(ContractResult.unwrapOr(result, defaultData))
    expect(data).not.toEqual(defaultData)
  })

  it('returns default on failure', async () => {
    const result = await Effect.runPromise(ContractResult.from(false, '0x08c379a0'))
    const defaultData = new Uint8Array([0x00])
    const data = await Effect.runPromise(ContractResult.unwrapOr(result, defaultData))
    expect(data).toEqual(defaultData)
  })
})
