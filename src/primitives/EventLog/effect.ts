import * as Schema from "effect/Schema";
import * as Brand from "effect/Brand";

import type { EventLogType } from "./EventLogType.js";
import { from as _from } from "./from.js";
import { create as _create } from "./create.js";
import { fromRpc as _fromRpc } from "./fromRpc.js";
import { filterLogs as _filterLogs } from "./filterLogs.js";
import { matchesFilter as _matchesFilter } from "./matchesFilter.js";
import { toBytes as hexToBytes } from "../Hex/toBytes.js";

const isHash32 = (b: unknown): b is Uint8Array => b instanceof Uint8Array && b.length === 32
const isAddr20 = (b: unknown): b is Uint8Array => b instanceof Uint8Array && b.length === 20

export type EventLogBrand = EventLogType & Brand.Brand<"EventLog">;

export const EventLogBrand = Brand.refined<EventLogBrand>(
  (x): x is EventLogBrand => typeof x === 'object' && x !== null &&
    isAddr20((x as any).address) &&
    Array.isArray((x as any).topics) && (x as any).topics.every(isHash32) &&
    (x as any).data instanceof Uint8Array,
  () => Brand.error("Invalid EventLog: failed structural validation"),
)

export class EventLogSchema extends Schema.Class<EventLogSchema>("EventLog")({
  address: Schema.Uint8ArrayFromSelf.pipe(Schema.filter(isAddr20, { message: () => 'address must be 20 bytes' })),
  topics: Schema.Array(Schema.Uint8ArrayFromSelf.pipe(Schema.filter(isHash32, { message: () => 'topic must be 32 bytes' }))),
  data: Schema.Uint8ArrayFromSelf,
  blockNumber: Schema.optional(Schema.BigIntFromSelf),
  transactionHash: Schema.optional(Schema.Uint8ArrayFromSelf.pipe(Schema.filter(isHash32, { message: () => 'tx hash must be 32 bytes' }))),
  transactionIndex: Schema.optional(Schema.Number),
  blockHash: Schema.optional(Schema.Uint8ArrayFromSelf.pipe(Schema.filter(isHash32, { message: () => 'block hash must be 32 bytes' }))),
  logIndex: Schema.optional(Schema.Number),
  removed: Schema.optional(Schema.Boolean),
}) {
  get eventLog(): EventLogType {
    const { address, topics, data, blockNumber, transactionHash, transactionIndex, blockHash, logIndex, removed } = this
    return _create({ address, topics, data, blockNumber, transactionHash, transactionIndex, blockHash, logIndex, removed: removed ?? false })
  }

  get branded(): EventLogBrand { return this.eventLog as EventLogBrand }

  static fromBranded(log: EventLogBrand): EventLogSchema {
    const addr = typeof (log as any).address === 'string' ? hexToBytes((log as any).address) : log.address
    const topics = (log.topics as any[]).map((t) => typeof t === 'string' ? hexToBytes(t) : t)
    const data = typeof (log as any).data === 'string' ? hexToBytes((log as any).data) : log.data
    const txHash = typeof (log as any).transactionHash === 'string' ? hexToBytes((log as any).transactionHash) : log.transactionHash
    const blockHash = typeof (log as any).blockHash === 'string' ? hexToBytes((log as any).blockHash) : log.blockHash
    return new EventLogSchema({
      address: addr as Uint8Array,
      topics: topics as Uint8Array[],
      data: data as Uint8Array,
      blockNumber: log.blockNumber,
      transactionHash: txHash as any,
      transactionIndex: log.transactionIndex,
      blockHash: blockHash as any,
      logIndex: log.logIndex,
      removed: log.removed,
    })
  }

  static from(params: Parameters<typeof _create>[0]): EventLogSchema {
    const log = _create(params)
    return EventLogSchema.fromBranded(log as EventLogBrand)
  }

  static fromRpc(rpc: any): EventLogSchema {
    const log = _fromRpc(rpc)
    return EventLogSchema.fromBranded(log as EventLogBrand)
  }

  matches(filter: any): boolean { return _matchesFilter(this.eventLog, filter) }

  static filter(logs: readonly EventLogSchema[], filter: any): EventLogSchema[] {
    const branded = logs.map((l) => l.eventLog)
    const out = _filterLogs(branded, filter)
    // map back by identity when possible
    const set = new Set(out)
    return logs.filter((l) => set.has(l.eventLog))
  }
}
