import { describe, it, expect } from 'vitest'
import { TransactionSchema } from './effect.js'

describe('Transaction Effect Schema', () => {
  it('parses from RPC (legacy)', () => {
    const rpc = {
      type: '0x0',
      nonce: '0x0',
      gas: '0x5208',
      to: '0x' + '11'.repeat(20),
      value: '0x0',
      data: '0x',
      v: '0x1b',
      r: '0x1',
      s: '0x2'
    }
    const tx = TransactionSchema.fromRpc(rpc)
    const rpcOut = tx.toRpc()
    expect(rpcOut).toBeDefined()
    const bytes = tx.serialize()
    expect(bytes).toBeInstanceOf(Uint8Array)
    const round = TransactionSchema.deserialize(bytes)
    expect(typeof round.format()).toBe('string')
  })

  it('detects type from bytes', () => {
    const legacyBytes = new Uint8Array([0xc0])
    expect(TransactionSchema.detectType(legacyBytes)).toBe(0)
  })
})
