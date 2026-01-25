import { describe, it, expect } from 'vitest'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as Uncle from './index.js'

describe('Uncle', () => {
  const validUncleInput = {
    parentHash: '0x' + '00'.repeat(32),
    ommersHash: '0x' + '00'.repeat(32),
    beneficiary: '0x' + '00'.repeat(20),
    stateRoot: '0x' + '00'.repeat(32),
    transactionsRoot: '0x' + '00'.repeat(32),
    receiptsRoot: '0x' + '00'.repeat(32),
    logsBloom: new Uint8Array(256),
    difficulty: 1n,
    number: 1n,
    gasLimit: 8000000n,
    gasUsed: 21000n,
    timestamp: 1234567890n,
    extraData: new Uint8Array(0),
    mixHash: '0x' + '00'.repeat(32),
    nonce: new Uint8Array(8)
  }

  describe('from', () => {
    it('creates uncle from valid input', async () => {
      const result = await Effect.runPromise(Uncle.from(validUncleInput))
      expect(result).toBeDefined()
      expect(result.number).toBeDefined()
    })

    it('fails for invalid input', async () => {
      const exit = await Effect.runPromiseExit(Uncle.from({} as Parameters<typeof Uncle.from>[0]))
      expect(Exit.isFailure(exit)).toBe(true)
    })
  })
})
