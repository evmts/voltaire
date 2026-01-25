import { describe, it, expect } from 'vitest'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'
import * as UserOperation from './index.js'

const mockUserOpInput = {
  sender: '0x742d35Cc6634C0532925a3b844Bc9e7595f251e3',
  nonce: '0',
  initCode: '0x',
  callData: '0x',
  callGasLimit: '100000',
  verificationGasLimit: '200000',
  preVerificationGas: '50000',
  maxFeePerGas: '1000000000',
  maxPriorityFeePerGas: '1000000000',
  paymasterAndData: '0x',
  signature: '0x',
}

const ENTRYPOINT_V06 = '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789'

describe('UserOperation', () => {
  describe('UserOperationSchema', () => {
    it('decodes valid input to UserOperationType', () => {
      const result = Schema.decodeSync(UserOperation.UserOperationSchema)(mockUserOpInput)
      expect(result.sender).toBeInstanceOf(Uint8Array)
      expect(result.sender.length).toBe(20)
      expect(typeof result.nonce).toBe('bigint')
      expect(result.nonce).toBe(0n)
    })

    it('fails for invalid sender', () => {
      expect(() => Schema.decodeSync(UserOperation.UserOperationSchema)({
        ...mockUserOpInput,
        sender: 'invalid'
      })).toThrow()
    })

    it('encodes UserOperationType back to input format', () => {
      const decoded = Schema.decodeSync(UserOperation.UserOperationSchema)(mockUserOpInput)
      const result = Schema.encodeSync(UserOperation.UserOperationSchema)(decoded)
      expect(result.sender.toLowerCase()).toBe('0x742d35cc6634c0532925a3b844bc9e7595f251e3')
      expect(result.nonce).toBe('0')
    })
  })

  describe('from', () => {
    it('creates UserOperation from params', async () => {
      const result = await Effect.runPromise(UserOperation.from({
        sender: '0x742d35Cc6634C0532925a3b844Bc9e7595f251e3',
        nonce: 0n,
        initCode: '0x',
        callData: '0x',
        callGasLimit: 100000n,
        verificationGasLimit: 200000n,
        preVerificationGas: 50000n,
        maxFeePerGas: 1000000000n,
        maxPriorityFeePerGas: 1000000000n,
        paymasterAndData: '0x',
        signature: '0x',
      }))
      expect(result.sender).toBeInstanceOf(Uint8Array)
      expect(result.sender.length).toBe(20)
      expect(typeof result.nonce).toBe('bigint')
    })

    it('handles hex string inputs', async () => {
      const result = await Effect.runPromise(UserOperation.from({
        sender: '0x742d35Cc6634C0532925a3b844Bc9e7595f251e3',
        nonce: 0n,
        initCode: '0x1234',
        callData: '0xabcd',
        callGasLimit: 100000n,
        verificationGasLimit: 200000n,
        preVerificationGas: 50000n,
        maxFeePerGas: 1000000000n,
        maxPriorityFeePerGas: 1000000000n,
        paymasterAndData: '0x',
        signature: '0x',
      }))
      expect(result.initCode).toEqual(new Uint8Array([0x12, 0x34]))
      expect(result.callData).toEqual(new Uint8Array([0xab, 0xcd]))
    })
  })

  describe('hash', () => {
    it('computes userOpHash', async () => {
      const userOp = await Effect.runPromise(UserOperation.from({
        sender: '0x742d35Cc6634C0532925a3b844Bc9e7595f251e3',
        nonce: 0n,
        initCode: '0x',
        callData: '0x',
        callGasLimit: 100000n,
        verificationGasLimit: 200000n,
        preVerificationGas: 50000n,
        maxFeePerGas: 1000000000n,
        maxPriorityFeePerGas: 1000000000n,
        paymasterAndData: '0x',
        signature: '0x',
      }))
      const result = await Effect.runPromise(UserOperation.hash(userOp, ENTRYPOINT_V06, 1n))
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(32)
    })
  })

  describe('pack', () => {
    it('packs UserOperation to PackedUserOperation', async () => {
      const userOp = await Effect.runPromise(UserOperation.from({
        sender: '0x742d35Cc6634C0532925a3b844Bc9e7595f251e3',
        nonce: 0n,
        initCode: '0x',
        callData: '0x',
        callGasLimit: 100000n,
        verificationGasLimit: 200000n,
        preVerificationGas: 50000n,
        maxFeePerGas: 1000000000n,
        maxPriorityFeePerGas: 1000000000n,
        paymasterAndData: '0x',
        signature: '0x',
      }))
      const result = await Effect.runPromise(UserOperation.pack(userOp))
      expect(result.sender).toEqual(userOp.sender)
      expect(result.nonce).toBe(userOp.nonce)
      expect(result.accountGasLimits).toBeInstanceOf(Uint8Array)
      expect(result.accountGasLimits.length).toBe(32)
      expect(result.gasFees).toBeInstanceOf(Uint8Array)
      expect(result.gasFees.length).toBe(32)
    })
  })
})
