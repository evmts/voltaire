import { describe, it, expect } from 'vitest'
import * as BuilderBid from './index.js'
import * as Schema from 'effect/Schema'
import * as Effect from 'effect/Effect'

const mockBuilderPubkey = '0x' + 'ab'.repeat(48)
const mockBuilderAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f251e3'
const mockFeeRecipient = '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed'
const mockParentHash = '0x' + 'cd'.repeat(32)
const mockBlockHash = '0x' + 'ef'.repeat(32)

const mockBidInput = {
  builderPubkey: mockBuilderPubkey,
  builderAddress: mockBuilderAddress,
  value: '1000000000000000000',
  gasLimit: '30000000',
  gasUsed: '15000000',
  slot: '1000000',
  parentHash: mockParentHash,
  blockHash: mockBlockHash,
  feeRecipient: mockFeeRecipient,
  timestamp: '1700000000',
}

describe('BuilderBidSchema', () => {
  it('decodes valid builder bid', () => {
    const result = Schema.decodeSync(BuilderBid.BuilderBidSchema)(mockBidInput)
    expect(result.builderPubkey).toBeInstanceOf(Uint8Array)
    expect(result.builderPubkey.length).toBe(48)
    expect(result.builderAddress).toBeInstanceOf(Uint8Array)
    expect(result.value).toBe(1000000000000000000n)
    expect(result.gasLimit).toBe(30000000n)
  })

  it('decodes with bigint inputs', () => {
    const input = {
      ...mockBidInput,
      value: 1000000000000000000n,
      gasLimit: 30000000n,
      gasUsed: 15000000n,
      slot: 1000000n,
      timestamp: 1700000000n,
    }
    const result = Schema.decodeSync(BuilderBid.BuilderBidSchema)(input)
    expect(result.value).toBe(1000000000000000000n)
  })

  it('fails for invalid builderAddress', () => {
    expect(() => Schema.decodeSync(BuilderBid.BuilderBidSchema)({
      ...mockBidInput,
      builderAddress: 'invalid',
    })).toThrow()
  })
})

describe('BuilderBid.from', () => {
  it('creates from params', async () => {
    const result = await Effect.runPromise(BuilderBid.from({
      builderPubkey: mockBuilderPubkey,
      builderAddress: mockBuilderAddress,
      value: 1000000000000000000n,
      gasLimit: 30000000n,
      gasUsed: 15000000n,
      slot: 1000000n,
      parentHash: mockParentHash,
      blockHash: mockBlockHash,
      feeRecipient: mockFeeRecipient,
      timestamp: 1700000000n,
    }))
    expect(result.builderPubkey).toBeInstanceOf(Uint8Array)
    expect(result.value).toBe(1000000000000000000n)
  })

  it('handles Uint8Array inputs', async () => {
    const pubkeyBytes = new Uint8Array(48).fill(0xab)
    const parentHashBytes = new Uint8Array(32).fill(0xcd)
    const blockHashBytes = new Uint8Array(32).fill(0xef)
    const addressBytes = new Uint8Array(20).fill(0x11)

    const result = await Effect.runPromise(BuilderBid.from({
      builderPubkey: pubkeyBytes,
      builderAddress: addressBytes,
      value: 1000000000000000000n,
      gasLimit: 30000000n,
      gasUsed: 15000000n,
      slot: 1000000n,
      parentHash: parentHashBytes,
      blockHash: blockHashBytes,
      feeRecipient: addressBytes,
      timestamp: 1700000000n,
    }))
    expect(result.builderPubkey).toEqual(pubkeyBytes)
    expect(result.parentHash).toEqual(parentHashBytes)
  })
})

describe('BuilderBid.validate', () => {
  it('succeeds for valid bid', async () => {
    const bid = await Effect.runPromise(BuilderBid.from({
      builderPubkey: mockBuilderPubkey,
      builderAddress: mockBuilderAddress,
      value: 1000000000000000000n,
      gasLimit: 30000000n,
      gasUsed: 15000000n,
      slot: 1000000n,
      parentHash: mockParentHash,
      blockHash: mockBlockHash,
      feeRecipient: mockFeeRecipient,
      timestamp: 1700000000n,
    }))
    await expect(Effect.runPromise(BuilderBid.validate(bid))).resolves.toBeUndefined()
  })

  it('fails for negative value', async () => {
    const bid = {
      builderPubkey: new Uint8Array(48),
      builderAddress: new Uint8Array(20),
      value: -1n,
      gasLimit: 30000000n,
      gasUsed: 15000000n,
      slot: 1000000n,
      parentHash: new Uint8Array(32),
      blockHash: new Uint8Array(32),
      feeRecipient: new Uint8Array(20),
      timestamp: 1700000000n,
    } as BuilderBid.BuilderBidType
    const result = await Effect.runPromiseExit(BuilderBid.validate(bid))
    expect(result._tag).toBe('Failure')
  })

  it('fails when gasUsed exceeds gasLimit', async () => {
    const bid = {
      builderPubkey: new Uint8Array(48),
      builderAddress: new Uint8Array(20),
      value: 1000000000000000000n,
      gasLimit: 10000000n,
      gasUsed: 20000000n,
      slot: 1000000n,
      parentHash: new Uint8Array(32),
      blockHash: new Uint8Array(32),
      feeRecipient: new Uint8Array(20),
      timestamp: 1700000000n,
    } as BuilderBid.BuilderBidType
    const result = await Effect.runPromiseExit(BuilderBid.validate(bid))
    expect(result._tag).toBe('Failure')
  })

  it('fails for wrong pubkey length', async () => {
    const bid = {
      builderPubkey: new Uint8Array(32),
      builderAddress: new Uint8Array(20),
      value: 1000000000000000000n,
      gasLimit: 30000000n,
      gasUsed: 15000000n,
      slot: 1000000n,
      parentHash: new Uint8Array(32),
      blockHash: new Uint8Array(32),
      feeRecipient: new Uint8Array(20),
      timestamp: 1700000000n,
    } as BuilderBid.BuilderBidType
    const result = await Effect.runPromiseExit(BuilderBid.validate(bid))
    expect(result._tag).toBe('Failure')
  })
})

describe('BuilderBid.valuePerGas', () => {
  it('calculates value per gas', async () => {
    const bid = await Effect.runPromise(BuilderBid.from({
      builderPubkey: mockBuilderPubkey,
      builderAddress: mockBuilderAddress,
      value: 1000000000000000000n,
      gasLimit: 30000000n,
      gasUsed: 10000000n,
      slot: 1000000n,
      parentHash: mockParentHash,
      blockHash: mockBlockHash,
      feeRecipient: mockFeeRecipient,
      timestamp: 1700000000n,
    }))
    const result = await Effect.runPromise(BuilderBid.valuePerGas(bid))
    expect(result).toBe(100000000000n)
  })

  it('fails when gasUsed is 0', async () => {
    const bid = await Effect.runPromise(BuilderBid.from({
      builderPubkey: mockBuilderPubkey,
      builderAddress: mockBuilderAddress,
      value: 1000000000000000000n,
      gasLimit: 30000000n,
      gasUsed: 0n,
      slot: 1000000n,
      parentHash: mockParentHash,
      blockHash: mockBlockHash,
      feeRecipient: mockFeeRecipient,
      timestamp: 1700000000n,
    }))
    const result = await Effect.runPromiseExit(BuilderBid.valuePerGas(bid))
    expect(result._tag).toBe('Failure')
  })
})

describe('BuilderBid.toHex', () => {
  it('converts to hex representation', async () => {
    const bid = await Effect.runPromise(BuilderBid.from({
      builderPubkey: mockBuilderPubkey,
      builderAddress: mockBuilderAddress,
      value: 1000000000000000000n,
      gasLimit: 30000000n,
      gasUsed: 15000000n,
      slot: 1000000n,
      parentHash: mockParentHash,
      blockHash: mockBlockHash,
      feeRecipient: mockFeeRecipient,
      timestamp: 1700000000n,
    }))
    const hex = await Effect.runPromise(BuilderBid.toHex(bid))
    expect(hex.builderPubkey.startsWith('0x')).toBe(true)
    expect(hex.builderAddress.startsWith('0x')).toBe(true)
    expect(hex.value.startsWith('0x')).toBe(true)
  })
})

describe('BuilderBid.compareBids', () => {
  it('returns 1 when first bid has higher value', async () => {
    const bidA = await Effect.runPromise(BuilderBid.from({
      builderPubkey: mockBuilderPubkey,
      builderAddress: mockBuilderAddress,
      value: 2000000000000000000n,
      gasLimit: 30000000n,
      gasUsed: 15000000n,
      slot: 1000000n,
      parentHash: mockParentHash,
      blockHash: mockBlockHash,
      feeRecipient: mockFeeRecipient,
      timestamp: 1700000000n,
    }))
    const bidB = await Effect.runPromise(BuilderBid.from({
      builderPubkey: mockBuilderPubkey,
      builderAddress: mockBuilderAddress,
      value: 1000000000000000000n,
      gasLimit: 30000000n,
      gasUsed: 15000000n,
      slot: 1000000n,
      parentHash: mockParentHash,
      blockHash: mockBlockHash,
      feeRecipient: mockFeeRecipient,
      timestamp: 1700000000n,
    }))
    const result = await Effect.runPromise(BuilderBid.compareBids(bidA, bidB))
    expect(result).toBe(1)
  })

  it('returns -1 when first bid has lower value', async () => {
    const bidA = await Effect.runPromise(BuilderBid.from({
      builderPubkey: mockBuilderPubkey,
      builderAddress: mockBuilderAddress,
      value: 1000000000000000000n,
      gasLimit: 30000000n,
      gasUsed: 15000000n,
      slot: 1000000n,
      parentHash: mockParentHash,
      blockHash: mockBlockHash,
      feeRecipient: mockFeeRecipient,
      timestamp: 1700000000n,
    }))
    const bidB = await Effect.runPromise(BuilderBid.from({
      builderPubkey: mockBuilderPubkey,
      builderAddress: mockBuilderAddress,
      value: 2000000000000000000n,
      gasLimit: 30000000n,
      gasUsed: 15000000n,
      slot: 1000000n,
      parentHash: mockParentHash,
      blockHash: mockBlockHash,
      feeRecipient: mockFeeRecipient,
      timestamp: 1700000000n,
    }))
    const result = await Effect.runPromise(BuilderBid.compareBids(bidA, bidB))
    expect(result).toBe(-1)
  })

  it('returns 0 for equal values', async () => {
    const bidA = await Effect.runPromise(BuilderBid.from({
      builderPubkey: mockBuilderPubkey,
      builderAddress: mockBuilderAddress,
      value: 1000000000000000000n,
      gasLimit: 30000000n,
      gasUsed: 15000000n,
      slot: 1000000n,
      parentHash: mockParentHash,
      blockHash: mockBlockHash,
      feeRecipient: mockFeeRecipient,
      timestamp: 1700000000n,
    }))
    const bidB = await Effect.runPromise(BuilderBid.from({
      builderPubkey: mockBuilderPubkey,
      builderAddress: mockBuilderAddress,
      value: 1000000000000000000n,
      gasLimit: 30000000n,
      gasUsed: 15000000n,
      slot: 1000000n,
      parentHash: mockParentHash,
      blockHash: mockBlockHash,
      feeRecipient: mockFeeRecipient,
      timestamp: 1700000000n,
    }))
    const result = await Effect.runPromise(BuilderBid.compareBids(bidA, bidB))
    expect(result).toBe(0)
  })
})
