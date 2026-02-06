/**
 * @typedef {import('./EventStreamType.js').BackfillOptions} BackfillOptions
 * @typedef {import('../provider/TypedProvider.js').TypedProvider} TypedProvider
 */
/**
 * @typedef {object} BackfillContext
 * @property {TypedProvider} provider
 * @property {string} addressHex
 * @property {(string | null)[]} topicsHex
 * @property {(log: any) => import('./EventStreamType.js').DecodedEventLog<any>} decodeLog
 * @property {(log: any) => string} getLogKey
 */
/**
 * Backfill historical events within a block range.
 *
 * Uses dynamic chunking to handle large ranges efficiently.
 *
 * @template {import('../primitives/Abi/event/EventType.js').EventType} TEvent
 * @param {BackfillContext} context
 * @param {BackfillOptions} backfillOptions
 * @returns {AsyncGenerator<import('./EventStreamType.js').EventStreamResult<TEvent>>}
 */
export function backfillEvents<TEvent extends import("../primitives/Abi/event/EventType.js").EventType>(context: BackfillContext, backfillOptions: BackfillOptions): AsyncGenerator<import("./EventStreamType.js").EventStreamResult<TEvent>>;
export type BackfillOptions = import("./EventStreamType.js").BackfillOptions;
export type TypedProvider = import("../provider/TypedProvider.js").TypedProvider;
export type BackfillContext = {
    provider: TypedProvider;
    addressHex: string;
    topicsHex: (string | null)[];
    decodeLog: (log: any) => import("./EventStreamType.js").DecodedEventLog<any>;
    getLogKey: (log: any) => string;
};
//# sourceMappingURL=backfillEvents.d.ts.map