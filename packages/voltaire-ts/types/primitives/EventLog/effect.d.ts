import * as Brand from "effect/Brand";
import * as Schema from "effect/Schema";
import { create as _create } from "./create.js";
import type { EventLogType } from "./EventLogType.js";
export type EventLogBrand = EventLogType & Brand.Brand<"EventLog">;
export declare const EventLogBrand: Brand.Brand.Constructor<EventLogBrand>;
declare const EventLogSchema_base: Schema.Class<EventLogSchema, {
    address: Schema.refine<Uint8Array<ArrayBufferLike>, Schema.Schema<unknown, Uint8Array<ArrayBufferLike>, never>>;
    topics: Schema.Array$<Schema.refine<Uint8Array<ArrayBufferLike>, Schema.Schema<unknown, Uint8Array<ArrayBufferLike>, never>>>;
    data: typeof Schema.Uint8ArrayFromSelf;
    blockNumber: Schema.optional<typeof Schema.BigIntFromSelf>;
    transactionHash: Schema.optional<Schema.refine<Uint8Array<ArrayBufferLike>, Schema.Schema<unknown, Uint8Array<ArrayBufferLike>, never>>>;
    transactionIndex: Schema.optional<typeof Schema.Number>;
    blockHash: Schema.optional<Schema.refine<Uint8Array<ArrayBufferLike>, Schema.Schema<unknown, Uint8Array<ArrayBufferLike>, never>>>;
    logIndex: Schema.optional<typeof Schema.Number>;
    removed: Schema.optional<typeof Schema.Boolean>;
}, Schema.Struct.Encoded<{
    address: Schema.refine<Uint8Array<ArrayBufferLike>, Schema.Schema<unknown, Uint8Array<ArrayBufferLike>, never>>;
    topics: Schema.Array$<Schema.refine<Uint8Array<ArrayBufferLike>, Schema.Schema<unknown, Uint8Array<ArrayBufferLike>, never>>>;
    data: typeof Schema.Uint8ArrayFromSelf;
    blockNumber: Schema.optional<typeof Schema.BigIntFromSelf>;
    transactionHash: Schema.optional<Schema.refine<Uint8Array<ArrayBufferLike>, Schema.Schema<unknown, Uint8Array<ArrayBufferLike>, never>>>;
    transactionIndex: Schema.optional<typeof Schema.Number>;
    blockHash: Schema.optional<Schema.refine<Uint8Array<ArrayBufferLike>, Schema.Schema<unknown, Uint8Array<ArrayBufferLike>, never>>>;
    logIndex: Schema.optional<typeof Schema.Number>;
    removed: Schema.optional<typeof Schema.Boolean>;
}>, never, {
    readonly address: Uint8Array<ArrayBufferLike>;
} & {
    readonly data: Uint8Array<ArrayBufferLike>;
} & {
    readonly removed?: boolean | undefined;
} & {
    readonly topics: readonly Uint8Array<ArrayBufferLike>[];
} & {
    readonly transactionHash?: Uint8Array<ArrayBufferLike> | undefined;
} & {
    readonly transactionIndex?: number | undefined;
} & {
    readonly blockHash?: Uint8Array<ArrayBufferLike> | undefined;
} & {
    readonly blockNumber?: bigint | undefined;
} & {
    readonly logIndex?: number | undefined;
}, {}, {}>;
export declare class EventLogSchema extends EventLogSchema_base {
    get eventLog(): EventLogType;
    get branded(): EventLogBrand;
    static fromBranded(log: EventLogBrand): EventLogSchema;
    static from(params: Parameters<typeof _create>[0]): EventLogSchema;
    static fromRpc(rpc: any): EventLogSchema;
    matches(filter: any): boolean;
    static filter(logs: readonly EventLogSchema[], filter: any): EventLogSchema[];
}
export {};
//# sourceMappingURL=effect.d.ts.map