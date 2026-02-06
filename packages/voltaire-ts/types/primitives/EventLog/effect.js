import * as Brand from "effect/Brand";
import * as Schema from "effect/Schema";
import { toBytes as hexToBytes } from "../Hex/toBytes.js";
import { create as _create } from "./create.js";
import { filterLogs as _filterLogs } from "./filterLogs.js";
import { fromRpc as _fromRpc } from "./fromRpc.js";
import { matchesFilter as _matchesFilter } from "./matchesFilter.js";
const isHash32 = (b) => b instanceof Uint8Array && b.length === 32;
const isAddr20 = (b) => b instanceof Uint8Array && b.length === 20;
export const EventLogBrand = Brand.refined((x) => typeof x === "object" &&
    x !== null &&
    // biome-ignore lint/suspicious/noExplicitAny: type coercion required
    isAddr20(x.address) &&
    // biome-ignore lint/suspicious/noExplicitAny: type coercion required
    Array.isArray(x.topics) &&
    // biome-ignore lint/suspicious/noExplicitAny: type coercion required
    x.topics.every(isHash32) &&
    // biome-ignore lint/suspicious/noExplicitAny: type coercion required
    x.data instanceof Uint8Array, () => Brand.error("Invalid EventLog: failed structural validation"));
export class EventLogSchema extends Schema.Class("EventLog")({
    address: Schema.Uint8ArrayFromSelf.pipe(Schema.filter(isAddr20, { message: () => "address must be 20 bytes" })),
    topics: Schema.Array(Schema.Uint8ArrayFromSelf.pipe(Schema.filter(isHash32, { message: () => "topic must be 32 bytes" }))),
    data: Schema.Uint8ArrayFromSelf,
    blockNumber: Schema.optional(Schema.BigIntFromSelf),
    transactionHash: Schema.optional(Schema.Uint8ArrayFromSelf.pipe(Schema.filter(isHash32, { message: () => "tx hash must be 32 bytes" }))),
    transactionIndex: Schema.optional(Schema.Number),
    blockHash: Schema.optional(Schema.Uint8ArrayFromSelf.pipe(Schema.filter(isHash32, { message: () => "block hash must be 32 bytes" }))),
    logIndex: Schema.optional(Schema.Number),
    removed: Schema.optional(Schema.Boolean),
}) {
    get eventLog() {
        const { address, topics, data, blockNumber, transactionHash, transactionIndex, blockHash, logIndex, removed, } = this;
        return _create({
            address,
            topics,
            data,
            blockNumber,
            transactionHash,
            transactionIndex,
            blockHash,
            logIndex,
            removed: removed ?? false,
            // biome-ignore lint/suspicious/noExplicitAny: type coercion required
        });
    }
    get branded() {
        return this.eventLog;
    }
    static fromBranded(log) {
        const addr = 
        // biome-ignore lint/suspicious/noExplicitAny: type coercion required
        typeof log.address === "string"
            ? // biome-ignore lint/suspicious/noExplicitAny: type coercion required
                hexToBytes(log.address)
            : // biome-ignore lint/suspicious/noExplicitAny: type coercion required
                log.address;
        // biome-ignore lint/suspicious/noExplicitAny: type coercion required
        const topics = log.topics.map((t) => 
        // biome-ignore lint/suspicious/noExplicitAny: type coercion required
        typeof t === "string" ? hexToBytes(t) : t);
        const data = 
        // biome-ignore lint/suspicious/noExplicitAny: type coercion required
        typeof log.data === "string"
            ? // biome-ignore lint/suspicious/noExplicitAny: type coercion required
                hexToBytes(log.data)
            : // biome-ignore lint/suspicious/noExplicitAny: type coercion required
                log.data;
        const txHash = 
        // biome-ignore lint/suspicious/noExplicitAny: type coercion required
        typeof log.transactionHash === "string"
            ? // biome-ignore lint/suspicious/noExplicitAny: type coercion required
                hexToBytes(log.transactionHash)
            : // biome-ignore lint/suspicious/noExplicitAny: type coercion required
                log.transactionHash;
        const blockHash = 
        // biome-ignore lint/suspicious/noExplicitAny: type coercion required
        typeof log.blockHash === "string"
            ? // biome-ignore lint/suspicious/noExplicitAny: type coercion required
                hexToBytes(log.blockHash)
            : // biome-ignore lint/suspicious/noExplicitAny: type coercion required
                log.blockHash;
        return new EventLogSchema({
            address: addr,
            topics: topics,
            data: data,
            blockNumber: log.blockNumber,
            // biome-ignore lint/suspicious/noExplicitAny: type coercion required
            transactionHash: txHash,
            transactionIndex: log.transactionIndex,
            // biome-ignore lint/suspicious/noExplicitAny: type coercion required
            blockHash: blockHash,
            logIndex: log.logIndex,
            removed: log.removed,
        });
    }
    static from(params) {
        const log = _create(params);
        return EventLogSchema.fromBranded(log);
    }
    // biome-ignore lint/suspicious/noExplicitAny: type coercion required
    static fromRpc(rpc) {
        const log = _fromRpc(rpc);
        return EventLogSchema.fromBranded(log);
    }
    // biome-ignore lint/suspicious/noExplicitAny: type coercion required
    matches(filter) {
        return _matchesFilter(this.eventLog, filter);
    }
    static filter(logs, 
    // biome-ignore lint/suspicious/noExplicitAny: type coercion required
    filter) {
        const branded = logs.map((l) => l.eventLog);
        const out = _filterLogs(branded, filter);
        return out.map((b) => EventLogSchema.fromBranded(b));
    }
}
