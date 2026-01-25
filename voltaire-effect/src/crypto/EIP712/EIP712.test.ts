import { describe, it, expect } from 'vitest'
import * as Effect from 'effect/Effect'
import { EIP712Service, EIP712Live, EIP712Test, hashTypedData, signTypedData, verifyTypedData, recoverAddress } from './index.js'
import { Address } from '@tevm/voltaire'
import { from as privateKeyFrom } from '@tevm/voltaire/PrivateKey'
import type { TypedData, Domain } from '@tevm/voltaire/EIP712'

const testDomain: Domain = {
  name: 'Test App',
  version: '1',
  chainId: 1n,
}

const testTypedData: TypedData = {
  domain: testDomain,
  types: {
    Message: [
      { name: 'content', type: 'string' }
    ]
  },
  primaryType: 'Message',
  message: {
    content: 'Hello, World!'
  }
}

const testPrivateKey = privateKeyFrom('0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef')

describe('EIP712Service', () => {
  describe('EIP712Live', () => {
    it('hashes typed data', async () => {
      const program = Effect.gen(function* () {
        const eip712 = yield* EIP712Service
        return yield* eip712.hashTypedData(testTypedData)
      })

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(EIP712Live))
      )

      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(32)
    })

    it('signs typed data', async () => {
      const program = Effect.gen(function* () {
        const eip712 = yield* EIP712Service
        return yield* eip712.signTypedData(testTypedData, testPrivateKey)
      })

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(EIP712Live))
      )

      expect(result).toHaveProperty('r')
      expect(result).toHaveProperty('s')
      expect(result).toHaveProperty('v')
      expect(result.r).toBeInstanceOf(Uint8Array)
      expect(result.r.length).toBe(32)
      expect(result.s.length).toBe(32)
    })

    it('recovers address from signature', async () => {
      const program = Effect.gen(function* () {
        const eip712 = yield* EIP712Service
        const signature = yield* eip712.signTypedData(testTypedData, testPrivateKey)
        return yield* eip712.recoverAddress(signature, testTypedData)
      })

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(EIP712Live))
      )

      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(20)
    })

    it('verifies typed data signature', async () => {
      const program = Effect.gen(function* () {
        const eip712 = yield* EIP712Service
        const signature = yield* eip712.signTypedData(testTypedData, testPrivateKey)
        const recoveredAddress = yield* eip712.recoverAddress(signature, testTypedData)
        return yield* eip712.verifyTypedData(signature, testTypedData, recoveredAddress)
      })

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(EIP712Live))
      )

      expect(result).toBe(true)
    })

    it('hashes domain', async () => {
      const program = Effect.gen(function* () {
        const eip712 = yield* EIP712Service
        return yield* eip712.hashDomain(testDomain)
      })

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(EIP712Live))
      )

      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(32)
    })

    it('hashes struct', async () => {
      const program = Effect.gen(function* () {
        const eip712 = yield* EIP712Service
        return yield* eip712.hashStruct('Message', testTypedData.message, testTypedData.types)
      })

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(EIP712Live))
      )

      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(32)
    })
  })

  describe('EIP712Test', () => {
    it('returns mock hash', async () => {
      const program = Effect.gen(function* () {
        const eip712 = yield* EIP712Service
        return yield* eip712.hashTypedData(testTypedData)
      })

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(EIP712Test))
      )

      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(32)
      expect(result.every(b => b === 0)).toBe(true)
    })

    it('returns mock signature', async () => {
      const program = Effect.gen(function* () {
        const eip712 = yield* EIP712Service
        return yield* eip712.signTypedData(testTypedData, testPrivateKey)
      })

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(EIP712Test))
      )

      expect(result).toHaveProperty('r')
      expect(result).toHaveProperty('s')
      expect(result).toHaveProperty('v')
    })

    it('always verifies as true', async () => {
      const program = Effect.gen(function* () {
        const eip712 = yield* EIP712Service
        const signature = yield* eip712.signTypedData(testTypedData, testPrivateKey)
        const mockAddress = new Uint8Array(20) as import('@tevm/voltaire/Address').AddressType
        return yield* eip712.verifyTypedData(signature, testTypedData, mockAddress)
      })

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(EIP712Test))
      )

      expect(result).toBe(true)
    })
  })
})

describe('convenience functions', () => {
  it('hashTypedData works with service dependency', async () => {
    const result = await Effect.runPromise(
      hashTypedData(testTypedData).pipe(Effect.provide(EIP712Live))
    )
    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBe(32)
  })

  it('signTypedData works with service dependency', async () => {
    const result = await Effect.runPromise(
      signTypedData(testTypedData, testPrivateKey).pipe(Effect.provide(EIP712Live))
    )
    expect(result).toHaveProperty('r')
  })

  it('recoverAddress works with service dependency', async () => {
    const program = Effect.gen(function* () {
      const signature = yield* signTypedData(testTypedData, testPrivateKey)
      return yield* recoverAddress(signature, testTypedData)
    })

    const result = await Effect.runPromise(
      program.pipe(Effect.provide(EIP712Live))
    )
    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBe(20)
  })

  it('verifyTypedData works with service dependency', async () => {
    const program = Effect.gen(function* () {
      const signature = yield* signTypedData(testTypedData, testPrivateKey)
      const address = yield* recoverAddress(signature, testTypedData)
      return yield* verifyTypedData(signature, testTypedData, address)
    })

    const result = await Effect.runPromise(
      program.pipe(Effect.provide(EIP712Live))
    )
    expect(result).toBe(true)
  })
})
