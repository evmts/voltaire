import { describe, it, expect } from 'vitest'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'
import * as PackedUserOperation from './index.js'
import * as UserOperation from '../UserOperation/index.js'

const ENTRYPOINT_V07 = '0x0000000071727De22E5E9d8BAf0edAc6f37da032'

describe('PackedUserOperation', () => {
  describe('PackedUserOperationSchema', () => {
    it('decodes valid input to PackedUserOperationType', () => {
      const input = {
        sender: '0x742d35Cc6634C0532925a3b844Bc9e7595f251e3',
        nonce: '0',
        initCode: '0x',
        callData: '0x',
        accountGasLimits: '0x' + '00'.repeat(32),
        preVerificationGas: '50000',
        gasFees: '0x' + '00'.repeat(32),
        paymasterAndData: '0x',
        signature: '0x',
      }
      const result = Schema.decodeSync(PackedUserOperation.PackedUserOperationSchema)(input)
      expect(result.sender).toBeInstanceOf(Uint8Array)
      expect(result.sender.length).toBe(20)
      expect(result.accountGasLimits.length).toBe(32)
      expect(result.gasFees.length).toBe(32)
    })

    it('fails for invalid sender', () => {
      expect(() => Schema.decodeSync(PackedUserOperation.PackedUserOperationSchema)({
        sender: 'invalid',
        nonce: '0',
        initCode: '0x',
        callData: '0x',
        accountGasLimits: '0x' + '00'.repeat(32),
        preVerificationGas: '50000',
        gasFees: '0x' + '00'.repeat(32),
        paymasterAndData: '0x',
        signature: '0x',
      })).toThrow()
    })

    it('encodes PackedUserOperationType back to input format', () => {
      const input = {
        sender: '0x742d35Cc6634C0532925a3b844Bc9e7595f251e3',
        nonce: '0',
        initCode: '0x',
        callData: '0x',
        accountGasLimits: '0x' + '00'.repeat(32),
        preVerificationGas: '50000',
        gasFees: '0x' + '00'.repeat(32),
        paymasterAndData: '0x',
        signature: '0x',
      }
      const decoded = Schema.decodeSync(PackedUserOperation.PackedUserOperationSchema)(input)
      const result = Schema.encodeSync(PackedUserOperation.PackedUserOperationSchema)(decoded)
      expect(result.sender.toLowerCase()).toBe('0x742d35cc6634c0532925a3b844bc9e7595f251e3')
      expect(result.nonce).toBe('0')
    })
  })

  describe('from', () => {
    it('creates PackedUserOperation from params', async () => {
      const result = await Effect.runPromise(PackedUserOperation.from({
        sender: '0x742d35Cc6634C0532925a3b844Bc9e7595f251e3',
        nonce: 0n,
        initCode: '0x',
        callData: '0x',
        accountGasLimits: new Uint8Array(32),
        preVerificationGas: 50000n,
        gasFees: new Uint8Array(32),
        paymasterAndData: '0x',
        signature: '0x',
      }))
      expect(result.sender).toBeInstanceOf(Uint8Array)
      expect(result.sender.length).toBe(20)
      expect(result.accountGasLimits.length).toBe(32)
    })
  })

  describe('hash', () => {
    it('computes hash', async () => {
      const packed = await Effect.runPromise(PackedUserOperation.from({
        sender: '0x742d35Cc6634C0532925a3b844Bc9e7595f251e3',
        nonce: 0n,
        initCode: '0x',
        callData: '0x',
        accountGasLimits: new Uint8Array(32),
        preVerificationGas: 50000n,
        gasFees: new Uint8Array(32),
        paymasterAndData: '0x',
        signature: '0x',
      }))
      const result = await Effect.runPromise(PackedUserOperation.hash(packed, ENTRYPOINT_V07, 1n))
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(32)
    })
  })

  describe('unpack', () => {
    it('unpacks to UserOperation', async () => {
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
      const packed = await Effect.runPromise(UserOperation.pack(userOp))
      const result = await Effect.runPromise(PackedUserOperation.unpack(packed))
      expect(result.callGasLimit).toBe(userOp.callGasLimit)
      expect(result.verificationGasLimit).toBe(userOp.verificationGasLimit)
    })

    it('round-trip pack/unpack', async () => {
      const original = await Effect.runPromise(UserOperation.from({
        sender: '0x742d35Cc6634C0532925a3b844Bc9e7595f251e3',
        nonce: 5n,
        initCode: '0x1234',
        callData: '0xabcd',
        callGasLimit: 100000n,
        verificationGasLimit: 200000n,
        preVerificationGas: 50000n,
        maxFeePerGas: 1500000000n,
        maxPriorityFeePerGas: 1000000000n,
        paymasterAndData: '0xef01',
        signature: '0x9876',
      }))
      const packed = await Effect.runPromise(UserOperation.pack(original))
      const unpacked = await Effect.runPromise(PackedUserOperation.unpack(packed))
      expect(unpacked.nonce).toBe(original.nonce)
      expect(unpacked.callGasLimit).toBe(original.callGasLimit)
      expect(unpacked.verificationGasLimit).toBe(original.verificationGasLimit)
      expect(unpacked.maxFeePerGas).toBe(original.maxFeePerGas)
      expect(unpacked.maxPriorityFeePerGas).toBe(original.maxPriorityFeePerGas)
    })
  })
})
