import { describe, it, expect } from 'vitest'
import { EventLogSchema } from './effect.js'

describe('EventLog Effect Schema', () => {
  it('creates from typed params', () => {
    const addr = new Uint8Array(20)
    const topic0 = new Uint8Array(32)
    topic0[31] = 1
    const log = EventLogSchema.from({ address: addr, topics: [topic0], data: new Uint8Array(0) })
    expect(log.address).toBeInstanceOf(Uint8Array)
    expect(log.address.length).toBe(20)
    expect(log.topics.length).toBe(1)
    expect(log.topics[0]?.length).toBe(32)
    expect(log.data).toBeInstanceOf(Uint8Array)
  })

  it('filters logs by address', () => {
    const addrA = new Uint8Array(20)
    const addrB = new Uint8Array(20); addrB[0] = 0xff
    const mk = (addr: Uint8Array) => EventLogSchema.from({ address: addr, topics: [new Uint8Array(32)], data: new Uint8Array(0) })
    const logs = [mk(addrA), mk(addrB), mk(addrA)]
    const filtered = EventLogSchema.filter(logs, { address: logs[0]!.address })
    expect(filtered.length).toBe(2)
  })
})
