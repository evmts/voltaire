import { describe, it, expect } from 'vitest'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as BlockHeaderEffect from './index.js'

const ZERO_HASH = '0x' + '00'.repeat(32)
const EMPTY_BLOOM = new Uint8Array(256)
const EMPTY_NONCE = new Uint8Array(8)
const EMPTY_EXTRA = new Uint8Array(0)

describe('BlockHeader', () => {
  describe('from', () => {
    it('creates BlockHeader from params', async () => {
      const params = {
        parentHash: ZERO_HASH,
        ommersHash: ZERO_HASH,
        beneficiary: '0x' + '00'.repeat(20),
        stateRoot: ZERO_HASH,
        transactionsRoot: ZERO_HASH,
        receiptsRoot: ZERO_HASH,
        logsBloom: EMPTY_BLOOM,
        difficulty: 0n,
        number: 0n,
        gasLimit: 30000000n,
        gasUsed: 0n,
        timestamp: 0n,
        extraData: EMPTY_EXTRA,
        mixHash: ZERO_HASH,
        nonce: EMPTY_NONCE
      }
      const result = await Effect.runPromise(BlockHeaderEffect.from(params))
      expect(result).toBeDefined()
      expect(result.number).toBe(0n)
    })
  })

  describe('fromRpc', () => {
    it('creates BlockHeader from RPC format', async () => {
      const rpc = {
        parentHash: ZERO_HASH,
        sha3Uncles: ZERO_HASH,
        miner: '0x' + '00'.repeat(20),
        stateRoot: ZERO_HASH,
        transactionsRoot: ZERO_HASH,
        receiptsRoot: ZERO_HASH,
        logsBloom: '0x' + '00'.repeat(256),
        difficulty: '0x0',
        number: '0x0',
        gasLimit: '0x1c9c380',
        gasUsed: '0x0',
        timestamp: '0x0',
        extraData: '0x',
        mixHash: ZERO_HASH,
        nonce: '0x0000000000000000'
      }
      const result = await Effect.runPromise(BlockHeaderEffect.fromRpc(rpc))
      expect(result).toBeDefined()
    })
  })

  describe('calculateHash', () => {
    it('calculates hash of block header', async () => {
      const params = {
        parentHash: ZERO_HASH,
        ommersHash: ZERO_HASH,
        beneficiary: '0x' + '00'.repeat(20),
        stateRoot: ZERO_HASH,
        transactionsRoot: ZERO_HASH,
        receiptsRoot: ZERO_HASH,
        logsBloom: EMPTY_BLOOM,
        difficulty: 0n,
        number: 0n,
        gasLimit: 30000000n,
        gasUsed: 0n,
        timestamp: 0n,
        extraData: EMPTY_EXTRA,
        mixHash: ZERO_HASH,
        nonce: EMPTY_NONCE
      }
      const header = await Effect.runPromise(BlockHeaderEffect.from(params))
      const hash = BlockHeaderEffect.calculateHash(header)
      expect(hash).toBeInstanceOf(Uint8Array)
      expect(hash.length).toBe(32)
    })
  })
})
