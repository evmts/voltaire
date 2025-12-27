import { describe, it, expect } from 'vitest'
import { EventLogSchema } from './effect.js'

describe('EventLog Effect Schema', () => {
  it('creates from RPC log', () => {
    const rpc = {
      address: '0x' + '00'.repeat(20),
      topics: ['0x' + '00'.repeat(64)],
      data: '0x',
      blockNumber: '0x1',
      transactionHash: '0x' + '00'.repeat(32),
      transactionIndex: '0x0',
      blockHash: '0x' + '00'.repeat(32),
      logIndex: '0x0',
      removed: false,
    }
    const log = EventLogSchema.fromRpc(rpc)
    expect(log.address).toBeInstanceOf(Uint8Array)
    expect(log.address.length).toBe(20)
    expect(log.topics.length).toBe(1)
    expect(log.topics[0]?.length).toBe(32)
    expect(log.data).toBeInstanceOf(Uint8Array)
  })

  it('filters logs by address', () => {
    const addrA = '0x' + 'aa'.repeat(20)
    const addrB = '0x' + 'bb'.repeat(20)
    const mk = (addr: string) => EventLogSchema.fromRpc({ address: addr, topics: ['0x' + '00'.repeat(64)], data: '0x' })
    const logs = [mk(addrA), mk(addrB), mk(addrA)]
    const filtered = EventLogSchema.filter(logs, { address: logs[0]!.address })
    expect(filtered.length).toBe(2)
  })
})

