import { describe, it, expect } from 'vitest'
import * as Bundle from './index.js'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'
import { Address } from '@tevm/voltaire/Address'
import type { UserOperationType } from '../UserOperation/UserOperationSchema.js'

const mockBeneficiary = '0x742d35Cc6634C0532925a3b844Bc9e7595f251e3'
const mockEntryPoint = '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789'

const mockUserOp: UserOperationType = {
  sender: Address('0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed'),
  nonce: 0n,
  initCode: new Uint8Array(0),
  callData: new Uint8Array(0),
  callGasLimit: 100000n,
  verificationGasLimit: 200000n,
  preVerificationGas: 50000n,
  maxFeePerGas: 1000000000n,
  maxPriorityFeePerGas: 1000000000n,
  paymasterAndData: new Uint8Array(0),
  signature: new Uint8Array(0),
}

const mockUserOpInput = {
  sender: '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed',
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

describe('BundleSchema', () => {
  it('decodes valid bundle', () => {
    const input = {
      userOperations: [mockUserOpInput],
      beneficiary: mockBeneficiary,
      entryPoint: mockEntryPoint,
    }
    const result = Schema.decodeSync(Bundle.BundleSchema)(input)
    expect(result.userOperations).toHaveLength(1)
    expect(result.beneficiary).toBeInstanceOf(Uint8Array)
    expect(result.entryPoint).toBeInstanceOf(Uint8Array)
  })

  it('decodes empty userOperations array', () => {
    const input = {
      userOperations: [],
      beneficiary: mockBeneficiary,
      entryPoint: mockEntryPoint,
    }
    const result = Schema.decodeSync(Bundle.BundleSchema)(input)
    expect(result.userOperations).toHaveLength(0)
  })

  it('decodes multiple userOperations', () => {
    const input = {
      userOperations: [mockUserOpInput, mockUserOpInput, mockUserOpInput],
      beneficiary: mockBeneficiary,
      entryPoint: mockEntryPoint,
    }
    const result = Schema.decodeSync(Bundle.BundleSchema)(input)
    expect(result.userOperations).toHaveLength(3)
  })

  it('fails for invalid beneficiary', () => {
    expect(() => Schema.decodeSync(Bundle.BundleSchema)({
      userOperations: [mockUserOpInput],
      beneficiary: 'invalid',
      entryPoint: mockEntryPoint,
    })).toThrow()
  })
})

describe('Bundle.from', () => {
  it('creates from params', async () => {
    const result = await Effect.runPromise(Bundle.from({
      userOperations: [mockUserOp],
      beneficiary: mockBeneficiary,
      entryPoint: mockEntryPoint,
    }))
    expect(result.userOperations).toHaveLength(1)
    expect(result.beneficiary).toBeInstanceOf(Uint8Array)
  })

  it('handles Uint8Array addresses', async () => {
    const beneficiaryBytes = new Uint8Array(20).fill(0xab)
    const entryPointBytes = new Uint8Array(20).fill(0xcd)
    const result = await Effect.runPromise(Bundle.from({
      userOperations: [mockUserOp],
      beneficiary: beneficiaryBytes,
      entryPoint: entryPointBytes,
    }))
    expect(result.beneficiary).toEqual(beneficiaryBytes)
    expect(result.entryPoint).toEqual(entryPointBytes)
  })
})

describe('Bundle.validate', () => {
  it('succeeds for valid bundle', async () => {
    const bundle = await Effect.runPromise(Bundle.from({
      userOperations: [mockUserOp],
      beneficiary: mockBeneficiary,
      entryPoint: mockEntryPoint,
    }))
    await expect(Effect.runPromise(Bundle.validate(bundle))).resolves.toBeUndefined()
  })

  it('fails for empty bundle', async () => {
    const bundle = await Effect.runPromise(Bundle.from({
      userOperations: [],
      beneficiary: mockBeneficiary,
      entryPoint: mockEntryPoint,
    }))
    const result = await Effect.runPromiseExit(Bundle.validate(bundle))
    expect(result._tag).toBe('Failure')
  })
})

describe('Bundle.size', () => {
  it('returns number of userOperations', async () => {
    const bundle = await Effect.runPromise(Bundle.from({
      userOperations: [mockUserOp, mockUserOp],
      beneficiary: mockBeneficiary,
      entryPoint: mockEntryPoint,
    }))
    const result = await Effect.runPromise(Bundle.size(bundle))
    expect(result).toBe(2)
  })
})

describe('Bundle.isEmpty', () => {
  it('returns true for empty bundle', async () => {
    const bundle = await Effect.runPromise(Bundle.from({
      userOperations: [],
      beneficiary: mockBeneficiary,
      entryPoint: mockEntryPoint,
    }))
    const result = await Effect.runPromise(Bundle.isEmpty(bundle))
    expect(result).toBe(true)
  })

  it('returns false for non-empty bundle', async () => {
    const bundle = await Effect.runPromise(Bundle.from({
      userOperations: [mockUserOp],
      beneficiary: mockBeneficiary,
      entryPoint: mockEntryPoint,
    }))
    const result = await Effect.runPromise(Bundle.isEmpty(bundle))
    expect(result).toBe(false)
  })
})

describe('Bundle.totalGas', () => {
  it('calculates total gas for all ops', async () => {
    const bundle = await Effect.runPromise(Bundle.from({
      userOperations: [mockUserOp, mockUserOp],
      beneficiary: mockBeneficiary,
      entryPoint: mockEntryPoint,
    }))
    const result = await Effect.runPromise(Bundle.totalGas(bundle))
    expect(result).toBe((100000n + 200000n + 50000n) * 2n)
  })
})

describe('Bundle.add', () => {
  it('adds userOperation to bundle', async () => {
    const bundle = await Effect.runPromise(Bundle.from({
      userOperations: [mockUserOp],
      beneficiary: mockBeneficiary,
      entryPoint: mockEntryPoint,
    }))
    const newBundle = await Effect.runPromise(Bundle.add(bundle, mockUserOp))
    expect(newBundle.userOperations).toHaveLength(2)
  })
})

describe('Bundle.remove', () => {
  it('removes userOperation from bundle', async () => {
    const bundle = await Effect.runPromise(Bundle.from({
      userOperations: [mockUserOp, mockUserOp],
      beneficiary: mockBeneficiary,
      entryPoint: mockEntryPoint,
    }))
    const newBundle = await Effect.runPromise(Bundle.remove(bundle, 0))
    expect(newBundle.userOperations).toHaveLength(1)
  })

  it('fails for out of bounds index', async () => {
    const bundle = await Effect.runPromise(Bundle.from({
      userOperations: [mockUserOp],
      beneficiary: mockBeneficiary,
      entryPoint: mockEntryPoint,
    }))
    const result = await Effect.runPromiseExit(Bundle.remove(bundle, 5))
    expect(result._tag).toBe('Failure')
  })
})
